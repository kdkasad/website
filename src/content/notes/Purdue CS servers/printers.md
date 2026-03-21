---
title: Printing on the CS/CoS printers
description: How to use the free printers provided to students and faculty of the College of Science.
---

The College of Science (CoS) has many printers that students and faculty in the
college can use. These are completely separate from ITaP's printers, and they
don't drain your ITaP print quota.

Since these printers don't use ITaP's infrastructure, they act like regular
network printers. You have to add the printer you want to use to your computer's
settings before you can print on it.

Here is the list of the Computer Science department's printers:
<https://www.cs.purdue.edu/resources/facilities/help/Printers.html>.

Highlighted in yellow at the top of that page is a link to another page with
instructions on how to add one of these printers to your computer and use it.

Here is a more general list of all College of Science printers:
<https://www.purdue.edu/science/scienceit/printers.html>.
It is possible that some of these are restricted/private like some of the CS
printers are; this list does not indicate such.

You can also get a list of the printers from the SMB server itself using a
program like `smbclient(1)`:

```sh
smbclient -L //print.science.purdue.edu -U BOILERAD/$USER
```
