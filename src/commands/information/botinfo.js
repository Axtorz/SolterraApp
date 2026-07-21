const os = require('node:os');
const process = require('node:process');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { SlashCommandBuilder, version: discordVersion } = require('discord.js');
const packageData = require('../../../package.json');
const config = require('../../config');
const { infoEmbed } = require('../../utils/embeds');
const { formatBytes, formatDuration, formatLoadAverage, truncate } = require('../../utils/formatters');
const { replyWithEmbed } = require('../../utils/responses');

function getGitCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: config.paths.projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2_000,
      windowsHide: true,
    }).trim() || 'Unavailable';
  } catch {
    return 'Unavailable';
  }
}

module.exports = {
  category: 'Information',
  defer: true,
  requiredUserPermissions: [],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Show detailed bot, system, and process information.')
    .setDMPermission(false),

  async execute(interaction) {
    const startedAt = performance.now();
    const initialCpuUsage = process.cpuUsage();
    const client = interaction.client;
    const cpu = os.cpus()[0];
    const memory = process.memoryUsage();
    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const gitCommit = getGitCommit();
    const elapsedMs = Math.max(performance.now() - startedAt, 0.01);
    const cpuUsage = process.cpuUsage(initialCpuUsage);
    const processCpuPercent = ((cpuUsage.user + cpuUsage.system) / (elapsedMs * 1_000)) * 100;
    const userCount = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);

    const embed = infoEmbed('☝️🤓 Bot Information')
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: 'ℹ️ Bot Information',
          value: [
            `🏷️ **Name:** ${client.user.username}`,
            `🔖 **Tag:** ${client.user.tag}`,
            `🆔 **ID:** ${client.user.id}`,
            `⏳ **Uptime:** ${formatDuration(client.uptime ?? 0)}`,
            `⚡ **Latency:** ${Math.max(0, Math.round(client.ws.ping))} ms`,
          ].join('\n'),
        },
        {
          name: '📡 System Information',
          value: [
            `🖥️ **CPU:** ${truncate(cpu?.model ?? 'Unavailable', 100)}`,
            `🏗️ **Architecture:** ${os.arch()}`,
            `🏢 **Operating System:** ${os.type()} ${os.release()}`,
            `🔄 **Load Average:** ${formatLoadAverage()}`,
            `🏗️ **Total RAM:** ${formatBytes(totalRam)}`,
            `💾 **Free RAM:** ${formatBytes(freeRam)}`,
            `📉 **Used RAM:** ${formatBytes(totalRam - freeRam)}`,
          ].join('\n'),
        },
        {
          name: '📜 Software and Process',
          value: [
            `🚀 **Node.js Version:** ${process.version}`,
            `📦 **discord.js Version:** ${discordVersion}`,
            `🔄 **Process ID:** ${process.pid}`,
            `🏷️ **Process Title:** ${truncate(process.title, 80)}`,
            `⚙️ **Process CPU Usage:** ${processCpuPercent.toFixed(2)}%`,
            `🔍 **Process Memory Usage:** RSS ${formatBytes(memory.rss)} / Heap ${formatBytes(memory.heapUsed)}`,
          ].join('\n'),
        },
        {
          name: '📈 Statistics',
          value: [
            `🛠️ **Number of Commands:** ${client.commands.size}`,
            `🌐 **Number of Servers:** ${client.guilds.cache.size}`,
            `👥 **Number of Users:** ${userCount}`,
            `🕒 **Command Execution Time:** ${elapsedMs.toFixed(2)} ms`,
          ].join('\n'),
        },
        {
          name: '🛠️ Development',
          value: [
            `👨‍💻 **Developer:** ${config.developerName}`,
            `🔍 **Git Commit:** ${gitCommit}`,
            `📦 **Package Version:** ${packageData.version}`,
          ].join('\n'),
        },
      );

    return replyWithEmbed(interaction, embed);
  },
};
