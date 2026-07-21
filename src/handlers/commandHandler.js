const fs = require('node:fs');
const path = require('node:path');
const logger = require('../utils/logger');

function findJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findJavaScriptFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

function loadCommands(client, directory = path.join(__dirname, '..', 'commands')) {
  const files = findJavaScriptFiles(directory);

  for (const file of files) {
    const command = require(file);
    if (!command.data || typeof command.execute !== 'function') {
      throw new TypeError(`Command file ${file} must export data and execute.`);
    }

    const name = command.data.name;
    if (client.commands.has(name)) throw new Error(`Duplicate command name: ${name}`);
    client.commands.set(name, command);
  }

  logger.info(`Loaded ${client.commands.size} slash commands.`);
  return client.commands;
}

module.exports = { findJavaScriptFiles, loadCommands };
