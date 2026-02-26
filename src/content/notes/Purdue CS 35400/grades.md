---
title: Automatically monitor for grade updates
description: A shell script and Systemd unit to email you when your CS 354 grades are updated.
---

For CS 354, grades are stored in `~cs354/grades/$USER` as text files that get
updated when your grades are changed. Thus there are no automatic notifications
like with Brightspace or Gradescope.

To solve this, you can create the following shell script and Systemd service to
monitor for grade changes. It will email you when any grade file is written to.

# Shell script

Place this somewhere like `~/.local/bin/monitor_cs354_grades.sh`.

```bash
#!/bin/bash

set -e -u -o pipefail

GRADE_DIR=~cs354/grades/"$USER"

inotifywait -m --includei '\.rpt$' -e close_write "$GRADE_DIR" \
    | while read -r dir events file; do
        echo "$file updated" >&2
        printf 'Subject: CS 354 %s grade updated\n\n' "${file%.rpt}" \
            | cat - "${dir}${file}" \
            | sendmail -bm -i "$USER"
        echo "Email sent" >&2
    done
```

Here is a brief explanation of what this does:

- [`inotifywait`] is a tool that uses Linux's `inotify(7)` interface to watch
  for file I/O events.
- We tell `inotifywait` to monitor for events where a file opened in write mode
  is closed on files ending with `.rpt` in the grade directory.
- When it sees such an event, it outputs a single line of text. See the manual
  page for details on the format.
- We pipe this into a loop that does the following repeatedly:
    - Reads a single line from standard input and stores each field in variable.
    - Prints a subject line followed by the updated file's contents, and pipes
      that to `sendmail`.
    - [`sendmail`] is provided by Postfix, the mail server installed on the CS
      servers, and is used to send email.

[`inotifywait`]: https://man.archlinux.org/man/extra/inotify-tools/inotifywait.1.en
[`inotify(7)`]: https://man.archlinux.org/man/inotify.7.en
[`sendmail`]: https://man.archlinux.org/man/extra/postfix/sendmail.1.en

# Systemd service

## Creating the file

To run the shell script in the background constantly, we can use
[Systemd](https://systemd.io).

Run the following command to create a new service file.
You can replace the name with whatever you like.

```sh
$ systemctl --user edit --full --force monitor-cs354-grades.service
```

This will open the new file in a text editor. Give it the following contents.

```systemd
[Unit]
Description=Monitors CS 354 grades and emails upon updates

[Service]
Type=exec
ExecStart=%h/.local/bin/monitor_cs354_grades.sh
Restart=always

[Install]
WantedBy=default.target
```

> [!IMPORTANT]
> Replace the shell script path with the proper path to your shell script.
> The `%h` is a placeholder for your home directory.
> See [this section of the `systemd.unit(5)` man page][systemd specifiers] for details.

[systemd specifiers]: https://man.archlinux.org/man/core/systemd/systemd.unit.5.en#SPECIFIERS

## Running the service

First, enable "linger," i.e. allow services to run even after you log out.
(See [`loginctl(1)`](https://man.archlinux.org/man/core/systemd/loginctl.1.en) for details.)

```sh
$ loginctl enable-linger
```

Then enable and start the service.

```sh
$ systemctl --user enable --now monitor-cs354-grades.service
```

> [!NOTE]
> _Enabling_ a service means Systemd will start it automatically when Systemd
> starts (for user-scoped services, this is when you log in).
> _Starting_ a service means making it run currently.
> The `--now` flag tells the `enable` command to start the service in addition
> to enabling it.

Some useful `systemctl` commands:

- Start/stop/enable/disable a unit: `systemctl <action> <unit>`.
- See a unit's status: `systemctl status <unit>`.
- Print a unit's logs: `journalctl --user -eu <unit>`.
- Edit a unit: `systemctl edit --full <unit>`.
  To apply these commands to your user-scoped Systemd instance instead of the
  system-level one, insert the `--user` option as the first argument to the
  commands.
