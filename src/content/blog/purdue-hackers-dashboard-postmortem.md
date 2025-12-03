---
title: How a React mistake took down our whole backend
description:
  A story of how we tracked down a bug in a Purdue Hackers website that
  repeatedly took down our entire backend.
date: 2025-11-08
draft: false
---

Recently, at [Purdue Hackers][puhack]' weekly Hack Nights,
we've been seeing an issue where every service on our
server goes down simultaneously.
And a simple restart doesn't fix it; they keep going
back down until the night is over.

[puhack]: https://purduehackers.com

# The scene

We have some custom software powering Purdue Hackers'
events and projects, like [our webring][webring],
[a Discord bot for our community server][wack hacker],
and important to this story, [a Hack Night dashboard][dash]
complete with a digital doorbell to let us know when people
have arrived and need to be let in to the building.

Most of these services run on our in-house server,
named _Vulcan_.
To handle HTTPS termination and subdomain routing, Vulcan
runs an [Nginx] server as a reverse proxy. This means
connections to any of our services first reach Nginx,
which then routes the request to the appropriate program
(i.e., the _service_) based on the domain.
When the service has a response, it sends it to Nginx,
which then sends it back to the original client.

[webring]: https://ring.purduehackers.com
[wack hacker]: https://github.com/purduehackers/wack-hacker
[dash]: https://night.purduehackers.com
[Nginx]: https://nginx.org

# The problem

At Hack Night, everything would run fine for a few hours.
The dashboard would be projected on a large screen for
attendees to see, the doorbell would chime as people arrived,
and our other services (not critical to Hack Night) would
continue chugging along in the background.

But after a few hours, the doorbell would stop working.
And not only the doorbell, but in fact every service on Vulcan
would become unreachable, instead returning
[HTTP 503 "Service Unavailable"][503] errors.

Of course, the natural response is to assume it's a
temporary problem (especially for a 503 response) and try
restarting the services and the Nginx proxy.
This would help for a short while, but the problem would
quickly appear again.
This past Hack Night, we restarted Nginx 5 times (as
far as I can tell from reading our chat logs).
Obviously, it was not a temporary error, and needed
some looking into.

[503]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503

# Finding the root cause

With software systems
--- and I'm sure with many other kinds of systems too ---
the symptoms you see (like the 503 errors) don't necessarily
tell you what went wrong.

Our fantastic system administrator, [Lillith], first looked at
the Nginx logs, which come in two forms:
the access log and the error log.
The access log records some information about each request
that Nginx processes, and the error log is where Nginx prints
any internal errors it encounters.[^errors]

[^errors]: By internal errors, we mean errors within Nginx, not just problems that cause HTTP errors. For example, the infamous HTTP 404 error, which means a page wasn't found, doesn't necessarily mean something is wrong with Nginx. Most likely, a client tried to request a page that just doesn't exist. So the error logs only record errors that happen _inside_ Nginx.

The access log looked something like this, with hundreds of thousands of entries for `GET /doorbell`:
```
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
10.186.92.108 - - [08/Nov/2025:07:51:15 +0000] "GET /doorbell HTTP/1.1" 503 592 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
...
```

And in the error log, Lillith found this, again repeated many times:
```
Nov 08 01:50:08 vulcan nginx[2192612]: 2025/11/08 01:50:08 [alert] 2192612#2192612: *972425 512 worker_connections are not enough while connecting to upstream, client: 10.186.92.108, server: api.purduehackers.com, request: "GET /doorbell HTTP/1.1", upstream: "http://127.0.0.1:4226/doorbell", host: "api.purduehackers.com"
```

This gives us a clue as to what went wrong!

## Nginx workers

Since Nginx forwards requests from clients to the services
running on Vulcan, and sends the responses back to the right
clients, it has to keep track of each in-flight request,
particularly holding open the connection to the client
and the connection to the "upstream" service.

It does this using a
[pool of worker threads][thread pool],
each of which can handle
[up to a fixed number of connections][worker_connections].
If each worker thread's connection limit is saturated,
then Nginx can't handle any more requests, and will respond
with the 503 "Service Unavailable" errors we saw before.

So the error message
`worker_connections are not enough while connecting to upstream`
means that Nginx's connection limit has been reached,
and it can't open any more connections.

What can we do?
Well, raising the `worker_connections` limit is one option,
but this is almost always a bad idea.
If the connection limit is being reached, either we have
hundreds of thousands of simultaneous doorbell users
(we don't), or some piece of our software is acting up.
If we increase the connection limit, it might buy us some
time, but we're just going to hit the new limit eventually.

Another option is to implement a per-client connection limit.
This way, when the flood of requests happens, it'll only saturate that client's
connection limit, leaving plenty of connections for other clients' requests.
This would prevent whatever is broken from affecting other users, but it
would still result in that client facing issues, as it wouldn't be able to
send the requests it needs to.

> Side note (except it's not on the side):
>
> We (Lillith) did end up implementing a per-client connection limit,
> as it's a good
> idea in general. Even if we fix this issue, we don't want a malicious user to
> be able to hog all the connections and prevent legitimate users from accessing
> Vulcan's services.
>
> Now back to the digging...

Instead of just adjusting the connection limits,
we need to figure out what is causing so many
connections to be opened. The access log gives us a clue
here: `GET /doorbell`. This means we're seeing a flood
of requests specifically for the `/doorbell` API endpoint.

[thread pool]: https://en.wikipedia.org/wiki/Thread_pool
[worker_connections]: https://nginx.org/en/docs/ngx_core_module.html#worker_connections


## Doorbells and WebSockets

The members who wrote the doorbell system informed me that
it communicates using [WebSockets].
WebSockets are a technology that allow the client and server
to open a persistent connection and periodically send updates
over that channel.
This is different from the typical request model on the web,
where you send a request for a site, get the response content,
and end the connection.

These persistent WebSocket connections make perfect sense for
a digital doorbell. Our Hack Night dashboard can open a
persistent connection to the doorbell service, and when the
doorbell is rung, the service sends an update to the dashboard
so it can display a message and play a sound.

So how does this tie in to what we've found so far?
Well the flood of requests is `GET /doorbell`.
WebSocket connections are first established by sending a
regular HTTP `GET` request, which contains a special
piece of information informing the server that you'd like to
establish a WebSocket.
This is great! Now we know that the problem is we're trying to
open thousands of new WebSocket connections at once.
This would absolutely explain why Nginx's connection limit
is being saturated...

The members who wrote the doorbell system also told me that
they're using the [`reconnecting-websocket` library][recon-ws]
to create the WebSocket connections. This library will handle
automatically re-connecting if for some reason the connection
is closed, like if we restart the server or there's a temporary
network connectivity issue.

Maybe at this point you can guess what went wrong.
Our guess was that `reconnecting-websocket` tries to reconnect
immediately if a connection fails, without any sort of delay.
So if a connection failed, it would immediately try to
reconnect, which would fail, and thus it would enter a loop,
attempting thousands of reconnections.

[WebSockets]: https://developer.mozilla.org/en-US/docs/Glossary/WebSockets
[recon-ws]: https://github.com/pladaria/reconnecting-websocket

## Digging into the code

Now that we had a hypothesis, it was time to refer to the code
to see if we could confirm and fix the issue.
I cloned the repository which stores the code for our
Hack Night dashboard and doorbell website, searched through
it a bit, and found this:
```ts
const ws = useRef<ReconnectingWebSocket | null>(null);
// ...
useEffect(() => {
    ws.current = new ReconnectingWebSocket(
        "wss://api.purduehackers.com/doorbell"
    );

    ws.current.onopen = () => setConnectionState(ConnectionState.Connected);
    ws.current.onclose = () => {
        setConnectionState(ConnectionState.Connecting);
    };
    ws.current.onerror = () => {
        setConnectionState(ConnectionState.Error);
    };
});
```

Great! This is the point in the code where we create a
new reconnecting WebSocket, as we can see from the
`new ReconnectingWebSocket()` call.
It looks like we're not giving it any options that might
control things like delays between reconnection attempts.
Could this be the issue?

I looked at the documentation for `reconnecting-websocket`
and found this list of available options:
```ts
type Options = {
    WebSocket?: any; // WebSocket constructor, if none provided, defaults to global WebSocket
    maxReconnectionDelay?: number; // max delay in ms between reconnections
    minReconnectionDelay?: number; // min delay in ms between reconnections
    reconnectionDelayGrowFactor?: number; // how fast the reconnection delay grows
    minUptime?: number; // min time in ms to consider connection as stable
    connectionTimeout?: number; // retry connect if not connected after this time, in ms
    maxRetries?: number; // maximum number of retries
    maxEnqueuedMessages?: number; // maximum number of messages to buffer until reconnection
    startClosed?: boolean; // start websocket in CLOSED state, call `.reconnect()` to connect
    debug?: boolean; // enables debug output
};
```

`minReconnectionDelay` and `maxReconnectionDelay` certainly
look promising. But after scrolling down a bit, I found the
list of default values, which contained this:
```ts
maxReconnectionDelay: 10000,
minReconnectionDelay: 1000 + Math.random() * 4000,
```
The default settings (which we're using since we don't provide
our own) already limit reconnections to happen at most once
per second!
This is much too slow to be causing the issue we're seeing;
if you take a look at the timestamps in the access log excerpt
above, you can see that we're getting many requests within
the _same_ second.
So the issue can't be that we're just reconnecting too
frequently...

## The real problem

If you're familiar with the web framework [React],
you may have noticed the issue already.
Take a look at the code again, and notice that we're creating
the WebSocket inside of this `useEffect()` function:
```ts
useEffect(() => {
    ws.current = new ReconnectingWebSocket(
        "wss://api.purduehackers.com/doorbell"
    );

    ws.current.onopen = () => setConnectionState(ConnectionState.Connected);
    ws.current.onclose = () => {
        setConnectionState(ConnectionState.Connecting);
    };
    ws.current.onerror = () => {
        setConnectionState(ConnectionState.Error);
    };
});
```

What does this mean?
[`useEffect()` is a _React hook_][useEffect]
that (as far as we're concerned) re-runs some code
each time your component's _state_ changes.
If you provide `useEffect()` with a list of
_dependency values_, it will re-run your code each time one
of these dependencies changes.
However, we aren't providing it a list of dependencies.
This means that our code that creates a new WebSocket
will run **every time _any_ state changes**.
That means any time anything on the page changes,
including a clock that updates **every second**,
a new WebSocket connection will be opened.

Now this is certainly the issue.
Let's imagine what might happen because of this bug:
1. We open the dashboard.
2. Every second, it creates a new WebSocket connection.
3. After just an hour, we already have 3,600 connections open!
4. As this continues, we slowly use up all of Nginx's connections.
5. Once the connection limit is reached, 503 errors are returned, and some of the WebSocket connections may be closed.
6. Those closed connections will attempt to reconnect, causing a flood of thousands of reconnection requests which will all fail because we've reached the connection limit.
7. Any other requests to other services will _also_ fail because Nginx has no connections in its budget to handle those.


[React]: https://react.dev
[useEffect]: https://react.dev/reference/react/useEffect


# The fix

This sounds like a nightmare.
Surely such a complicated problem must have a complicated solution, right?
**Wrong!**
The fix for this is... drumroll please... a measly _4 extra characters_!

All we need to do is insert `, []` at the end of our
`useEffect()` call:
```diff
 useEffect(() => {
     ws.current = new ReconnectingWebSocket(
         "wss://api.purduehackers.com/doorbell"
     );

     ws.current.onopen = () => setConnectionState(ConnectionState.Connected);
     ws.current.onclose = () => {
         setConnectionState(ConnectionState.Connecting);
     };
     ws.current.onerror = () => {
         setConnectionState(ConnectionState.Error);
     };
-});
+}, []);
```

What does this do?
As mentioned earlier, we can give `useEffect()` a list
of dependency values, and it will re-run our function only
when one of these values changes. By giving it an empty list
(that's what the empty square brackets mean), we tell it that
this code never needs to be re-run. It will now only be run
once, when the component is first added to the page.

This is exactly what we need, as we just want one WebSocket
connection, which gets created when we load the page, and
persists as long as we need it to.

By adding a `console.log()` statement to the function
passed to `useEffect()`, I was able to confirm that we
were indeed creating an endless amount of WebSocket
connections, and that this tiny fix did indeed fix the problem.

# Come join us!
Like what you've read?
If you're a student at Purdue,
[come join Purdue Hackers][puhack]!
We'd love to have you :)

Thanks to [Lillith], [Ray], and [Hazel] for their help finding &
fixing this issue.

[Lillith]: https://inx.moe
[Ray]: https://rayhanadev.com
[Hazel]: https://fizzyapple12.com
