const { randomUUID } = require('node:crypto');
const config = require('../config');
const JsonStore = require('./jsonStore');
const logger = require('./logger');

const EMPTY_DATA = Object.freeze({ version: 1, warnings: [] });
const isValidWarningData = (data) =>
  data !== null &&
  typeof data === 'object' &&
  !Array.isArray(data) &&
  Number.isInteger(data.version) &&
  Array.isArray(data.warnings);
const store = new JsonStore(config.paths.warnings, EMPTY_DATA, isValidWarningData);

function normalize(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.warnings)) {
    logger.warn('The warning data shape was invalid. Continuing with an empty warning list.');
    return [];
  }
  return data.warnings;
}

async function addWarning({ userId, moderatorId, reason }) {
  return store.update((data) => {
    if (!Array.isArray(data.warnings)) data.warnings = [];
    if (!Number.isInteger(data.version)) data.version = 1;

    const warning = {
      id: randomUUID(),
      userId,
      moderatorId,
      reason,
      timestamp: new Date().toISOString(),
    };

    data.warnings.push(warning);
    return warning;
  });
}

async function getWarningsForUser(userId) {
  const data = await store.read();
  return normalize(data)
    .filter((warning) => warning.userId === userId)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

async function removeWarning(warningId) {
  return store.update((data) => {
    if (!Array.isArray(data.warnings)) data.warnings = [];
    const index = data.warnings.findIndex((warning) => warning.id === warningId);
    if (index === -1) return null;
    return data.warnings.splice(index, 1)[0];
  });
}

module.exports = { addWarning, getWarningsForUser, removeWarning };
