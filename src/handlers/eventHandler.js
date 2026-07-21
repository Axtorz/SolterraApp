const path = require('node:path');
const { findJavaScriptFiles } = require('./commandHandler');
const logger = require('../utils/logger');

function loadEvents(client, directory = path.join(__dirname, '..', 'events')) {
  const files = findJavaScriptFiles(directory);

  for (const file of files) {
    const event = require(file);
    if (!event.name || typeof event.execute !== 'function') {
      throw new TypeError(`Event file ${file} must export name and execute.`);
    }

    const listener = (...args) => event.execute(...args, client);
    if (event.once) client.once(event.name, listener);
    else client.on(event.name, listener);
  }

  logger.info(`Loaded ${files.length} event handlers.`);
}

module.exports = { loadEvents };
