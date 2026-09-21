const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');

const COLORS = {
  primary: '#FF6B00',
  secondary: '#1E90FF',
  success: '#00FF00',
  warning: '#FFA500',
  danger: '#FF0000',
  info: '#00BFFF',
  greenville: '#FF6B00',
  politie: '#0000FF',
  pompieri: '#FF0000',
  medic: '#00FF00',
  dot: '#FFA500',
};

const createEmbed = (options) => {
  const embed = new EmbedBuilder();
  
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.color) embed.setColor(options.color);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter({ text: options.footer.text, iconURL: options.footer.icon });
  if (options.timestamp) embed.setTimestamp();
  if (options.fields) {
    options.fields.forEach(field => {
      embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
    });
  }
  
  return embed;
};

const createButton = (options) => {
  return new ButtonBuilder()
    .setCustomId(options.customId)
    .setLabel(options.label)
    .setStyle(options.style || ButtonStyle.Primary)
    .setDisabled(options.disabled || false)
    .setEmoji(options.emoji || null);
};

const createActionRow = (components) => {
  return new ActionRowBuilder().addComponents(components);
};

const createSelectMenu = (options) => {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(options.placeholder)
    .setMinValues(options.minValues || 1)
    .setMaxValues(options.maxValues || 1);
  
  options.options.forEach(opt => {
    menu.addOptions({
      label: opt.label,
      value: opt.value,
      description: opt.description || null,
      emoji: opt.emoji || null,
      default: opt.default || false,
    });
  });
  
  return menu;
};

const createModal = (options) => {
  const modal = new ModalBuilder()
    .setCustomId(options.customId)
    .setTitle(options.title);
  
  options.components.forEach((row, index) => {
    const actionRow = new ActionRowBuilder();
    row.forEach(input => {
      actionRow.addComponents(
        new TextInputBuilder()
          .setCustomId(input.customId)
          .setLabel(input.label)
          .setStyle(input.style || TextInputStyle.Short)
          .setPlaceholder(input.placeholder || '')
          .setRequired(input.required || false)
          .setMinLength(input.minLength || null)
          .setMaxLength(input.maxLength || null)
          .setValue(input.value || '')
      );
    });
    modal.addComponents(actionRow);
  });
  
  return modal;
};

module.exports = {
  COLORS,
  createEmbed,
  createButton,
  createActionRow,
  createSelectMenu,
  createModal,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
};
