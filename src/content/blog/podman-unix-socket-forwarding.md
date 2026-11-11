---
title: Forcing Podman containers to listen on UNIX domain sockets
date: 2026-11-11T00:26:57-05:00
description:
  How to use Podman pods and systemd socket activation to make Podman containers
  which normally only support AF_INET (TCP/IP) sockets to support listening on
  AF_UNIX (Unix domain) sockets.
---

I guess I just love
[talking about sockets and containers](/blog/2024/06/18/systemd-docker-socket-activation/),
don't I?

# The problem
First, what am I trying to solve?
I have a shared Linux server, on which there is a [Caddy] HTTP reverse proxy.
I want to run some services and ensure that all traffic to them comes through Caddy.

Since this server is shared, there are other users.
If I simply run a [Podman] container and use `-p 127.0.0.1:12345:80`, the service
will be published on port 12345 outside of the container's network namespace, meaning
other users of the server would be able to access the service directly without
going through Caddy.

[Podman]: https://podman.io/
[Caddy]: https://caddyserver.com/

# The solution
To solve this, I want to make my service listen on a [UNIX domain socket]
instead. UNIX domain sockets are sockets that exist as a filesystem node, so you
can govern access to them using standard filesystem permissions.

To do this, we can just mount a directory into the container (say, `-v /run/myserv:/run/myserv`),
and then have the service create/bind a socket in that directory.
Since the directory is bind-mounted from the host, the socket will be present on
the host filesystem and can be controlled with filesystem permissions.

Unfortunately, the services I'm running don't support listening on a UNIX domain
socket; they only support TCP/IP addresses.

[UNIX domain socket]: https://en.wikipedia.org/wiki/Unix_domain_socket

# The more complicated solution
There's still a way to make this work.
We can let the service listen on a TCP/IP port, but not publish it outside of the container.
Then we can run another process inside the container's network namespace that
listens on a UNIX domain socket and forwards all of the traffic to the TCP/IP
port.

> [!NOTE]
> Tangent: I've mentioned network namespaces twice now. What are they?
>
> In a container, there is a "virtual" network. You don't see the same
> interfaces as you do on the host, and the IP addresses are different.
> This is thanks to a network [namespace], which provides an isolated view of
> network resources such as interfaces, addresses, and sockets.
>
> Since our service is listening on `127.0.0.1:80` inside the container's
> network namespace, if we want to connect to it, we need to also be inside
> the network namespace.

There are several ways to accomplish this:
1. We could modify the service's container image to include a process that does
   this proxying. I don't like this idea because I'd rather not have to maintain
   my own container image, e.g. keeping it updated when the upstream image gets
   updated.
2. We can create another container to run the proxy, and connect the two
   containers to the same [Podman network].[^not-a-namespace]
3. We can create another container to run the proxy, and add both containers to
   a Podman pod. This is the approach I chose.

[^not-a-namespace]: I'm not entirely sure if separate containers in the same
Podman network share a network namespace or not. I believe the separate
containers might have separate network namespaces, but are configured such that
they can still route TCP/IP traffic to each other.

[namespace]: https://man.archlinux.org/man/core/man-pages/namespaces.7.en
[Podman network]: https://docs.podman.io/en/latest/markdown/podman-network.1.html


## What is a pod?
A pod is a unit that groups related containers.
Containers in a pod can share some kinds of namespaces, one of which is the network variety.
Containers in the same pod also share the same IP address, so instead of acting
as separate hosts which can reach each other on the network (as we'd have with
approach #2 above), the containers act like separate processes on the same host
(i.e. they share the same port space).
This isn't a big deal, though it makes things slightly simpler since we don't
have to worry about the containers' hostnames.

If we run our regular service in one container and the proxy in another container,
and add both to the same pod, they'll be in the same network namespace and thus the
proxy can easily forward traffic to the service by connecting to `127.0.0.1:80`.

## Systemd socket activation
Now that we know how the proxy and service will communicate, how do we get a
UNIX domain socket that is accessible from the host and the proxy container?
We could use the same bind mount strategy I mentioned before, where we mount a 
directory into the container and have the proxy create the socket in there.

This works fine, but it can be annoying to deal with filesystem permissions when
using bind mounts in rootless Podman containers. Also, managing the permissions
of the socket file so that Caddy can access it is best done by the process that
creates the socket.[^races] But it would be awkward to encode information about
users/groups/permissions that exist on the host into the container, especially
because rootless containers are subject to UID/GID mapping.[^uid-gid-mapping]

[^races]: Why is this the case? Well, the socket file gets created at some
unknown time after the process starts (e.g. after parsing command-line
arguments, initializing data, etc.). If we fork off the process that creates the
socket file, and then immediately try to set the permissions, it's possible
we'll try to set the permissions before the file exists. We could add some delay
between starting the process that creates the socket file and setting the
permissions, but hard-coded delays are brittle (and slow). It's best to let the
process which creates the file set the permissions, as it knows exactly when it
has created the file.

[^uid-gid-mapping]: While I won't cover the details, UID/GID mapping means that
there are "virtual" UIDs and GIDs inside the container (again thanks to
namespaces) which correspond to different UIDs/GIDs on the host. This is why you
can be root (UID 0) inside your container despite not being root outside it.
It's possible that UID `1234` in the container maps to `101024` on the host, so
if we expect UID `1234` to be `caddy`, we might run into issues. This is why I
prefer to do the permission management outside the containers.

Instead, it would be better if we could create the socket outside the container
and pass it into the container for the proxy to listen on. This way we can also
manage the permissions from outside the container, where there's no UID/GID
mapping involved. It turns out we can do this very easily, using a [systemd
socket unit].

Systemd socket units are usually used to allow systemd (a service manager) to
listen on a socket without starting a service, then when a connection is
received, lazily start the service and transfer the socket to it.
For example, systemd could listen on port 22 to avoid starting SSHd until it
is actually needed, then start it and pass it the socket when someone tries to
log in.

The way it works is systemd creates the socket and binds to it. It then waits
until a connection is received. Once that happens, it forks a new process and
executes the service command, but it doesn't close the socket file descriptor
before doing so. Thus the socket stays open on a predetermined file descriptor
(by default 3).
The service can just use file descriptor 3 as it would normally use its own
socket, e.g. to `accept()` the incoming connection.

We can use this to accomplish what we want: systemd will create the socket and
then pass it as an open file descriptor to our proxy container, so the proxy
never has to worry about touching the filesystem. We can also make systemd set
the permissions of the socket file, which we'll see later.

## What is the proxy?
I've described the proxy container, but what software will it actually run?
I chose [`socat(1)`], a utility meant for relaying between sockets.
We can run it like this:
```sh
socat ACCEPT-FD:3,fork TCP:127.0.0.1:80
```
Here's what the command means:
- `ACCEPT-FD:`: accept connections on an already-open socket descriptor
- `3`: the socket is on file descriptor #3
- `,fork`: fork a new process for each connection received, so we can handle them concurrently
- `TCP:`: the upstream to connect to is a TCP/IP server
- `127.0.0.1`: the address to connect to
- `:80`: the port to connect to

We can use the `docker.io/alpine/socat` container image for this.
[Its image definition] is extremely simple:
```docker
FROM alpine:latest
RUN apk --upgrade --no-cache add socat
ENTRYPOINT ["socat"]
```

[systemd socket unit]: https://man.archlinux.org/man/core/systemd/systemd.socket.5.en
[`socat(1)`]: https://man.archlinux.org/man/socat1.1.en
[Its image definition]: https://github.com/alpine-docker/multi-arch-docker-images/blob/master/socat/Dockerfile

# Practical example

Here's an example of using exactly this setup to run a Vaultwarden container and
have it listen on `~/vaultwarden.sock`, with read/write permission granted to
the `caddy` group.

The Podman pieces are specified as [Quadlet] files.

[Quadlet]: https://docs.podman.io/en/latest/markdown/podman-quadlet.1.html

## `vaultwarden.pod`

This file declares the pod for our containers to join.
We don't need to set any settings; this unit just needs to exist.

```systemd
[Unit]
Description=Vaultwarden pod

[Pod]

[Install]
WantedBy=default.target
```

We add `WantedBy=default.target` because this is the unit we want to start automatically.
The pod will start the containers belonging to it.

## `vaultwarden.container`

This file defines the Vaultwarden service container.

```systemd
[Unit]
Description=Vaultwarden

[Container]
Image=ghcr.io/dani-garcia/vaultwarden:latest-alpine
ContainerName=vaultwarden
Volume=vaultwarden.volume:/data
# You may notice that vaultwarden.volume is referenced. I don't show the Quadlet
# file for it since it's not pertinent to the socket setup.
EnvironmentFile=%h/env

Pod=vaultwarden.pod
Environment=ROCKET_ADDRESS=127.0.0.1
Environment=ROCKET_PORT=80
```

This is what one might expect from a service container, except there is no
`PublishPort=` setting.
Instead, we use `Pod=vaultwarden.pod` to join the pod.

## `vw-proxy.socket`

This file defines the socket unit, which is the specification systemd will use
to create and bind to the UNIX domain socket.

```systemd
[Unit]
Description=Socket for vw-proxy.container

[Socket]
# %h = home directory
ListenStream=%h/vaultwarden.sock
ExecStartPost=/usr/bin/setfacl -m g:caddy:rw %h/vaultwarden.sock
```

Note the `ExecStartPost=` command;
this runs after systemd has created the socket file.
`setfacl -m g:caddy:rw <file>` will set an [ACL] that allows the `caddy` group
to read and write the socket file.

[ACL]: https://man.archlinux.org/man/core/acl/acl.5.en

## `vw-proxy.container`

```systemd
[Unit]
Description=Vaultwarden socket proxy
Requires=vw-proxy.socket

[Container]
AutoUpdate=registry
Image=docker.io/alpine/socat:latest
RunInit=true
ContainerName=vw-proxy
Pod=vaultwarden.pod
Exec=ACCEPT-FD:3,fork TCP:127.0.0.1:80
```

The arguments after `Exec=` are the same as described earlier.

Note that in the `[Unit]` section, we have `Requires=vw-proxy.socket`. If we
don't include this, systemd assumes that our service is capable of creating its
own socket, and thus can run without starting the corresponding socket unit.
Since we're telling `socat` to assume a socket is open on file descriptor 3, we
need systemd to create it for us, so we add the dependency.

## Running it all

All we need to do is put the Quadlet files (`.container` and `.pod`) in
`~/.config/containers/systemd` and the `.socket` file in `~/.config/systemd/user`.
Then we run `systemctl --user daemon-reload` to load the new units, and
`systemctl --user start vaultwarden-pod.service` to start our pod.[^pod-name]

[^pod-name]: Note that the name of the pod in the command is
`vaultwarden-pod.service`, not `vaultwarden.pod`. The suffix `.pod` is a Quadlet
invention, not part of systemd, so it gets translated to a standard `.service`
unit name.
