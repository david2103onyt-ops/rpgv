const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const User = require('../../database/models/User');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton, createSelectMenu } = require('../../utils/embeds');
const config = require('../../config');

class DepartmentService {
  static async handleButton(interaction) {
    const { customId } = interaction;

    if (customId.startsWith('dept_apply_')) {
      const department = customId.split('_')[2];
      const applicationService = require('./applicationService');
      await applicationService.createApplication(interaction, department);
    }

    if (customId.startsWith('dept_info_')) {
      const department = customId.split('_')[2];
      await this.showDepartmentInfo(interaction, department);
    }

    if (customId.startsWith('dept_roster_')) {
      const department = customId.split('_')[2];
      await this.showDepartmentRoster(interaction, department);
    }

    if (customId.startsWith('dept_rankup_')) {
      const department = customId.split('_')[2];
      await this.rankUp(interaction, department);
    }
  }

  static async handleSelectMenu(interaction) {
    const { customId, values } = interaction;

    if (customId === 'dept_select_apply') {
      const department = values[0];
      const applicationService = require('./applicationService');
      await applicationService.createApplication(interaction, department);
    }

    if (customId === 'dept_select_info') {
      const department = values[0];
      await this.showDepartmentInfo(interaction, department);
    }
  }

  static async showDepartmentInfo(interaction, department) {
    try {
      const deptConfig = config.greenville.departments[department];
      if (!deptConfig) {
        return interaction.reply({
          content: 'Departament invalid!',
          ephemeral: true,
        });
      }

      const embed = createEmbed({
        title: `${deptConfig.icon} ${deptConfig.name}`,
        description: `Informatii despre departamentul **${deptConfig.name}**`,
        color: deptConfig.color,
        fields: [
          { name: '📋 Descriere', value: `Departamentul ${deptConfig.name} se ocupa de mentinerea ordinii si sigurantei in orasul Greenville.`, inline: false },
          { name: '👔 Rank-uri', value: deptConfig.ranks.map((r, i) => `\`${i}. ${r}\``).join('\n'), inline: true },
          { name: '📊 Cerinte', value: '- Varsta minima: 14 ani\n- Experienta in roleplay\n- Disponibilitate minima: 2 ore/zi\n- Comunicare in limba romana', inline: true },
          { name: '🎯 Beneficii', value: '- Acces la vehicule speciale\n- Echipament specializat\n- Suport din partea echipei\n- Posibilitatea de promovare', inline: false },
        ],
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: `dept_apply_${department}`, label: 'Aplica Acum', style: ButtonStyle.Success, emoji: '📝' }),
        createButton({ customId: `dept_roster_${department}`, label: 'Vezi Echipa', style: ButtonStyle.Primary, emoji: '👥' }),
      ]);

      await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to show department info: ${error.message}`);
    }
  }

  static async showDepartmentRoster(interaction, department) {
    try {
      const deptConfig = config.greenville.departments[department];
      if (!deptConfig) {
        return interaction.reply({
          content: 'Departament invalid!',
          ephemeral: true,
        });
      }

      const members = await User.find({
        guildId: interaction.guild.id,
        [`departments.${department}.active`]: true,
      });

      if (members.length === 0) {
        return interaction.reply({
          content: 'Nu sunt membri in acest departament!',
          ephemeral: true,
        });
      }

      const embed = createEmbed({
        title: `${deptConfig.icon} Echipa ${deptConfig.name}`,
        description: `Membrii activi ai departamentului **${deptConfig.name}**`,
        color: deptConfig.color,
        fields: members.map(m => ({
          name: m.username || m.userId,
          value: `Rank: ${m.departments[department].rank}\nActiv: ${m.departments[department].active ? '✅' : '❌'}`,
          inline: true,
        })),
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to show department roster: ${error.message}`);
    }
  }

  static async rankUp(interaction, department) {
    try {
      const user = await User.findOne({ userId: interaction.member.id, guildId: interaction.guild.id });
      
      if (!user || !user.departments[department]?.active) {
        return interaction.reply({
          content: 'Nu esti membru al acestui departament!',
          ephemeral: true,
        });
      }

      const deptConfig = config.greenville.departments[department];
      const currentRankIndex = deptConfig.ranks.indexOf(user.departments[department].rank);
      
      if (currentRankIndex >= deptConfig.ranks.length - 1) {
        return interaction.reply({
          content: 'Ai deja rankul maxim!',
          ephemeral: true,
        });
      }

      const newRank = deptConfig.ranks[currentRankIndex + 1];
      user.departments[department].rank = newRank;
      await user.save();

      const embed = createEmbed({
        title: '🎉 Promovat!',
        description: `Felicitari! Ai fost promovat la rankul **${newRank}** in ${deptConfig.name}!`,
        color: COLORS.success,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      logger.info(`User ${interaction.member.user.tag} ranked up to ${newRank} in ${department}`);
    } catch (error) {
      logger.error(`Failed to rank up: ${error.message}`);
    }
  }
}

module.exports = DepartmentService;
