---
title: "Profiling ZSH: How I made my shell start 90% faster"
date: 2024-07-18T11:44:57-07:00
description:
  Tips and tricks to find and fix slowness in your shell's initialization
  scripts.
---

Over the years, my `.zshrc` has grown to include many tricks & tools I rely on daily.
But it also meant that my shell took a fair amount of time to start up, around 1 second:

```txt
$ time zsh -i -c exit
...
zsh -i -c exit  0.31s user 0.14s system 47% cpu 0.949 total
```

One second may not sound like a lot, but it meant that every time I opened a new
terminal tab, my shell prompt wouldn't show up until after I started typing.

<video controls style="max-width: 100%; border-radius: 10px;">
  <source src="/assets/zslow.webm" type="video/webm" />
</video>

It had annoyed me enough, and I decided to see what I could do to fix the
problem. In the end, I got the startup time down to ~0.1 seconds, or an 89%
improvement.

## 1. Finding the slow points

Zsh comes with a builtin profiler, which is incredibly useful.

To use it, we must add the following lines at the start and end of `~/.zshrc`:

```sh
zmodload zsh/zprof

# Rest of zshrc here

zprof
```

This will produce the following output:
```txt
$ zsh -i -c exit
num  calls                time                       self            name
-----------------------------------------------------------------------------------
 1)    2         131.38    65.69   23.34%    131.38    65.69   23.34%  compdump
 2)    2         344.01   172.00   61.10%     94.09    47.04   16.71%  compinit
 3) 1753          93.85     0.05   16.67%     93.85     0.05   16.67%  compdef
 4)    1         206.45   206.45   36.67%     74.19    74.19   13.18%  nvm_auto
 5)    2         132.26    66.13   23.49%     68.54    34.27   12.17%  nvm
 6)    1          53.79    53.79    9.55%     43.33    43.33    7.70%  nvm_ensure_version_installed
 7)    4          24.76     6.19    4.40%     24.76     6.19    4.40%  compaudit
 8)    1          10.46    10.46    1.86%     10.46    10.46    1.86%  nvm_is_version_installed
 9)    1           9.84     9.84    1.75%      9.79     9.79    1.74%  nvm_die_on_prefix
10)    1           3.38     3.38    0.60%      3.32     3.32    0.59%  enable_vi_mode
11)    1           3.15     3.15    0.56%      3.11     3.11    0.55%  _zsh_highlight_load_highlighters
12)    1           2.83     2.83    0.50%      2.83     2.83    0.50%  iterm2_print_state_data
13)    1           5.94     5.94    1.06%      1.68     1.68    0.30%  load_syntax_highlighting
14)    1           0.65     0.65    0.12%      0.65     0.65    0.11%  _zsh_highlight__function_callable_p
15)    3           0.32     0.11    0.06%      0.29     0.10    0.05%  add-zle-hook-widget
16)    3           0.24     0.08    0.04%      0.24     0.08    0.04%  is-at-least
17)    4           0.22     0.05    0.04%      0.22     0.05    0.04%  add-zsh-hook
18)    1           0.08     0.08    0.02%      0.08     0.08    0.02%  nvm_has
19)    1           0.06     0.06    0.01%      0.06     0.06    0.01%  zvm_exist_command
20)    4           0.06     0.01    0.01%      0.06     0.01    0.01%  nvm_npmrc_bad_news_bears
21)    1           0.07     0.07    0.01%      0.03     0.03    0.01%  complete
22)    1           0.03     0.03    0.00%      0.03     0.03    0.00%  (anon) [/usr/share/zsh/5.9/functions/add-zle-hook-widget:28]
23)    1         206.46   206.46   36.67%      0.01     0.01    0.00%  nvm_process_parameters
24)    1           0.01     0.01    0.00%      0.01     0.01    0.00%  _zsh_highlight__is_function_p
25)    1           0.01     0.01    0.00%      0.01     0.01    0.00%  bashcompinit
26)    1           0.01     0.01    0.00%      0.01     0.01    0.00%  iterm2_print_user_vars
27)    1           0.00     0.00    0.00%      0.00     0.00    0.00%  nvm_is_zsh
28)    1           0.00     0.00    0.00%      0.00     0.00    0.00%  _zsh_highlight_bind_widgets
```

The actual output is much longer; I've just selected the portion I'm going to
reference.

The slowest portion of my zshrc is the `comp*` functions, which initialize the
Zsh completions system (see `zshcompsys(1)`). This is unfortunate, as
completions are absolutely necessary for me.

But wait! Look at the second column, the number of times each function was
called. `compinit` was called twice! (*`compinit` calls `compdump` and
`compdef`, so I'll only focus on the former going forward.*)

`compinit` only needs to run once to initialize completions, so that's
definitely something to look into.

We can also see that loading NVM (Node.js Version Manager) takes a long time.
That's something I don't use all that often, but I definitely do need it
sometimes. So I can't uninstall it, but later on we'll see a trick to avoid
having to load it every time we start Zsh.

## 2. Removing extra compinit calls

Before I can remove the second call to `compinit`, I need to find where it happens. I first checked my own zshrc:

```txt
$ grep -n compinit ~/.zshrc
143:autoload -Uz compinit # Load compinit
144:compinit              # Initialize completions
```

As expected, it's only called once in my zshrc. The second call must come from
one of the other scripts my zshrc calls.
To find out where exactly, we can use Zsh's `--sourcetrace` option:

```txt
$ zsh -i --sourcetrace -c exit
+/etc/zshrc:1> <sourcetrace>
+/Users/kian/.zshrc:1> <sourcetrace>
+/Users/kian/.bun/_bun:1> <sourcetrace>
+/Users/kian/.config/nvm/nvm.sh:1> <sourcetrace>
+/Users/kian/.config/nvm/bash_completion:1> <sourcetrace>
+/Users/kian/.iterm2_shell_integration.zsh:1> <sourcetrace>
+/opt/homebrew/opt/zsh-vi-mode/share/zsh-vi-mode/zsh-vi-mode.plugin.zsh:1> <sourcetrace>
+/opt/homebrew/opt/zsh-vi-mode/share/zsh-vi-mode/zsh-vi-mode.zsh:1> <sourcetrace>
+/Users/kian/.config/aliases:1> <sourcetrace>
+/opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh:1> <sourcetrace>
+/opt/homebrew/Cellar/zsh-syntax-highlighting/0.8.0/share/zsh-syntax-highlighting/highlighters/brackets/brackets-highlighter.zsh:1> <sourcetrace>
+/opt/homebrew/Cellar/zsh-syntax-highlighting/0.8.0/share/zsh-syntax-highlighting/highlighters/cursor/cursor-highlighter.zsh:1> <sourcetrace>
+/opt/homebrew/Cellar/zsh-syntax-highlighting/0.8.0/share/zsh-syntax-highlighting/highlighters/line/line-highlighter.zsh:1> <sourcetrace>
+/opt/homebrew/Cellar/zsh-syntax-highlighting/0.8.0/share/zsh-syntax-highlighting/highlighters/main/main-highlighter.zsh:1> <sourcetrace>
+/opt/homebrew/Cellar/zsh-syntax-highlighting/0.8.0/share/zsh-syntax-highlighting/highlighters/pattern/pattern-highlighter.zsh:1> <sourcetrace>
+/opt/homebrew/Cellar/zsh-syntax-highlighting/0.8.0/share/zsh-syntax-highlighting/highlighters/regexp/regexp-highlighter.zsh:1> <sourcetrace>
+/opt/homebrew/Cellar/zsh-syntax-highlighting/0.8.0/share/zsh-syntax-highlighting/highlighters/root/root-highlighter.zsh:1> <sourcetrace>
```

With `--sourcetrace`, Zsh prints out every file it sources. I started searching
through these to see if any of them call `compinit`:

```txt
$ grep -n compinit /etc/zshrc
$ grep -n compinit ~/.bun/_bun
934:if ! command -v compinit >/dev/null; then
935:    autoload -U compinit && compinit
```

This looked promising: `~/.bun/_bun` calls `compinit` if the command doesn't
already exist. For reference, that script is installed by [Bun](https://bun.sh)
and loads completions for Bun.

I took a look in my zshrc and noticed that the `~/.bun/_bun` was being loaded
before I load & call `compinit`:

```txt {linenos=false}
$ cat -n ~/.zshrc
    67  # bun completions
    68  [ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

    ...

   142  zmodload zsh/complist # Load menu selection module
   143  autoload -Uz compinit # Load compinit
   144  compinit              # Initialize completions
```

Given the fact that `~/.bun/_bun` only loads & calls `compinit` if it hasn't
already been loaded, I tried just moving the line that sources the Bun script
after the part of my zshrc that runs `compinit`.

I noticed that NVM's completion script was also conditionally calling
`compinit`, so I moved that to happen later in the zshrc as well.

And it worked! Here's a trimmed output from the profiler after making that
change:

```txt {linenos=false}
num  calls                time                       self            name
-----------------------------------------------------------------------------------
 1)    2         141.52    70.76   64.66%     76.87    38.44   35.12%  nvm
 2)    1          54.66    54.66   24.97%     44.22    44.22   20.20%  nvm_ensure_version_installed
 3)    1         179.52   179.52   82.02%     38.00    38.00   17.36%  nvm_auto
 4)    2          15.64     7.82    7.14%     15.64     7.82    7.14%  compaudit
 5)    1          10.43    10.43    4.77%     10.43    10.43    4.77%  nvm_is_version_installed
 6)    1          25.56    25.56   11.68%      9.92     9.92    4.53%  compinit
 ...
 20)    1           0.03     0.03    0.02%      0.03     0.03    0.02%  compdef
```

Notice that not only is `compinit` only called once now, but `compdef`'s call count dropped from 1753 to just 1!

## 3. Speeding up NVM

Now that the `compinit` problem is solved, NVM is the next slowest part of my
zshrc.

NVM isn't something I need loaded 100% of the time like completions are. So for
this, my solution is to lazy-load NVM. That is, we don't load NVM at all in the
zshrc, and only load it the first time I call a command which uses NVM.

To do this, I created several "shim functions" which mask the name of a command
that needs NVM loaded, for example the `nvm` command itself:

```sh
NVM_DIR="$HOME/.nvm"
nvm() {
    # Remove this shim function
    unset -f nvm

    # Load NVM
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

    # Run the now-loaded command
    nvm "$@"
}
```

This function will first delete itself, then load NVM, then run `nvm`, which now
refers to the actual underlying command, since the shim function deleted itself.

I then rolled this into a loop to easily shim several commands:

```sh
# List of commands which require NVM to be loaded
local requires_nvm=(nvm node npm pnpm nvim)
for cmd in "${requires_nvm[@]}"
do
    "$cmd"() {
        # Remove this shim function
        unset -f "$0"

        # Load NVM
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

        # Run the now-loaded command
        "$0" "$@"
    }
done
```

Now, NVM doesn't get loaded when the shell starts up, but I can still run
commands like `nvm` or `node` without having to perform any extra steps.

### Non-interactive shells

The `~/.zshrc` file only gets sourced for interactive shells. This means if you
are running `node` from a shell script which is not being run in an interactive
Zsh session, it won't work.

To fix this, add the following to your `~/.zshenv` file, which gets sourced
every time Zsh starts, even for non-interactive shells:

```sh
# Load ZSH if our shell is not interactive. If it is interactive, it will be
# lazy-loaded in .zshrc.
if ! [[ -o interactive ]]
then
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"
fi
```

This will directly load NVM, but only if the shell is non-interactive. If I'm
not typing commands in, I don't really mind if Zsh takes an extra 300ms to
start.

## 4. Results

```txt
$ time zsh -i -c exit
zsh -i -c exit  0.06s user 0.05s system 91% cpu 0.116 total
```

Not bad, eh? Down from ~1 second to ~0.1 seconds. Now, Zsh starts fast enough
that the prompt shows up before I can start typing, even if I'm trying to beat
it.

## 5. Extra tips & tricks

### Use functions everywhere

I didn't mention this earlier, but the Zprof profiler only shows function calls.
This means that you could have something slow in your zshrc which doesn't show
up in the profiler because it isn't a function.

To solve this, I suggest wrapping each significant component of your zshrc in
its own self-destructive function. For example, the loop which creates the NVM
shims now looks like this:

```sh
# Lazy-load NVM
load_nvm() {
    unset -f load_nvm

    # List of commands which require NVM to be loaded
    local requires_nvm=(nvm node npm pnpm nvim)
    for cmd in "${requires_nvm[@]}"
    do
        "$cmd"() {
            # Remove this shim function
            unset -f "$0"

            # Load NVM
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
            [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

            # Run the now-loaded command
            "$0" "$@"
        }
    done
}; load_nvm
```

The `load_nvm` function is defined and then immediately called, and the first
command inside deletes the function.

Note that anonymous functions exist, but can't be named, so they will show up as
3 calls to the `(anon)` function instead of 3 different functions each being
called once.

### Enable profiling on-the-fly

Instead of having to modify my zshrc whenever I want to profile it, I replaced
the lines which load/call Zprof with the following:

```sh {linenos=false}
$ cat -n ~/.zshrc
    ...

     9  ##
    10  ## PROFILING
    11  ## Set the ZSH_PROFILE_STARTUP environment variable to enable profiling.
    12  ##
    13  if [ -n "${ZSH_PROFILE_STARTUP:+x}" ]
    14  then
    15      zmodload zsh/zprof
    16  fi

    ...

   415  ##
   416  ## PRINT PROFILING RESULTS
   417  ##
   418  if [ -n "${ZSH_PROFILE_STARTUP:+x}" ]
   419  then
   420      zprof
   421  fi
```

Now, I can profile my zshrc by just running this command:

```txt
$ ZSH_PROFILE_STARTUP=1 zsh -i -c exit
```

<hr />

## That's all...

If you found this article useful, consider
[checking out other articles I've written](/blog/),
or [take a look at my public projects on GitHub](https://github.com/kdkasad).
