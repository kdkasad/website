---
title: Trick to shift lines in Vim
date: 2021-05-21T20:47:02-07:00
description:
  A Vim configuration tip to make it easier to move selected lines up/down.
toc: none
---

It's easy to select lines in visual mode, delete them, then paste them a few
lines lower. However, this won't adjust the indentation to match surrounding
code.

Instead, add the following to your `vimrc` (or `init.vim`):

```vim
" Move visual selection
vnoremap K :m '<-2<cr>gv=gv
vnoremap J :m '>+1<cr>gv=gv
```

Then select lines using visual mode (`v` or `V`) and press `J` or `K` to shift
them down or up one line, respectively. This will also adjust the indentation
properly (the same as pressing `=` while selecting the lines).
