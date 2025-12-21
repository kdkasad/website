---
title: Using Git Submodules
date: 2020-08-22T16:39:50-07:00
description:
  A short tutorial on what Git submodules are and how to use them.
---

If you've ever tried to add a Git repository within another Git repository, you may have gotten a confusing message like this:
```text
warning: adding embedded git repository: another-repo
hint: You've added another-repo git repository inside your current repository.
hint: Clones of the outer repository will not contain the contents of
hint: the embedded repository and will not know how to obtain it.
hint: If you meant to add a submodule, use:
hint:
hint: 	git submodule add <url> another-repo
hint:
hint: If you added this path by mistake, you can remove it from the
hint: index with:
hint:
hint: 	git rm --cached another-repo
hint:
hint: See "git help submodule" for more information.
```

It mentions submodules, but what are they?

# Understanding submodules

Git submodules are a pretty simple concept.
They're a way to reference a Git repo within another repo.

They work similarly to a link in a website.
It would be tedious and difficult to copy a whole webpage and include it in yours, so instead you'd create a link to the other page.

# Creating a submodule

Let's assume you're inside the parent repository, and you want to add a submodule.
Since this project requires another library, you want to include it in yours.
To do this, use the following command:
```sh
git submodule add <remote url> <destination>
```

To include the Linux kernel as a submodule in the directory `kernel`, you could use this command:
```sh
git submodule add https://github.com/torvalds/linux.git kernel
```

Adding a submodule will create the file `.gitmodules` in the root directory of your repository.

# Retrieving submodules

If you clone a repository that uses submodules, they won't be cloned unless you use the `--recurse-submodules` option.
```sh
git clone --recurse-submodules <repository url>
```

If you're already working in the repository, there are several options to the `git submodule` command.

### init

This will clone all submodules into their respective locations.

```sh
git submodule init
```

### update

Updates all submodules.

Without the `--remote` option, it will update all submodules to the latest local copy of the remote repo.  

With `--remote`, it will first fetch the remote repo.
This is equivalent to running `git pull` in each submodule.

```sh
git submodule update --remote
```

This can be combined with the `init` subcommand:
```sh
git submodule update --init
```
This will update all existing submodules, as well as cloning new ones.

# Full documentation

This is just a quick guide to help you get started with submodules. See the [gitsubmodules(7) man page](https://git-scm.com/docs/gitsubmodules) for a complete explanation.
