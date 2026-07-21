# Solterra Discord Bot

The one and only official Discord bot for the Solterra Minecraft community!!!!! Built with Node.js and `discord.js` v14. It provides slash-command moderation, JSON-backed warnings, member lifecycle messages, automatic roles, server information, and a lightweight game.

## Requirements

- Node.js 22 or newer (an active LTS release is recommended)
- npm 10 or newer
- A Discord application and bot account
- A Discord server in which you can manage applications and roles

No database server is used or required.

## Project structure

```text
SolterraApp/
├── data/
│   └── warnings.json
├── scripts/
│   ├── deploy-commands.js
│   └── validate-project.js
├── src/
│   ├── commands/
│   │   ├── fun/
│   │   ├── information/
│   │   └── moderation/
│   ├── config/
│   ├── events/
│   ├── handlers/
│   ├── utils/
│   └── index.js
├── .env
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```
