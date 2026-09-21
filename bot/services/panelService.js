const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton, createSelectMenu } = require('../../utils/embeds');
const config = require('../../config');

class PanelService {
  static async createTicketPanel(channel) {
    try {
      const embed = createEmbed({
        title: '🎫 Ticket System',
        description: 'Ai nevoie de ajutor? Deschide un ticket pentru a contacta staff-ul!\n\n**🟢 Tier 1 - Basic**\nSuport general, intrebari simple\n*Raspuns in ~24h*\n\n**🟡 Tier 2 - Advanced**\nProbleme complexe, rapoarte, dispute\n*Raspuns in ~12h*\n\n**🔴 Tier 3 - Critical**\nProbleme urgente, abuzuri grave, appeal-uri ban\n*Raspuns in ~4h*\n\n**Categorii disponibile:**\n• 🎯 Support - Intrebari generale\n• 📋 Report - Raporteaza pe cineva\n• 🏛️ Department - Intrebari despre departamente\n• ⚖️ Appeal - Contestatii\n• ❓ Other - Altele',
        color: COLORS.primary,
        fields: [
          { name: '🟢 Tier 1', value: 'Raspuns ~24h', inline: true },
          { name: '🟡 Tier 2', value: 'Raspuns ~12h', inline: true },
          { name: '🔴 Tier 3', value: 'Raspuns ~4h', inline: true },
        ],
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: 'ticket_new', label: 'Deschide Ticket', style: ButtonStyle.Success, emoji: '🎫' }),
      ]);

      await channel.send({ embeds: [embed], components: [buttons] });
      logger.info('Ticket panel created');
    } catch (error) {
      logger.error(`Failed to create ticket panel: ${error.message}`);
    }
  }

  static async createDepartmentPanel(channel) {
    try {
      const embed = createEmbed({
        title: '🏛️ Departamente',
        description: 'Selecteaza departamentul dorit pentru a afla mai multe informatii sau pentru a aplica!',
        color: COLORS.primary,
        fields: Object.entries(config.greenville.departments).map(([key, dept]) => ({
          name: `${dept.icon} ${dept.name}`,
          value: `Rank-uri: ${dept.ranks.length}\nAplica acum!`,
          inline: true,
        })),
        timestamp: true,
      });

      const selectMenu = createSelectMenu({
        customId: 'dept_select_apply',
        placeholder: 'Selecteaza departamentul pentru a aplica...',
        options: Object.entries(config.greenville.departments).map(([key, dept]) => ({
          label: dept.name,
          value: key,
          emoji: dept.icon,
          description: `Aplica pentru ${dept.name}`,
        })),
      });

      const infoSelectMenu = createSelectMenu({
        customId: 'dept_select_info',
        placeholder: 'Selecteaza departamentul pentru informatii...',
        options: Object.entries(config.greenville.departments).map(([key, dept]) => ({
          label: dept.name,
          value: key,
          emoji: dept.icon,
          description: `Vezi informatii despre ${dept.name}`,
        })),
      });

      const buttons = createActionRow([
        createButton({ customId: 'dept_apply_politie', label: 'Aplica Politie', style: ButtonStyle.Primary, emoji: '🚔' }),
        createButton({ customId: 'dept_apply_pompieri', label: 'Aplica Pompieri', style: ButtonStyle.Danger, emoji: '🚒' }),
        createButton({ customId: 'dept_apply_medic', label: 'Aplica Medic', style: ButtonStyle.Success, emoji: '🚑' }),
        createButton({ customId: 'dept_apply_dot', label: 'Aplica DOT', style: ButtonStyle.Secondary, emoji: '🚧' }),
      ]);

      await channel.send({ embeds: [embed], components: [selectMenu, infoSelectMenu, buttons] });
      logger.info('Department panel created');
    } catch (error) {
      logger.error(`Failed to create department panel: ${error.message}`);
    }
  }

  static async createRulesPanel(channel) {
    try {
      const embed = createEmbed({
        title: '📋 Regulamentul Serverului',
        description: '**REGULAMENTUL GREENVILLE RP ROMANIA**\n\n📜 **Capitolul 1 - Reguli Generale**\n1.1. Trateaza toti membrii cu respect\n1.2. Nu folosi limbaj vulgar sau ofensator\n1.3. Nu face spam in canale\n1.4. Nu promova alte servere fara acordul staff-ului\n1.5. Nu folosi bug-uri sau exploit-uri\n\n🚗 **Capitolul 2 - Roleplay**\n2.1. Respecta regulile de roleplay\n2.2. Nu distruge experienta altora (RP disturbing)\n2.3. Nu folosi OOC (Out of Character) in canalele RP\n2.4. Respecta ierarhia departamentului\n2.5. Foloseste canalele potrivite pentru fiecare actiune\n\n🏛️ **Capitolul 3 - Departamente**\n3.1. Aplica doar daca esti serios\n3.2. Respecta superiorii tai\n3.3. Participa la antrenamente si intalniri\n3.4. Nu abuza de pozitia ta\n3.5. Fii exemplu pentru ceilalti membri\n\n🔒 **Capitolul 4 - Securitate**\n4.1. Nu adauga boti neautorizati\n4.2. Nu incerca sa ataci serverul\n4.3. Raporteaza orice problema staff-ului\n4.4. Nu distribui informatii confidentiale\n\n⚠️ **Sancțiuni:**\n• Warning (Avertisment)\n• Timeout (Mute temporar)\n• Kick (Scoatere din server)\n• Ban (Ban permanent)\n\n*Regulamentul poate fi modificat fara notificare prealabila!*',
        color: COLORS.primary,
        timestamp: true,
        footer: { text: 'Citeste regulamentul cu atentie!' },
      });

      await channel.send({ embeds: [embed] });
      logger.info('Rules panel created');
    } catch (error) {
      logger.error(`Failed to create rules panel: ${error.message}`);
    }
  }

  static async createVerificationPanel(channel) {
    try {
      const embed = createEmbed({
        title: '✅ Verificare',
        description: 'Pentru a avea acces complet la server, trebuie sa te verifici!\n\n**🎮 Verificare Roblox (Recomandat):**\n1. Click pe butonul "Verifica Roblox"\n2. Introdu username-ul de Roblox\n3. Pune codul primit in descrierea profilului Roblox\n4. Click pe "Verifica Acum"\n5. Numele Discord se va seta automat!\n\n**📋 Verificare Manuala:**\n1. Click pe "Verifica-te Acum"\n2. Completeaza formularul\n3. Asteapta aprobarea staff-ului\n\n**Ce vei primi:**\n• Acces la toate canalele\n• Nume Discord = Username Roblox\n• Posibilitatea de a deschide tickete\n• Acces la departamente',
        color: COLORS.success,
        fields: [
          { name: '🎮 Roblox', value: 'Conecteaza contul Roblox pentru a-ti seta automat numele!', inline: true },
          { name: '📋 Manual', value: 'Completeaza formularul pentru verificare manuala', inline: true },
        ],
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: 'verify_roblox', label: 'Verifica Roblox', style: ButtonStyle.Primary, emoji: '🎮' }),
        createButton({ customId: 'verify_start', label: 'Verifica-te Acum', style: ButtonStyle.Success, emoji: '✅' }),
      ]);

      await channel.send({ embeds: [embed], components: [buttons] });
      logger.info('Verification panel created');
    } catch (error) {
      logger.error(`Failed to create verification panel: ${error.message}`);
    }
  }

  static async createSecurityPanel(channel) {
    try {
      const embed = createEmbed({
        title: '🔒 Panou Securitate',
        description: 'Sistemele de securitate ale serverului!\n\n**Sisteme active:**\n• 🛡️ Anti-Raid - Protejeaza impotriva raid-urilor\n• 🔇 Anti-Spam - Previne spam-ul\n• 💣 Anti-Nuke - Protejeaza canalele\n• 👤 Auto-Ban - Ban automate pentru conturi noi\n• 🤖 Anti-Bot - Prevenirea adaugarii botilor',
        color: COLORS.primary,
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: 'security_toggle_raid', label: 'Anti-Raid', style: ButtonStyle.Success, emoji: '🛡️' }),
        createButton({ customId: 'security_toggle_spam', label: 'Anti-Spam', style: ButtonStyle.Success, emoji: '🔇' }),
        createButton({ customId: 'security_toggle_nuke', label: 'Anti-Nuke', style: ButtonStyle.Success, emoji: '💣' }),
        createButton({ customId: 'security_toggle_autoban', label: 'Auto-Ban', style: ButtonStyle.Success, emoji: '👤' }),
        createButton({ customId: 'security_toggle_antibot', label: 'Anti-Bot', style: ButtonStyle.Success, emoji: '🤖' }),
      ]);

      await channel.send({ embeds: [embed], components: [buttons] });
      logger.info('Security panel created');
    } catch (error) {
      logger.error(`Failed to create security panel: ${error.message}`);
    }
  }

  static async createRolesPanel(channel) {
    try {
      const embed = createEmbed({
        title: '🎨 Roluri Custom',
        description: 'Selecteaza rolurile pe care le doresti!\n\n**Culori:**\nSelecteaza o culoare pentru a-ti personaliza rolul!\n\n**Notificari:**\nAlege ce notificari doresti sa primesti!',
        color: COLORS.primary,
        timestamp: true,
      });

      const colorSelectMenu = createSelectMenu({
        customId: 'role_select_color',
        placeholder: 'Selecteaza o culoare...',
        options: [
          { label: 'Rosu', value: 'color_red', emoji: '🔴' },
          { label: 'Albastru', value: 'color_blue', emoji: '🔵' },
          { label: 'Verde', value: 'color_green', emoji: '🟢' },
          { label: 'Galben', value: 'color_yellow', emoji: '🟡' },
          { label: 'Portocaliu', value: 'color_orange', emoji: '🟠' },
          { label: 'Mov', value: 'color_purple', emoji: '🟣' },
          { label: 'Roz', value: 'color_pink', emoji: '🩷' },
          { label: 'Alb', value: 'color_white', emoji: '⚪' },
        ],
      });

      const notifSelectMenu = createSelectMenu({
        customId: 'role_select_notif',
        placeholder: 'Selecteaza notificarile...',
        options: [
          { label: 'Anunturi', value: 'notif_anunturi', emoji: '📢' },
          { label: 'Evenimente', value: 'notif_evenimente', emoji: '🎉' },
          { label: 'Giveaway', value: 'notif_giveaway', emoji: '🎁' },
          { label: 'Update', value: 'notif_update', emoji: '🔄' },
        ],
        minValues: 1,
        maxValues: 4,
      });

      await channel.send({ embeds: [embed], components: [colorSelectMenu, notifSelectMenu] });
      logger.info('Roles panel created');
    } catch (error) {
      logger.error(`Failed to create roles panel: ${error.message}`);
    }
  }

  static async createStaffDashboard(channel) {
    try {
      const embed = createEmbed({
        title: '👑 Panou Staff',
        description: 'Dashboard pentru staff!\n\n**Comenzi disponibile:**\n• `/warn` - Avertizeaza un user\n• `/kick` - Scoate un user\n• `/ban` - Ban un user\n• `/timeout` - Mute un user\n• `/purge` - Sterge mesaje\n• `/ticket` - Gestioneaza tickete\n• `/verify` - Gestioneaza verificari\n\n**Statistici:**\nMembrii totali: *Se actualizeaza automat*',
        color: COLORS.primary,
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: 'staff_tickets', label: 'Tickete', style: ButtonStyle.Primary, emoji: '🎫' }),
        createButton({ customId: 'staff_verifications', label: 'Verificari', style: ButtonStyle.Success, emoji: '✅' }),
        createButton({ customId: 'staff_security', label: 'Securitate', style: ButtonStyle.Danger, emoji: '🔒' }),
        createButton({ customId: 'staff_stats', label: 'Statistici', style: ButtonStyle.Secondary, emoji: '📊' }),
      ]);

      await channel.send({ embeds: [embed], components: [buttons] });
      logger.info('Staff dashboard created');
    } catch (error) {
      logger.error(`Failed to create staff dashboard: ${error.message}`);
    }
  }
}

module.exports = PanelService;
