# Solterra Discord Bot

A production-ready Discord bot for the Solterra Minecraft community, built with Node.js and `discord.js` v14. It provides slash-command moderation, JSON-backed warnings, member lifecycle messages, automatic roles, server information, and a lightweight game.

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
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## Installation

Clone or download the project, open a terminal in its root directory, and install the locked dependencies:

```bash
npm install
```

Create a local environment file.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

Edit `.env` and provide all three values:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_discord_server_id
```

Never commit `.env` or share the bot token. If a token is exposed, reset it immediately in the Discord Developer Portal.

## Discord application configuration

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and create or select an application.
2. Open **General Information** and copy the **Application ID** into `CLIENT_ID`.
3. Open **Bot**, create the bot user if necessary, and reset/copy its token into `DISCORD_TOKEN`.
4. In Discord, enable Developer Mode under **User Settings → Advanced**, right-click the target server, and copy its ID into `GUILD_ID`.
5. On the application's **Bot** page, enable the privileged **Server Members Intent**.
6. Leave **Message Content Intent** and **Presence Intent** disabled. This bot does not use them.

The bot requests only the `Guilds` and `GuildMembers` gateway intents. The members intent is required for join/leave events, automatic roles, member lookup, and role hierarchy checks.

## Invite the bot

In the Developer Portal, open **OAuth2 → URL Generator** and select these scopes:

- `bot`
- `applications.commands`

Select these bot permissions:

- View Channels
- Send Messages
- Embed Links
- Read Message History
- Manage Messages
- Kick Members
- Ban Members
- Moderate Members
- Manage Roles

You can also use this URL after replacing `YOUR_CLIENT_ID`:

```text
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1099780156422&scope=bot%20applications.commands
```

After inviting the bot, move its highest role above the configured member role, bot role, and every role it should be allowed to moderate. Discord role hierarchy still applies even when permissions are granted.

## Configuration

All server IDs, colors, and bot settings are centralized in `src/config/index.js`:

```js
joinLeaveChannelId: '1529137648294166538'
memberRoleId: '1529081570454143098'
botRoleId: '1529084837309190204'
developerName: 'Axtorz'
accentColor: 0x8b5cf6
successColor: 0x22c55e
errorColor: 0xef4444
warningColor: 0xf59e0b
```

The same file defines the purple accent, green success, red error, and orange warning colors. Change a value there, restart the bot, and redeploy only if command definitions changed. The configured join/leave channel must be text-based. Both automatic roles must exist and be below the bot's highest role.

## Deploy slash commands

Guild commands update quickly and are the recommended deployment mode for this bot. With `.env` configured, run:

```bash
npm run deploy
```

Run this command whenever a slash-command name, description, option, or default permission changes. The script replaces the application's commands for the configured `GUILD_ID`.

## Validate and start

Validate JavaScript syntax, command schemas, configuration IDs, storage shape, and duration parsing:

```bash
npm run check
```

Start the bot:

```bash
npm start
```

Successful startup logs the bot identity, guild count, command count, and loaded event handlers. Errors include timestamps and remain in English.

## JSON storage

Warnings are stored in `data/warnings.json`. Missing directories and files are created automatically. Storage operations are queued inside the process, writes use a temporary file and atomic replacement, and the previous valid file is copied to `data/warnings.json.bak` before replacement.

If malformed JSON is detected, the unreadable content is copied to a timestamped `data/warnings.json.corrupt.*.json` recovery file and the active store is safely reset. Recovery and backup files are ignored by Git.

Local JSON is appropriate for a single bot process and a modest community, but it has limitations:

- Run only one bot process against the same data directory.
- Data is local to one machine and is not shared across hosts.
- Back up the `data` directory regularly.
- Large datasets require loading and rewriting a complete JSON document.

This design intentionally avoids features that require a hosted or multi-process database.

## Moderation behavior

Discord default command permissions and runtime checks are both applied. Each moderation action checks the moderator permission, bot permission, target validity, server ownership, self-targeting, moderator role hierarchy, bot role hierarchy, and Discord's action capability flags.

`/mute` uses native Discord timeouts and accepts compact durations such as `10m`, `2h`, `1d`, `7d`, or `1d12h`. Discord's 28-day maximum is enforced.

`/clear` examines at most the latest 100 messages, optionally filters by user, and uses Discord's bulk-delete endpoint. Discord does not allow bulk deletion of messages older than 14 days; skipped messages are reported in the confirmation embed.

## Production startup with PM2

PM2 is optional, but it can keep the process running and restart it after failures:

```bash
npm install --global pm2
pm2 start src/index.js --name solterra-bot
pm2 save
pm2 startup
```

Follow the platform-specific command printed by `pm2 startup`. View logs with:

```bash
pm2 logs solterra-bot
```

Deploy commands once with `npm run deploy`; do not run the deployment script on every restart.

## Test checklist

- Run `npm run check` successfully.
- Deploy commands and confirm all 16 slash commands appear.
- Test `/help`, `/ping`, `/botinfo`, `/serverinfo`, `/userinfo`, `/avatar`, and `/rps` as a regular member.
- Confirm a regular member cannot see or run staff-only commands.
- Test ban, unban, kick, timeout, warning, warning removal, and message clearing with disposable accounts/messages.
- Verify self, owner, equal-role, and higher-role moderation attempts are blocked.
- Join with a human test account and a bot account; verify the correct automatic roles and green embeds.
- Leave with each test account; verify red embeds in the configured channel.
- Temporarily use an invalid role/channel ID and confirm the bot logs the problem without crashing.
- Back up `data/warnings.json`, deliberately make it malformed, and confirm recovery creates a timestamped copy.
