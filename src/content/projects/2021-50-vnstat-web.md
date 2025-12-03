---
title: vnStat-web
tagline: A web-based interface for the vnStat network traffic monitoring tool.
year: 2021
image:
    file: ./images/vnstat.png
    caption: Screenshot of vnStat-web UI, with both light and dark themes.

githubId: kdkasad/vnstat-web

devicons:
    - html5
    - css3
    - javascript
    - php
    - chartjs
---

vnStat-web is a web-based interface for the [vnStat network traffic monitoring
tool][vnstat]. It allows you to view your server’s network usage through a convenient web
interface, rather than vnStat’s built-in command-line interface.

I created this project in 2021, before I was aware of tools like Prometheus &
Grafana, which I now use to monitor my servers’ network traffic. However,
vnStat-web is still a useful tool and it still runs on kasad.com. Additionally,
the GitHub repository [has been “starred” by a few people][stars], which suggests that
the tool is being used by others as well.

vnStat-web is a fairly small project. It’s written as a static HTML/CSS/JS site,
with a single API endpoint written in PHP to fetch the data. That PHP script
uses vnStat’s JSON API to get the necessary data about the server it’s running
on. It then filters & transforms that data before returning it to the frontend,
where it is displayed using the Chart.js library.

[vnstat]: https://github.com/vergoh/vnstat
[stars]: https://github.com/kdkasad/vnstat-web/stargazers
