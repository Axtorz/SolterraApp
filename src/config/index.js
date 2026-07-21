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

  settings: Object.freeze({
    defaultReason: 'No reason provided.',
    maximumTimeoutMs: 28 * 24 * 60 * 60 * 1000,
    warningsPerPage: 5,
  }),

  paths: Object.freeze({
    projectRoot,
    warnings: path.join(projectRoot, 'data', 'warnings.json'),
  }),
});
