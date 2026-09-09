---
title: How to ask for technical help
description: Some tips for how to more effectively ask for help when something goes wrong on your computer.
draft: true
---

I often get asked for help with technical issues from friends and fellow
students, and for the most part, I enjoy fixing the issues they're running into
(or at least trying).
However, the process is made much easier for both sides when the person asking
for help knows how to do so effectively.

Here are some tips for how to ask for help effectively.
This is specifically aimed at technical issues, e.g. when something breaks on
your computer, you get an error you weren't expecting, etc.

**Don't say "it didn't work."**
To be completely honest, saying that is useless. You wouldn't be asking for help
if things were working as expected.
**Instead, phrase your issue as "I expected X to happen when I did Y, but I saw
Z instead."**
When you run into an issue, you know there's an issue because you had some
expectation for what should happen, but you instead saw something unexpected.
Thus in my opinion the most effective way to get someone else on the same page
about your issue is to describe to them exactly that.

**Include the full error details.**
If your issue is in the form of an error, there's likely an error message
printed. Include the full error message.
Error messages are not magic; they exist because a programmer of a tool decided
_if this operation fails, it would be useful to print out this information_.
Thus if you want someone to help fix the issue, there's a high chance they'll
need to make use of some or all of that information. There are few cases when
error messages include _too much_ information (except when compiling C++ code
😉). Even if there is too much information, it's better to just communicate all
of it and let the person assisting you decide which parts they need than to go
back and forth giving one extra piece of information at a time until they have
the details they need. Another problem I run into often is the person asking for
help doesn't realize that certain parts of the error message are
important/meaningful when in fact they are.

**Don't succumb to the [XY problem].**
See the link for more details.
Basically, make sure you include the original problem when describing your
issue. Another way to phrase this is "describe the goal, not the step."

[XY problem]: https://xyproblem.info/

**[Don't ask to ask].**
This one really only applies to online forums/chat platforms.
Basically, if you have a question, just ask it, rather than asking if you can
ask your question.

[Don't ask to ask]: https://dontasktoask.com/

**Make sure you have the issue in hand.**
Ideally, your issue should be reproducible, meaning you can do the thing you
were trying to do again and it'll fail in the same way.
If it's not reproducible, that's okay, but in that case make sure you have the
details of the issue (such as exactly what you did and what errors you got) in
hand.
Try to avoid doing the thing, seeing the issue, and then trying to describe it
from memory.

Similarly, when you're writing some code, if you run into an issue, then change
your code to try to fix the issue, you may make it so that the same issue
doesn't occur anymore, but your code is still "broken." If this is the case, try
not to ask about the issue you had previously now that your code doesn't exhibit
it anymore. Using version control is a great way to avoid this.
For example, if your code has an infinite loop, and you try to fix it and end up
breaking something else, don't say "_Well a few minutes ago I had an infinite
loop but I deleted some lines and now I have a different issue. Can you help me
figure out the infinite loop?_" It's going to be very difficult or impossible to
debug the issue if the person helping you can't see it.

Finally, **don't be afraid to learn.**
Sometimes when people ask me how to fix an issue, I will describe the cause of
the issue but instead of giving them a direct answer for how to fix it, I will
point them to further reading. For example, I may say, "_You can use the `du`
command to find large files to delete. Use `man du` to learn about it,_" if
someone runs out of disk space. The reason for this is that I believe that
learning more about the topic will not only allow you to fix the current issue,
but will also provide you with the ability to solve similar likely issues on
your own.

In some cases, there are existing answers to common questions. Instead of
repeating the same information that is already out there, the person helping you
may just point you to it instead, as it saves their time. Don't take this as a
sign that they don't want to help you; they're just giving you the information
you need in a more efficient way.

# Example

Unhelpful:

> I can't run commands on the data server.

There could be many reasons. Maybe you can't log in. Maybe you can log in but
can't type anything in the shell. Maybe the program you're trying to run doesn't
exist. Maybe the command you're trying to run is writing to a file and you're
reached your filesystem quota. Maybe you've messed up your `PATH` variable and
your shell just can't find any commands. Maybe you can actually run commands,
but the command you're running encountered some error (e.g. you could be trying
to read files you don't have access to) and you've misinterpreted that as being
unable to run the command.

Helpful:

> When I run the `ls` command on the data server, I expect to see it list files,
> but instead it fails with the error message
> `zsh: fork failed: resource temporarily unavailable`.

I immediately have much more information here. Even before I look at the error
message, I now know what command is being run. This tells me that it's not a
login issue if they're able to reach the server and run a command. The error
must not be that the program doesn't exist, as `ls` is definitely provided on
the data server (although misconfigured `PATH` is still possible). It must not
be a filesystem quota issue, as `ls` doesn't create/write files.

So even without looking at the error message, I've ruled out many of the
possible causes.

Now let's consider the error message.

- `zsh:` tells us the error is coming from the shell itself, not the `ls`
  command. Thus the error is before executing the `ls` program.
- `fork failed:` tells us the shell's call to `fork(2)` has failed, meaning it
  isn't able to create a new process to run `ls` in.
- `resource temporarily unavailable` tells us that the problem has to do with
  some resource availability.

Given this, I am 90% confident that the issue is caused by the user having
reached the limit on the number of processes they can run.

Note also how in this example, every part of the error message is meaningful. If
you included just `zsh: fork failed`, I wouldn't know _why_ it failed. If you
included just `resource temporarily unavailable`, I wouldn't know _what_ failed.
If just `zsh:` was left out, in this case I would still be able to diagnose the
issue, but in other cases, there might be multiple places where the same issue
could occur; thus knowing what program/function failed is useful.
