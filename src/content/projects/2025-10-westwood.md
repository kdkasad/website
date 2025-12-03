---
title: Westwood
tagline: A C source code linter for Purdue's CS 240 course.
year: Since 2025 (in progress)
image:
    file: ./images/westwood.png
    caption: Screenshot of Westwood's output.

githubId: kdkasad/westwood

devicons:
    - rust
    - c
    - githubactions
---

While taking and later working as the head developer for Purdue's CS 240:
Programming in C course, I've run into numerous issues with the current linter
provided by the course, so I decided to write a (hopefully) better one!

Westwood is a C source code linter, specifically built to enforce CS 240's code
standard. It's written in Rust and uses the [Tree-sitter parser library][treesitter] to handle
parsing, and the [codespan-reporting library][codespan] to handle output formatting.

While still under development, my goal is to complete Westwood by the start of
the Fall 2025 semester and open-source the project.

[treesitter]: https://tree-sitter.github.io/
[codespan]: https://lib.rs/crates/codespan-reporting
