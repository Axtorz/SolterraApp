const { Events } = require('discord.js');
const { assignAutomaticRole, sendJoinMessage } = require('../utils/memberLifecycle');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    await Promise.allSettled([assignAutomaticRole(member), sendJoinMessage(member)]);
  },
};
