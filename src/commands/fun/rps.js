const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');
const { replyWithEmbed } = require('../../utils/responses');

const CHOICES = Object.freeze(['rock', 'paper', 'scissors']);
const LABELS = Object.freeze({
  rock: '🪨 Rock',
  paper: '📄 Paper',
  scissors: '✂️ Scissors',
});
const WINS_AGAINST = Object.freeze({ rock: 'scissors', paper: 'rock', scissors: 'paper' });

module.exports = {
  category: 'Fun',
  requiredUserPermissions: [],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play rock-paper-scissors against the bot.')
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('choice')
        .setDescription('Choose rock, paper, or scissors.')
        .setRequired(true)
        .addChoices(
          { name: 'Rock', value: 'rock' },
          { name: 'Paper', value: 'paper' },
          { name: 'Scissors', value: 'scissors' },
        ),
    ),

  async execute(interaction) {
    const userChoice = interaction.options.getString('choice', true);
    const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    let result = 'It is a draw!';

    if (WINS_AGAINST[userChoice] === botChoice) result = 'You win!';
    else if (WINS_AGAINST[botChoice] === userChoice) result = 'I win!';

    const embed = infoEmbed(
      '🎮 Rock Paper Scissors',
      `**Your choice:** ${LABELS[userChoice]}\n**My choice:** ${LABELS[botChoice]}\n\n**${result}**`,
    );
    return replyWithEmbed(interaction, embed);
  },
};
