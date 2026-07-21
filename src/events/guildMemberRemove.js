const { Events } = require('discord.js');
const { sendLeaveMessage } = require('../utils/memberLifecycle');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    await sendLeaveMessage(member);
  },
};
