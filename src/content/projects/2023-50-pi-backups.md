---
title: Raspberry Pi classroom backup system
tagline:
    A custom backup solution to seamlessly and efficiently back up data from a
    classroom of Raspberry Pi computers to one central location.
year: 2023
image:
    file: ./images/classroom-pi-backup-system.png
    caption: Screenshot of the write-up of my Raspberry Pi backup system.

githubId: kdkasad/classroom-pi-backup-system
links:
    - name: Technical write-up & documentation
      url: https://kasad.notion.site/Raspberry-Pi-Backup-System-for-Classrooms-599ef1eacbc44781ae3d198d03363775
      icon: fa7-solid:book

devicons:
    - python
    - raspberrypi
    - linux
---

In high school, my computer science teacher used a classroom set of Raspberry Pi
computers to teach programming. Raspberry Pis’ SD cards are not the most
reliable, and that combined with students’ unfamiliarity with Linux led to lots
of accidental data loss.

To solve this, I built a software system which runs on every Raspberry Pi in the
room, and automatically backs up all student data at the end of each class
period and school day. The backups are sent to a central server (also a
Raspberry Pi), which deduplicates and compresses the data to save space.

The system has several key features which make it suitable for classroom use: it
is fully automated, can be installed on a Pi using a single command, and allows
the teacher to configure the entire system using a single configuration file. As
an added bonus, this configuration file can be used to run custom shell scripts
on all the nodes in the classroom. This makes it easy to, for example, install
new software for all students, without having to manually perform the
installation process 30 times.

I encountered many challenges when building this system. For one, I don’t
control the school’s network infrastructure, so I couldn’t hard-code IP
addresses. Instead, I had to ensure that [mDNS] responders were set up on all
nodes so they could discover each other automatically. Another issue was the
thundering herd problem: having all nodes back up at the end of each class
period would overload the backup server, so I had to add randomized offsets to
the backup times to spread out the load. Several other problems, such as
security, are laid out in the write-up linked above.

[mDNS]: https://en.wikipedia.org/wiki/Multicast_DNS
