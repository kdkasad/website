---
title: Advice for courses which use C/C++
description: My advice on tools you should use when taking Purdue CS's C/C++-based courses.
---

CS 240, 250, 252, 352, and 354 all use C/C++ (depending on the professor).
Many students don't take advantage of tools that can make writing C/C++ easier.
Below are the tools I used when taking these classes that I think make the work
much easier.

> [!WARNING]
> I suggest that you **do not** use any of these tools other than version
> control for CS 240.
> For one, CS 240 provides some things in the test module which make some of
> these tools irrelevant (or in some cases prevent them from working at all). As
> for editor integration, you should write code without it so you remember
> functions and their signatures, as you'll need to know them for the exams.

# Servers

Ok, this one is not a tool, but it fits the theme.

I recommend working on one of the mcNN.cs.purdue.edu servers (at the time of
writing, 18–21 exist). They seem faster than data.cs (unsure why but probably
because of NFS load). They also have more generous default resource limits.

Since most courses use data.cs for grading, compile and run your code there
before submitting just to make sure it works as expected. I've never had a
situation where I wrote something on mcNN and it didn't work as expected on data
(aside from when using sanitizers, as will be explained later).

# Version control

Use it, no exceptions. It might feel like useless extra work until it saves you.
The moment you need to make use of it is the moment it becomes too late to start
using it.

I like to make one commit per step/part of an assignment. The more granular your
commits can be, the easier it is to manage the history of your code.

# Clangd (editor integration)

[Clangd] is a [language server] which provides editor support for C and C++.
It enables things like suggesting available functions, jumping to definition of functions/variables, showing signatures/types on hover, etc.

[Clangd]: https://clangd.llvm.org/
[language server]: https://microsoft.github.io/language-server-protocol/

I recommend using clangd when working on C/C++ homework/projects.
I've used it with both Neovim and Zed, though it should also be supported in VS
Code. Typically, the editor will handle installing clangd for you (though for
Neovim this depends on your configuration).

> [!NOTE]
> Despite the name, clangd does not require that you use the clang compiler.

## `compile_commands.json`

C/C++ codebases don't necessarily follow a specific format. With languages like
Python and JavaScript, you import symbols from other modules. With C/C++, this
is not the case: a symbol may be declared in a header file but could be defined
in any of the C/C++ files in the project. Furthermore, the location of the
header file is not made clear from the `#include` directive. Instead, the search
paths are defined using compiler flags, which aren't present in the source files
themselves.

Because of this, the only way for clangd to know the exact structure of your
project is to tell it the compiler commands used to build the project. This
information is stored in a file called `compile_commands.json`.

See the [Project setup](https://clangd.llvm.org/installation#project-setup)
guide in clangd's documentation for instructions on how to generate a
`compile_commands.json` file. You can of course construct one manually, but that
doesn't sound fun (I've never done it).

If you use clangd (whether you realize it or not) and your editor show lots of
errors (particularly things not being defined/found), but it builds fine (e.g.
using `make`), then you likely haven't generated the `compile_commands.json`
file correctly (or it's not located in the project root directory).

# Compiler warnings

You should've learned about this in CS 240, but it's worth saying again. You
should always enable compiler warnings, as they will help you catch bugs in your
code.

I recommend at least `-Wall`. I often also use `-Wextra`, and sometimes
`-Wpedantic`.

I suggest starting with `-Wall -Wextra -Wpedantic`.
Then compile the project before writing your own code (if possible).
If the starter code produces tons of warnings, remove `-Wpedantic` and repeat.
If there are still too many warnings from the starter code, remove `-Wextra`.
However I suggest not removing `-Wall`;
if there are warnings with just `-Wall`, either ignore them or fix them.

# Sanitizers

Modern GCC and Clang provide _sanitizers_, which are tools that help catch bugs
at runtime. Think of them like the runtime equivalent of compiler warnings.

The two I recommend using are [AddressSanitizer] and
[UndefinedBehaviorSanitizer] (abbreviated ASan and UBSan, respectively).

ASan will catch memory bugs in your program. These include dereferencing invalid
(e.g. null) pointers, use-after-free, double-free, buffer overflows, etc. When
ASan catches such a bug, it provides very detailed information that helps you
find the issue in your code and solve it. In my opinion, ASan's details are more
useful than debugging with GDB. ASan provides similar features to Valgrind, but
works without running in [Valgrind] (which isn't an option in some cases).

UBSan will catch undefined behavior. This includes using uninitialized data,
some classes of integer overflows, etc.

> [!NOTE]
> Sanitizers may not work on data.cs.purdue.edu because of some user resource
> limits.
> However, they do work on mcNN.cs.purdue.edu. I recommend using the latter for
> development anyways, and only running on data.cs as a sanity check before
> submitting your work.

[AddressSanitizer]: https://github.com/google/sanitizers/wiki/AddressSanitizer
[UndefinedBehaviorSanitizer]: https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html
[Valgrind]: https://valgrind.org/

## Use clang when possible

Clang's sanitizers are more mature than GCC's sanitizers. Typically, sanitizers
are developed for LLVM/Clang and then the equivalent behavior is ported to GCC
later.
Because of this, I recommend using the Clang compiler when possible.
Replace `gcc` with `clang` and `g++` with `clang++`.
However, Clang isn't properly installed on some of the CS machines, so this is
not always an option.

## Sometimes they won't work

Since sanitizers modify the runtime behavior of your program, it may not always
be possible to use them. For example, they cannot be used in CS 354, since
sanitizers require an operating system to work, and thus they cannot be used to
instrument the operating system itself.

## Do not submit with sanitizers enabled!

Sanitizers are enabled by adding compiler flags (e.g. `-fsanitize=undefined`).
In order to avoid any issues with grading, you should remove the sanitizer
compiler flags before submitting your code.

# Clang-format (automatic formatting)

I like to have a consistent code style. I believe it makes it easier to read
code,[^consistent-format] and if you have a tool to format code for you, then
you don't have to waste time formatting your code.

[^consistent-format]:
    Imagine if you were reading a book/article and the
    indentation, spacing between lines/paragraphs, width of the page, etc. changed
    multiple times in the same document depending on which author wrote that
    paragraph. It's distracting and takes time away from understanding the text.

[clang-format] is such a tool. You define a style in a file named
`.clang-format` (or don't, and just use the default style), and then run
`clang-format` to automatically format all of your source files according to the
style.

Clangd also has support for clang-format. If your editor is using clangd, and
you use the "format code" action or keybinding, it'll pass that command to
clangd, which in turn will call clang-format.

Unless your course has a specific code style you must follow, I recommend the following workflow:

1. Create a `.clang-format` file with style rules that you like (you can do this
   just once and reüse it for all of your projects).
2. Run `clang-format` on the provided starter code and then commit that. This
   way you have just one commit that handles formatting, and you don't mix
   formatting changes with logic changes, which can make it hard to read diffs.
3. Enable automatic formatting in your editor so you never have to worry about
   it again.

[clang-format]: https://clang.llvm.org/docs/ClangFormat.html
