const { ActivityType, Events } = require('discord.js');
const logger = require('../utils/logger');
const { startMinecraftStatusMonitor } = require('../utils/minecraftStatusMonitor');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.user.setPresence({
      activities: [{ name: 'Terracoin price', type: ActivityType.Watching }],
      status: 'online',
    });

    logger.info(`Logged in as ${client.user.tag} (${client.user.id}).`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s) with ${client.commands.size} command(s).`);
    void startMinecraftStatusMonitor(client);
  },
};
