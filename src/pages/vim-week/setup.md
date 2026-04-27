---
layout: ./_layout.astro
title: Neovim setup tutorial
description: >
    A tutorial on setting up Neovim using my configuration.
date: 2024-11-24
---

Hi there! Thanks for coming to the first Vim Week lecture!

In order to keep the next lecture moving at a decent speed and ensure everyone can follow along, there’s a little bit of setup I’d like you to get done beforehand.

I know this page looks long, but I promise it only takes ~10 minutes to follow. (I did it myself just to make sure. ☺️)

## 0. Install a better terminal emulator & font

Especially for MacOS users, the default terminal emulator is _awful_ and will look terrible even with my "nice" Neovim setup. Use something like [Ghostty](https://ghostty.org) instead.

Additionally, for the icons to work, you’ll need a font which supports them, e.g. a [Nerd Font](https://nerdfonts.com).

## 1. Install Neovim

_Expand the section below for your preferred working environment._

### On the CS Linux servers _(recommended)_

If you just want to follow along and don’t want to install Neovim on your own device just yet, you can use the CS Linux servers. I’ve installed the latest version of Neovim on there and made it public, so you don’t even have to worry about installing it. All we need to do is add my Neovim install to your `PATH`, which is an _environment variable_ that tells your shell where to find commands.

1. Add my shared `bin` _(short for binary, a common nickname for an executable program)_ directory to your `PATH`. The `PATH` environment variable contains the list of directories which will be searched for executable programs.

    To do this, edit either `~/.profile` or `~/.bash_profile` (prefer the one that exists, or if neither do, then `~/.profile`). Add the following line, preferably at the bottom:

    ```bash
    export PATH="/homes/kkasad/share/opt/bin:$PATH"
    ```

    This will _prepend_ my shared directory which contains `nvim` and one other program, `rg`, which my Neovim setup uses. This means my installation of `nvim` will be found before the server’s system-wide installation, since mine comes earlier in the search path.

    > [!NOTE]
    > To edit this file, you can use Vim. Run the command `vim ~/.profile`, press `G` to go to the bottom of the file, press `o` to append a new line, enter the text above, press the Escape key to exit insert mode, then press `ZZ` to save and exit.

2. _(Optional step)_ If you’re already used to typing `vim` or `vi` to launch Vim, but you want to use the fancy Neovim setup we’ll create, you can create a _shell alias_. Open your `~/.bashrc` file (or `~/.zshrc` if you use ZSH) and add these lines:

    ```bash
    alias vi=nvim
    alias vim=nvim
    ```

3. Log out and log back in. This is necessary for the shell configuration changes to take effect.
4. Make sure `which nvim` prints the path to my installation:

    ```bash
    $ which nvim
    /homes/kkasad/share/opt/bin/nvim
    ```

    If it doesn’t, check that you followed the steps above correctly, especially logging out and back in.

### On your own device

If you want to work on your own device, make sure you have the latest version (≥0.10.0) of Neovim installed. You can go to https://neovim.io for instructions.

Also install https://github.com/BurntSushi/ripgrep.

I may assume that you’re working in a UNIX-like environment, so if you’re on Windows, you may want to use WSL.

## 2. Download my Neovim configuration

For Vim Week, I’m going to have everyone run my Neovim configuration. You don’t have to keep using it afterwards. You also don’t have to use it for the lectures, but you may not be able to play around with some of the features I’ll mention, and you’ll miss out on some of the useful keybindings I’ll teach.

1. Clone my dotfiles repository:

```bash
$ git clone https://github.com/kdkasad/dotfiles.git ~/Downloads/kian-dotfiles
```

1. Copy the `.config/nvim` directory to `~/.config/nvim`:

```bash
$ mkdir -p ~/.config
$ cp -rTvi ~/Downloads/kian-dotfiles/.config/nvim ~/.config/nvim
```

1. If you’d like, remove the `~/Downloads/kian-dotfiles` directory as we won’t need it again.

## 3. Launch Neovim

```bash
$ nvim
```

When Neovim launches, the `lazy.nvim` plugin will automatically install the plugins listed in my configuration.

Wait a minute or two before closing the window, just to make sure everything finishes installing. Once you stop seeing messages being printed to the screen, you should be good to go.

Next, you’ll need to use Mason to install `clangd` if you want C/C++ support. You can also install other language servers, but as this guide is aimed at those taking CS 240, 250, and/or 252, I’ll focus on C/C++. Run the following command in Neovim to install `clangd`:

```
:MasonInstall clangd
```

> [!NOTE]
> You can also open an interactive menu for Mason, similar to the one Lazy provides. Simply run `:Mason` to open that window.

Once `clangd` is installed, you can exit and re-open Neovim to load all of the now-installed plugins.

## 4. Download the examples

We’ll play around with some examples I’ve set up to simulate specific situations. Download these from the Git repository so that you have them ready for lecture:

```bash
$ git clone https://github.com/kdkasad/vim-week-examples.git
```

## 5. _(optional)_ Install a Nerd font

To get nice icons in Neovim, we’ll need a font which includes these icons. Then Neovim can print special characters to the terminal which the special font will interpret as icons.

If you’re fine with getting a `` character instead of icons, then skip this step.

If you want the icons to display properly, install a nerd font: <https://www.nerdfonts.com/>. Then set up your terminal emulator to use it.

---

That’s it… See you Wednesday! 👋
