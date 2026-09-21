const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PERMISSION_LEVELS, getPermissionLevel } = require('../permissions/levels');
const { Session } = require('../database/models');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sesiune')
        .setDescription('Administrare sesiuni RPGV')
        .addSubcommand(sub => sub.setName('start').setDescription('Pornește o sesiune').addStringOption(opt => opt.setName('nume').setDescription('Numele sesiunii').setRequired(true).addStringOption(opt => opt.setName('link').setDescription('Link Roblox').setRequired(true)))
        .addSubcommand(sub => sub.setName('stop').setDescription('Încheie sesiunea curentă'))
        .addSubcommand(sub => sub.setName('link').setDescription('Actualizează link-ul')),
    async execute(interaction) {
        const { member, options, guild } = interaction;

        if (getPermissionLevel(member) < PERMISSION_LEVELS.SESSION_HOST) {
            return interaction.reply({ content: 'Nu ai permisiunea de Session Host!', ephemeral: true });
        }

        const sub = options.getSubcommand();

        if (sub === 'start') {
            const name = options.getString('nume');
            const link = options.getString('link');

            const session = await Session.create({
                hostId: interaction.user.id,
                sessionName: name,
                robloxLink: link,
                status: 'active'
            });

            const embed = new EmbedBuilder()
                .setTitle('🚨 SESIUNE RPGV ACTIVĂ')
                .setColor('#00ff00')
                .addFields(
                    { name: '🎙️ Host', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '🟢 Status', value: 'Activă', inline: true },
                    { name: '🎮 Sesiune', value: name, inline: true },
                    { name: '👮 Poliție', value: '0', inline: true },
                    { name: '🚒 Pompieri', value: '0', inline: true },
                    { name: '🚧 DOT', value: '0', inline: true },
                    { name: '👥 Cetățeni', value: '0', inline: true }
                )
                .setFooter({ text: 'RPGV Roleplay' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('join_session').setLabel('🎮 INTRĂ ÎN SERVER').setStyle(ButtonStyle.Link).setURL(link),
                new ButtonBuilder().setCustomId('session_stats').setLabel('📊 STATISTICI').setStyle(ButtonStyle.Secondary)
            );

            const sessionChan = guild.channels.cache.find(c => c.name === '🚨・sesiuni');
            if (sessionChan) await sessionChan.send({ embeds: [embed], components: [row] });

            return interaction.reply({ content: 'Sesiunea a fost lansată cu succes!', ephemeral: true });
        }

        if (sub === 'stop') {
            const activeSession = await Session.findOne({ status: 'active' });
            if (!activeSession) return interaction.reply({ content: 'Nu există nicio sesiune activă!', ephemeral: true });

            activeSession.status = 'ended';
            activeSession.endTime = new Date();
            activeSession.duration = (activeSession.endTime - activeSession.startTime) / 60000;
            await activeSession.save();

            return interaction.reply({ content: '🔴 Sesiunea a fost încheiată și salvată în statistici.', ephemeral: true });
        }
    }
};
