const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { PERMISSION_LEVELS, getPermissionLevel } = require('../permissions/levels');
const { Shift } = require('../database/models');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tura')
        .setDescription('Gestionare ture facțiuni')
        .addSubcommand(sub => sub.setName('start').setDescription('Începe tura').addStringOption(opt => opt.setName('facțiune').setDescription('Alege facțiunea').setRequired(true).addChoices({name: 'Poliție', value: 'police'}, {name: 'Pompieri', value: 'fire'}, {name: 'DOT', value: 'dot'})))
        .addSubcommand(sub => sub.setName('stop').setDescription('Încheie tura')),
    async execute(interaction) {
        const { member, options } = interaction;
        const sub = options.getSubcommand();

        if (sub === 'start') {
            const faction = options.getString('facțiune');
            const factionRoleId = { police: '1392135802053722222', fire: '1392137836412665948', dot: '1392138933336543252' }[faction];

            if (!member.roles.cache.has(factionRoleId)) {
                return interaction.reply({ content: `❌ Nu poți începe o tură deoarece nu faci parte din facțiunea respectivă!`, ephemeral: true });
            }

            await Shift.create({ userId: interaction.user.id, faction: faction });
            return interaction.reply({ content: `🟢 TURA A ÎNCEPUT\n\n**Facțiune:** ${faction}\n**Status:** Activ`, ephemeral: false });
        }

        if (sub === 'stop') {
            const shift = await Shift.findOne({ userId: interaction.user.id, endTime: { $exists: false } });
            if (!shift) return interaction.reply({ content: 'Nu ai nicio tură activă!', ephemeral: true });

            shift.endTime = new Date();
            shift.duration = (shift.endTime - shift.startTime) / 60000;
            await shift.save();

            return interaction.//reply({ content: `🔴 TURA S-A ÎNCHEIAT\n\n**Durată:** ${Math.round(shift.duration)} minute`, ephemeral: false });
        }
    }
};
