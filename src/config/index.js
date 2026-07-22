const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..', '..');

module.exports = Object.freeze({
  joinLeaveChannelId: '1529137648294166538',
  memberRoleId: '1529081570454143098',
  botRoleId: '1529084837309190204',
  developerName: 'Axtorz',
  accentColor: 0x8b5cf6,
  successColor: 0x22c55e,
  errorColor: 0xef4444,
  warningColor: 0xf59e0b,

  minecraftServer: Object.freeze({
    host: '192.168.1.21',
    port: 25565,
    statusChannelId: '1529466775207546961',
    checkIntervalMs: 30_000,
    connectionTimeoutMs: 4_000,
    offlineFailureThreshold: 2,
  }),

  settings: Object.freeze({
    defaultReason: 'No reason provided.',
    maximumTimeoutMs: 28 * 24 * 60 * 60 * 1000,
    warningsPerPage: 5,
  }),

  paths: Object.freeze({
    projectRoot,
    minecraftStatus: path.join(projectRoot, 'data', 'minecraft-status.json'),
    warnings: path.join(projectRoot, 'data', 'warnings.json'),
  }),
});
