---
title: Home server
tagline: A Debian-based home server running on a tiny, power-efficient mini-PC,
    deployed fully automatically and reproducibly using Ansible.
year: Since 2024
image:
    file: ./images/grafana.png
    caption:
        Screenshot of the Grafana dashboard which monitors my home server and
        displays statistics such as CPU, memory, disk, and network usage.

githubId: kdkasad/home-server
links:
    - name: GitHub repository
      url: https://github.com/kdkasad/home-server
      icon: devicon:github

devicons:
    - linux
    - docker
    - debian
    - ansible
    - prometheus
    - grafana
    - traefikproxy
    - python
---

Over the past few years, I have experimented with self-hosting several services,
using a variety of hardware. But when the laptop I was using as a server died, I
realized I needed a more reproducible and maintainable setup.

This summer (2024), I dove into learning Ansible so I could create a
fully-reproducible server deployment. Ansible is an infrastructure-as-code tool,
which allows me to define the desired state of my server in a set of YAML files
with some custom modules written in Python. Over the span of a few months, I
wrote a playbook that installs and configures all the services I need for my
home server.

This allows me to not only set up the server quickly, but I also track the
entire server configuration in a single Git repository, including details such
as packages installed, firewall rules, and much more. This makes it easy to
recover from inevitable mistakes or hardware failures.

The playbook is hosted in a GitHub repository with an automated CI pipeline that
runs the playbook in a virtual machine every time I push a commit. This ensures
that the playbook will always work properly on a fresh installed of Debian or
Ubuntu Linux.

The server runs several services in Docker containers, all served behind a
Traefik reverse proxy, complete with TLS certificates and domain names. The
services include monitoring and observability tools such as Grafana, Prometheus,
and Loki, so I can keep an eye on the server’s health and performance. I even
get alerts sent to my email when unusual events occur!
