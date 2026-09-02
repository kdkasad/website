---
title: Discord bot
tagline: A Discord bot for a server with my friends.
year: 2026
image:
    file: ./images/egrass-bot-sql.png
    caption: Screenshot of the bot performing a SQL query against its database and returning the results.

githubId: kdkasad/egrass-bot

devicons:
    - typescript
    - bun
    - sqlite
    - discordjs
---

Originally starting as a simple bot to keep track of daily [Neetcode] problems
for my friends and I to prepare for interviews, this bot gradually gained more
and more features.

It...

- announces daily Neetcode problem sets, keeping track of members' solves and
  other statistics;
- has a Markov model of all messages in the server, allowing members to imitate
  others;
- stores messages and reactions in a [SQLite3] database;
- allows members to run read-only SQL queries against the database by sending
  messages with SQL code blocks;
- makes fun of people who make 67 jokes;
- handles authentication to a Minecraft server; and
- notifies members about messages which contain keywords of interest.

[Neetcode]: https://neetcode.io
[SQLite3]: https://sqlite.org
