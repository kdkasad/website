---
title: Crashlog
tagline: A human-friendly crash handler library for Rust programs.
year: 2025
image:
    file: ./images/crashlog.png
    caption: Screenshot of Crashlog's output when a program using it crashes.

githubId: kdkasad/crashlog
links:
    - name: crates.io page
      url: https://crates.io/crates/crashlog
      icon: devicon:rust
    - name: Documentation (docs.rs)
      url: https://docs.rs/crashlog/latest/crashlog
      icon: fa7-solid:book

devicons:
    - rust
    - githubactions
---

Crashlog is a library that catches panics in Rust programs, logs relevant
information, and provides the user with information on how to report the crash.

Crashlog promotes privacy by allowing programs to get anonoymized crash reports
from users without relying on automatic data collection. It also provides users
with a better interface, as they get a friendly explanation of what went wrong
without having to decode a sometimes-cryptic panic message.

It originally started as a piece of Westwood, but was generalized and split off
into a library usable by anyone.
