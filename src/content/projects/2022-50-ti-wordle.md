---
title: TI Wordle
tagline: A Wordle clone for TI-84 graphing calculators, written in C.
year: 2022
image:
    file: ./images/ti-wordle.png
    caption: Screenshot of the TI Wordle game running on a TI-84 emulator.

githubId: kdkasad/ti-wordle

devicons:
    - c
---

What do you do when you’re bored in math class, you like programming in C, and
Wordle just went viral? Obviously, you write a Wordle clone for your calculator
so you can play it in class. Okay maybe you wouldn’t do that, but I did.

This project opened up a new side of C programming for me: embedded systems. On
the TI-84, you don’t have the standard C library functions, so you can’t just
`printf()` text to the screen or even dynamically allocate memory. But even more
importantly, the calculator only has a few kilobytes of both RAM and storage, so
I had to be very careful with how I stored data in my program.

Because of the storage limitations, I had to get creative. Instead of using all
12,986 allowed Wordle words, I opted to use just the subset of 2,309 words which
can appear as answers. This strays a bit from the original Wordle game, but it
was a necessary trade-off to fit the game on the calculator.
