const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../../config');
const logger = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Curăță serverul și instalează structura oficială Greenville RP (DOAR OWNER)'),
    async execute(interaction) {
        const { guild, user } = interaction;

        if (user.id !== guild.ownerId) {
            return interaction.reply({ content: 'Doar ownerul serverului poate rula această comandă!', ephemeral: true });
        }

        await interaction.deferReply({ content: 'Inițiez procesul de setup... Toate canalele și rolurile vor fi șterse.', ephemeral: false });

        try {
            // 1. Șterge toate canalele
            const channels = await guild.channels.fetch();
            for (const channel of channels.values()) {
                await channel.delete().catch(() => {});
            }

            // 2. Șterge rolurile (cu excepția celor esențiale)
            const roles = await guild.roles.fetch();
            for (const role of roles.values()) {
                if (role.managed || role.name === '@everyone') continue;
                await role.delete().catch(() => {});
            }

            // 3. Creează Rolurile
            const rolesToCreate = [
                { name: 'Owner', color: '#FF0000', hoist: true },
                { name: 'Host', color: '#ADD8E6', hoist: true }, // Albastru Deschis
                { name: 'Politie', color: '#0000FF', hoist: true },
                { name: 'Pompieri', color: '#FF0000', hoist: true },
                { name: 'Medic', color: '#00FF00', hoist: true },
                { name: 'Staff', color: '#FFFF00', hoist: true },
            ];

            const createdRoles = {};
            for (const r of rolesToCreate) {
                const role = await guild.roles.create({
                    name: r.name,
                    color: r.color,
                    hoist: r.hoist,
                    reason: 'Setup server Greenville RP'
                });
                createdRoles[r.name] = role;
            }

            // 4. Creează Categorii și Canale
            const structure = [
                {
                    category: '📚 INFORMATII',
                    channels: ['regulament', 'anunțuri', 'roluri']
                },
                {
                    category: '🏛️ DEPARTAMENTE',
                    channels: ['politie', 'pompieri', 'medic', 'dot']
                },
                {
                    category: '🎮 ROLEPLAY',
                    channels: ['sesiuni', 'chat-rp', 'galerie']
                },
                {
                    category: '🎫 TICKETE',
                    channels: ['creare-ticket', 'log-tickete']
                },
                {
                    category: '🔊 VOCE',
                    channels: [
                        { name: 'Lobby', type: ChannelType.GuildVoice },
                        { name: 'Sesiune 1', type: ChannelType.GuildVoice },
                        { name: 'Staff Lounge', type: ChannelType.GuildVoice }
                    ]
                }
            ];

            for (const section of structure) {
                const category = await guild.channels.create({
                    name: section.category,
                    type: ChannelType.GuildCategory
                });

                for (const ch of section.channels) {
                    const channelName = typeof ch === 'string' ? ch : ch.name;
                    const channelType = typeof ch === 'string' ? ChannelType.GuildText : ch.type;
                    
                    await guild.channels.create({
                        name: channelName,
                        type: channelType,
                        parent: category.id
                    });
                }
            }

            // 5. Mesaj Regulament
            const regChannel = guild.channels.cache.find(c => c.name === 'regulament');
            if (regChannel) {
                const regEmbed = new EmbedBuilder()
                    .setTitle('📜 Regulamentul Greenville RP')
                    .setColor('#0099ff')
                    .setDescription('Bun venit la Greenville RP! Pentru a menține o experiență plăcută, te rugăm să respecți regulile:')
                    .addFields(
                        { name: '1. Respect', value: 'Fii respectuos cu toți jucătorii și staff-ul.' },
                        { name: '2. FailRP', value: 'Este strict interzis FailRP-ul. Respectă normele de roleplay.' },
                        { name: '3. VDM/RDM', value: 'Interzis VDM (Vehicle Deathmatch) și RDM (Random Deathmatch).' },
                        { name: '4. Spam', value: 'Nu spama în canalele de chat.' }
                    )
                    .setFooter({ text: 'Administrația Greenville RP' });
                
                await regChannel.send({ embeds: [regEmbed] });
            }

            await interaction.editReply('✅ Serverul a fost resetat și configurat cu succes!');

        } catch (error) {
            logger.error(`Setup error: ${error.message}`);
            await interaction.editReply(`❌ A apărut o eroare în timpul setup-ului: ${error.message}`);
        }
    }
};
