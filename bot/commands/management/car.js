const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../../utils/logger');
const CarService = require('../../../services/carService');
const { createEmbed, COLORS } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('car')
    .setDescription('Comenzi pentru vehicule')
    .addSubcommand(sub =>
      sub.setName('register').setDescription('Inmatriculeaza un vehicul')
    )
    .addSubcommand(sub =>
      sub.setName('mycars').setDescription('Vezi vehiculele tale')
        .addUserOption(opt => opt.setName('user').setDescription('Vezi vehiculele altui user'))
    )
    .addSubcommand(sub =>
      sub.setName('info').setDescription('Vezi info despre un vehicul')
        .addStringOption(opt => opt.setName('plate').setDescription('Numarul de inmatriculare').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('search').setDescription('Cauta un vehicul')
        .addStringOption(opt => opt.setName('query').setDescription('Cautare').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('transfer').setDescription('Transfera un vehicul')
        .addStringOption(opt => opt.setName('plate').setDescription('Numarul de inmatriculare').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('scrap').setDescription('Caseaza un vehicul')
        .addStringOption(opt => opt.setName('plate').setDescription('Numarul de inmatriculare').setRequired(true))
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'register':
          await CarService.registerCar(interaction);
          break;
        case 'mycars':
          await CarService.showMyCars(interaction);
          break;
        case 'info':
          const plate = interaction.options.getString('plate');
          await CarService.showCarInfo(interaction, plate);
          break;
        case 'search':
          const query = interaction.options.getString('query');
          await CarService.searchCar(interaction, query);
          break;
        case 'transfer':
          const transferPlate = interaction.options.getString('plate');
          await CarService.transferCar(interaction, transferPlate);
          break;
        case 'scrap':
          const scrapPlate = interaction.options.getString('plate');
          await CarService.scrapCar(interaction, scrapPlate);
          break;
      }
    } catch (error) {
      logger.error(`Car command error: ${error.message}`);
      await interaction.reply({
        content: `A aparut o eroare: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
