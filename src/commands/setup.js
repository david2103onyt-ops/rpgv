const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { PERMISSION_LEVELS, getPermissionLevel } = require('../../permissions/levels');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configurare totală server RPGV (DOAR OWNER)'),
    async execute(interaction) {
        const { guild, member, user } = interaction;

        if (getPermissionLevel(member) < PERMISSION_LEVELS.OWNER) {
            return interaction.reply({ content: 'Doar Ownerul poate rula această comandă!', ephemeral: true });
        }

        await interaction.deferReply({ content: 'Inițiez setup-ul RPGV...', ephemeral: false });

        try {
            // 1. Curățare
            const channels = await guild.channels.fetch();
            for (const channel of channels.values()) await channel.delete().catch(() => {});
            
            const roles = await guild.roles.fetch();
            for (const role of roles.values()) {
                if (role.managed || role.name === '@everyone') continue;
                await role.delete().catch(() => {});
            }

            // 2. Roluri
            const rolesToCreate = [
                { name: 'Fondator', color: '#FF0000' },
                { name: 'Co-Fondator', color: '#FF4500' },
                { name: 'Management', color: '#FFA500' },
                { name: 'Administrator', color: '#FFFF00' },
                { name: 'Moderator', color: '#00FFFF' },
                { name: 'Session Host', color: '#ADD8E6' },
                { name: 'Poliție', color: '#0000FF' },
                { name: 'Pompieri', color: '#FF0000' },
                { name: 'DOT', color: '#FFA500' },
                { name: 'Cetățeni', color: '#FFFFFF' },
            ];

            for (const r of rolesToCreate) {
                await guild.roles.create({ name: r.name, color: r.color, hoist: true });
            }

            // 3. Categorii și Canale
            const structure = [
                {
                    category: '📌 INFORMAȚII',
                    channels: ['📜・regulament', '📢・anunțuri', '📖・ghid-rpgv', '❓・întrebări-frecvente', '🔔・roluri']
                },
                {
                    category: '🎮 ROLEPLAY',
                    channels: ['🚨・sesiuni', '📊・statistici-sesiuni', '📻・radio', '📞・112', '🚨・panic-button']
                },
                {
                    category: '📝 APLICAȚII',
                    channels: ['📋・aplicații', '👮・poliție', '🚒・pompieri', '🚧・dot', '🎙️・session-host']
                },
                {
                    category: '🎫 SUPORT',
                    channels: ['🎫・creează-ticket', '💡・sugestii', '📝・feedback', '⚠️・raportează-jucător']
                },
                {
                    category: '👥 COMUNITATE',
                    channels: ['💬・general', '📸・media', '🎮・gaming', '🏆・leaderboard']
                },
                {
                    category: '🔒 STAFF',
                    channels: ['🛡️・staff-chat', '📋・staff-logs', '🎫・ticket-logs', '📨・aplicații-staff', '🚨・mod-logs']
                }
            ];

            for (const section of structure) {
                const cat = await guild.channels.create({ name: section.category, type: ChannelType.GuildCategory });
                for (const ch of section.channels) {
                    await guild.channels.create({ name: ch, type: ChannelType.GuildText, parent: cat.id });
                }
            }

            // 4. Regulament
            const regChan = guild.channels.cache.find(c => c.name === '📜・regulament');
            if (regChan) {
                const regEmbed = new EmbedBuilder()
                    .setTitle('🇷🇴 REGULAMENT RPGV')
                    .setColor('#2f3136')
                    .setDescription('Bun venit în comunitatea RPGV. Respectă regulile pentru a evita sancțiunile.')
                    .addFields(
                        { name: '⚖️ Respect', value: 'Fii politicos cu toți membrii.' },
                        { name: '🎮 Roleplay', value: 'Respectă normele de RP. Fără FailRP, VDM sau RDM.' },
                        { name: '🚨 Sesiuni', value: 'Urmează instrucțiunile Host-ului în timpul sesiunilor.' },
                        { name: '🛡️ Staff', value: 'Deciziile staff-ului sunt finale.' }
                    )
                    .setFooter({ text: 'Sistem RPGV • Administrația' })
                    .setTimestamp();
                await regChan.send({ embeds: [regEmbed] });
            }

            await interaction.editReply('✅ Setup finalizat! Serverul a fost configurat complet ca RPGV.');
        } catch (error) {
            logger.error(`Setup Error: ${error.message}`);
            await interaction.editReply(`❌ Eroare setup: ${error.message}`);
        }
    }
};
