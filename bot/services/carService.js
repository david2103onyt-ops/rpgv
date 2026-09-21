const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Car = require('../../database/models/Car');
const User = require('../../database/models/User');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton, createModal, createSelectMenu } = require('../../utils/embeds');
const config = require('../../config');

const CAR_BRANDS = {
  'toyota': { models: ['Corolla', 'Camry', 'Supra', 'Hilux', 'Land Cruiser', 'Yaris'], category: 'sedan' },
  'honda': { models: ['Civic', 'Accord', 'CR-V', 'Pilot', 'S2000'], category: 'sedan' },
  'ford': { models: ['Mustang', 'F-150', 'Explorer', 'Focus', 'Bronco', 'Raptor'], category: 'sports' },
  'chevrolet': { models: ['Camaro', 'Corvette', 'Silverado', 'Tahoe', 'Malibu'], category: 'sports' },
  'bmw': { models: ['M3', 'M5', 'X5', 'X6', 'i8', 'Z4'], category: 'sports' },
  'mercedes': { models: ['C-Class', 'E-Class', 'S-Class', 'G-Class', 'AMG GT'], category: 'sedan' },
  'audi': { models: ['A3', 'A4', 'A6', 'Q7', 'R8', 'TT'], category: 'sedan' },
  'porsche': { models: ['911', 'Cayenne', 'Panamera', 'Macan', 'Taycan'], category: 'sports' },
  'lamborghini': { models: ['Huracan', 'Aventador', 'Urus'], category: 'sports' },
  'ferrari': { models: ['488', 'F8', 'Roma', 'SF90'], category: 'sports' },
  'nissan': { models: ['GT-R', '370Z', 'Altima', 'Pathfinder', 'Skyline'], category: 'sports' },
  'mazda': { models: ['MX-5', '3', '6', 'CX-5', 'CX-9'], category: 'sedan' },
  'subaru': { models: ['WRX', 'Impreza', 'Outback', 'Forester'], category: 'sedan' },
  'hyundai': { models: ['i30', 'Tucson', 'Santa Fe', 'Kona'], category: 'sedan' },
  'kia': { models: ['Sportage', 'Sorento', 'Stinger', 'Ceed'], category: 'sedan' },
  'volkswagen': { models: ['Golf', 'Passat', 'Tiguan', 'Arteon'], category: 'sedan' },
  'jeep': { models: ['Wrangler', 'Cherokee', 'Grand Cherokee', 'Gladiator'], category: 'suv' },
  'dodge': { models: ['Charger', 'Challenger', 'Durango', 'Ram'], category: 'sports' },
  'tesla': { models: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'], category: 'sedan' },
  'renault': { models: ['Clio', 'Megane', 'Captur', 'Kadjar'], category: 'sedan' },
  'peugeot': { models: ['208', '308', '3008', '5008'], category: 'sedan' },
  'dacia': { models: ['Logan', 'Sandero', 'Duster', 'Spring'], category: 'sedan' },
};

const CAR_COLORS = [
  { name: 'Negru', hex: '#000000' },
  { name: 'Alb', hex: '#FFFFFF' },
  { name: 'Rosu', hex: '#FF0000' },
  { name: 'Albastru', hex: '#0000FF' },
  { name: 'Verde', hex: '#00FF00' },
  { name: 'Galben', hex: '#FFFF00' },
  { name: 'Portocaliu', hex: '#FFA500' },
  { name: 'Gri', hex: '#808080' },
  { name: 'Argintiu', hex: '#C0C0C0' },
  { name: 'Mov', hex: '#800080' },
  { name: 'Roz', hex: '#FFC0CB' },
  { name: 'Bej', hex: '#F5F5DC' },
  { name: 'Maro', hex: '#8B4513' },
  { name: 'Auriu', hex: '#FFD700' },
  { name: 'Bronz', hex: '#CD7F32' },
];

class CarService {
  static generatePlate() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const plate = 
      letters[Math.floor(Math.random() * 26)] +
      letters[Math.floor(Math.random() * 26)] +
      letters[Math.floor(Math.random() * 26)] +
      '-' +
      Math.floor(Math.random() * 10) +
      Math.floor(Math.random() * 10) +
      Math.floor(Math.random() * 10) +
      Math.floor(Math.random() * 10);
    return plate;
  }

  static async registerCar(interaction) {
    try {
      const member = interaction.member;

      // Check if user is verified with Roblox
      const user = await User.findOne({ userId: member.id, guildId: interaction.guild.id });
      if (!user || !user.robloxId) {
        return interaction.reply({
          content: '❌ trebuie sa te verifici cu contul de Roblox mai intai!\nFoloseste butonul de verificare din canalul #verificare.',
          ephemeral: true,
        });
      }

      // Show car registration modal
      const modal = createModal({
        customId: `modal_car_register_${member.id}`,
        title: 'Inmatriculare Vehicul',
        components: [
          [
            {
              customId: 'brand',
              label: 'Marca Masinii',
              style: TextInputStyle.Short,
              placeholder: 'Ex: Toyota, BMW, Ford...',
              required: true,
              maxLength: 50,
            },
          ],
          [
            {
              customId: 'model',
              label: 'Modelul',
              style: TextInputStyle.Short,
              placeholder: 'Ex: Corolla, Mustang, M3...',
              required: true,
              maxLength: 50,
            },
          ],
          [
            {
              customId: 'year',
              label: 'Anul Fabricatiei',
              style: TextInputStyle.Short,
              placeholder: 'Ex: 2024',
              required: false,
              maxLength: 4,
            },
          ],
          [
            {
              customId: 'color',
              label: 'Culoarea',
              style: TextInputStyle.Short,
              placeholder: 'Ex: Rosu, Negru, Albastru...',
              required: true,
              maxLength: 30,
            },
          ],
          [
            {
              customId: 'engine',
              label: 'Motor (optional)',
              style: TextInputStyle.Short,
              placeholder: 'Ex: 2.0 TDI, V8, Electric...',
              required: false,
              maxLength: 50,
            },
          ],
        ],
      });

      await interaction.showModal(modal);

      // Wait for modal submission
      const filter = (i) => i.customId === `modal_car_register_${member.id}` && i.user.id === member.id;
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 120000 });

      const brand = modalInteraction.fields.getTextInputValue('brand').toLowerCase();
      const model = modalInteraction.fields.getTextInputValue('model');
      const year = modalInteraction.fields.getTextInputValue('year') || null;
      const colorName = modalInteraction.fields.getTextInputValue('color');
      const engine = modalInteraction.fields.getTextInputValue('engine') || null;

      // Validate brand
      const brandInfo = CAR_BRANDS[brand];
      if (!brandInfo) {
        return modalInteraction.reply({
          content: `❌ Marca **${brand}** nu este recunoscuta!\n\n**Marci disponibile:** ${Object.keys(CAR_BRANDS).join(', ')}`,
          ephemeral: true,
        });
      }

      // Find color hex
      const colorData = CAR_COLORS.find(c => c.name.toLowerCase() === colorName.toLowerCase());
      const colorHex = colorData ? colorData.hex : '#808080';

      // Generate plate
      const plate = this.generatePlate();

      // Create car
      const car = await Car.create({
        guildId: interaction.guild.id,
        ownerId: member.id,
        ownerUsername: member.user.username,
        robloxId: user.robloxId,
        robloxUsername: user.robloxUsername,
        plate,
        brand: brand.charAt(0).toUpperCase() + brand.slice(1),
        model,
        year: year ? parseInt(year) : null,
        color: colorName,
        colorHex,
        category: brandInfo.category,
        engine,
        history: [{
          action: 'registered',
          by: member.id,
          details: `Vehicul inmatriculat de ${member.user.username}`,
        }],
      });

      // Success embed
      const embed = createEmbed({
        title: '🚗 Vehicul Inmatriculat!',
        description: `Vehiculul tau a fost inmatriculat cu succes!\n\n**📋 Date Vehicul:**`,
        color: COLORS.success,
        fields: [
          { name: '🔢 Numar Inmatriculare', value: `\`${plate}\``, inline: true },
          { name: '🏭 Marca', value: brandInfo ? brand.charAt(0).toUpperCase() + brand.slice(1) : brand, inline: true },
          { name: '🚗 Model', value: model, inline: true },
          { name: '📅 An', value: year || 'N/A', inline: true },
          { name: '🎨 Culoare', value: `${colorName} ${colorHex}`, inline: true },
          { name: '⚡ Motor', value: engine || 'N/A', inline: true },
          { name: '🎮 Roblox User', value: user.robloxUsername, inline: true },
          { name: '👤 Proprietar', value: `${member}`, inline: true },
        ],
        footer: { text: 'Pastraza numarul de inmatriculare!' },
        timestamp: true,
      });

      await modalInteraction.reply({ embeds: [embed], ephemeral: true });

      // Log to staff
      const staffChannel = interaction.guild.channels.cache.get(config.channels?.staffChat);
      if (staffChannel) {
        const logEmbed = createEmbed({
          title: '🚗 Vehicul Nou Inmatriculat',
          description: `${member} a inmatriculat un vehicul nou!`,
          color: COLORS.primary,
          fields: [
            { name: '🔢 Numar', value: `\`${plate}\``, inline: true },
            { name: '🚗 Vehicul', value: `${brand.charAt(0).toUpperCase() + brand.slice(1)} ${model}`, inline: true },
            { name: '👤 Proprietar', value: `${member}`, inline: true },
          ],
          timestamp: true,
        });

        await staffChannel.send({ embeds: [logEmbed] });
      }

      logger.info(`Car registered: ${plate} by ${member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to register car: ${error.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ A aparut o eroare la inmatriculare!',
          ephemeral: true,
        });
      }
    }
  }

  static async showMyCars(interaction) {
    try {
      const member = interaction.options?.getUser('user') || interaction.user;
      const cars = await Car.find({ 
        guildId: interaction.guild.id, 
        ownerId: member.id,
        status: 'active'
      }).sort({ registeredAt: -1 });

      if (cars.length === 0) {
        return interaction.reply({
          content: '🚗 Nu ai niciun vehicul inmatriculat!\nFoloseste `/car register` pentru a inmatricula un vehicul.',
          ephemeral: true,
        });
      }

      const embed = createEmbed({
        title: `🚗 Vehiculele lui ${member.username || member.user?.username || 'Unknown'}`,
        description: `Ai **${cars.length}** vehicule inmatriculate:`,
        color: COLORS.primary,
        fields: cars.map(car => ({
          name: `🔢 ${car.plate}`,
          value: `**${car.brand} ${car.model}**\n🎨 ${car.color} | 📅 ${car.year || 'N/A'}\n⚡ ${car.engine || 'N/A'} | 📊 ${car.mileage} km`,
          inline: true,
        })),
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to show cars: ${error.message}`);
      await interaction.reply({
        content: '❌ A aparut o eroare!',
        ephemeral: true,
      });
    }
  }

  static async showCarInfo(interaction, plate) {
    try {
      const car = await Car.findOne({ 
        guildId: interaction.guild.id, 
        plate: plate.toUpperCase() 
      });

      if (!car) {
        return interaction.reply({
          content: `❌ Vehiculul cu numarul **${plate}** nu a fost gasit!`,
          ephemeral: true,
        });
      }

      const owner = await interaction.guild.members.fetch(car.ownerId).catch(() => null);

      const embed = createEmbed({
        title: `🚗 ${car.brand} ${car.model}`,
        description: `Informatii despre vehiculul cu numarul **${car.plate}**`,
        color: car.colorHex || COLORS.primary,
        fields: [
          { name: '🔢 Numar Inmatriculare', value: `\`${car.plate}\``, inline: true },
          { name: '🏭 Marca', value: car.brand, inline: true },
          { name: '🚗 Model', value: car.model, inline: true },
          { name: '📅 An', value: car.year ? `${car.year}` : 'N/A', inline: true },
          { name: '🎨 Culoare', value: car.color, inline: true },
          { name: '⚡ Motor', value: car.engine || 'N/A', inline: true },
          { name: '⛽ Combustibil', value: car.fuelType, inline: true },
          { name: '⚙️ Transmisie', value: car.transmission, inline: true },
          { name: '📊 Kilometraj', value: `${car.mileage} km`, inline: true },
          { name: '📋 Categorie', value: car.category, inline: true },
          { name: '👤 Proprietar', value: owner ? `${owner}` : 'Necunoscut', inline: true },
          { name: '🎮 Roblox', value: car.robloxUsername || 'N/A', inline: true },
          { name: '🛡️ Asigurare', value: car.insurance.active ? `✅ ${car.insurance.type}` : '❌ Fara asigurare', inline: true },
          { name: '📊 Status', value: car.status, inline: true },
          { name: '📅 Inmatriculat', value: `<t:${Math.floor(car.registeredAt / 1000)}:R>`, inline: true },
        ],
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: `car_transfer_${car.plate}`, label: 'Transfera', style: ButtonStyle.Primary, emoji: '🔄' }),
        createButton({ customId: `car_insurance_${car.plate}`, label: 'Asigurare', style: ButtonStyle.Success, emoji: '🛡️' }),
        createButton({ customId: `car_scrap_${car.plate}`, label: 'Caseaza', style: ButtonStyle.Danger, emoji: '🗑️' }),
      ]);

      await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to show car info: ${error.message}`);
      await interaction.reply({
        content: '❌ A aparut o eroare!',
        ephemeral: true,
      });
    }
  }

  static async transferCar(interaction, plate) {
    try {
      const car = await Car.findOne({ 
        guildId: interaction.guild.id, 
        plate: plate.toUpperCase() 
      });

      if (!car) {
        return interaction.reply({
          content: `❌ Vehiculul cu numarul **${plate}** nu a fost gasit!`,
          ephemeral: true,
        });
      }

      if (car.ownerId !== interaction.user.id) {
        return interaction.reply({
          content: '❌ Nu esti proprietarul acestui vehicul!',
          ephemeral: true,
        });
      }

      // Show user select
      const modal = createModal({
        customId: `modal_car_transfer_${plate}`,
        title: 'Transfera Vehicul',
        components: [
          [
            {
              customId: 'target_user',
              label: 'ID-ul Utilizatorului',
              style: TextInputStyle.Short,
              placeholder: 'Introdu ID-ul Discord al utilizatorului...',
              required: true,
              maxLength: 20,
            },
          ],
        ],
      });

      await interaction.showModal(modal);

      const filter = (i) => i.customId === `modal_car_transfer_${plate}` && i.user.id === interaction.user.id;
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 });

      const targetId = modalInteraction.fields.getTextInputValue('target_user');

      try {
        const targetMember = await interaction.guild.members.fetch(targetId);
        
        // Transfer car
        car.ownerId = targetId;
        car.ownerUsername = targetMember.user.username;
        car.history.push({
          action: 'transferred',
          by: interaction.user.id,
          details: `Transferat de la ${interaction.user.username} la ${targetMember.user.username}`,
        });
        await car.save();

        const embed = createEmbed({
          title: '🔄 Vehicul Transferat',
          description: `Vehiculul **${car.plate}** a fost transferat cu succes!`,
          color: COLORS.success,
          fields: [
            { name: '🚗 Vehicul', value: `${car.brand} ${car.model}`, inline: true },
            { name: '👤 De la', value: `${interaction.user}`, inline: true },
            { name: '👤 La', value: `${targetMember}`, inline: true },
          ],
          timestamp: true,
        });

        await modalInteraction.reply({ embeds: [embed] });
        logger.info(`Car ${plate} transferred from ${interaction.user.tag} to ${targetMember.user.tag}`);
      } catch (error) {
        await modalInteraction.reply({
          content: '❌ Utilizatorul nu a fost gasit pe server!',
          ephemeral: true,
        });
      }
    } catch (error) {
      logger.error(`Failed to transfer car: ${error.message}`);
    }
  }

  static async scrapCar(interaction, plate) {
    try {
      const car = await Car.findOne({ 
        guildId: interaction.guild.id, 
        plate: plate.toUpperCase() 
      });

      if (!car) {
        return interaction.reply({
          content: `❌ Vehiculul cu numarul **${plate}** nu a fost gasit!`,
          ephemeral: true,
        });
      }

      if (car.ownerId !== interaction.user.id) {
        return interaction.reply({
          content: '❌ Nu esti proprietarul acestui vehicul!',
          ephemeral: true,
        });
      }

      // Confirm
      const embed = createEmbed({
        title: '⚠️ Confirmare Casare',
        description: `Esti sigur ca vrei sa casezi vehiculul **${car.brand} ${car.model}** cu numarul **${car.plate}**?\n\n**Aceasta actiune este ireversibila!**`,
        color: COLORS.danger,
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: `car_scrap_confirm_${plate}`, label: 'Da, Caseaza', style: ButtonStyle.Danger, emoji: '🗑️' }),
        createButton({ customId: `car_scrap_cancel_${plate}`, label: 'Nu, Anuleaza', style: ButtonStyle.Secondary, emoji: '❌' }),
      ]);

      await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to scrap car: ${error.message}`);
    }
  }

  static async confirmScrap(interaction, plate) {
    try {
      const car = await Car.findOne({ 
        guildId: interaction.guild.id, 
        plate: plate.toUpperCase() 
      });

      if (!car) {
        return interaction.reply({
          content: `❌ Vehiculul cu numarul **${plate}** nu a fost gasit!`,
          ephemeral: true,
        });
      }

      // Delete car
      await Car.deleteOne({ _id: car._id });

      const embed = createEmbed({
        title: '🗑️ Vehicul Casat',
        description: `Vehiculul **${car.brand} ${car.model}** cu numarul **${car.plate}** a fost casat!`,
        color: COLORS.danger,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      logger.info(`Car ${plate} scrapped by ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Failed to confirm scrap: ${error.message}`);
    }
  }

  static async searchCar(interaction, query) {
    try {
      const cars = await Car.find({
        guildId: interaction.guild.id,
        $or: [
          { plate: { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } },
          { model: { $regex: query, $options: 'i' } },
          { robloxUsername: { $regex: query, $options: 'i' } },
        ],
        status: 'active',
      }).limit(10);

      if (cars.length === 0) {
        return interaction.reply({
          content: `❌ Nu s-au gasit vehicule pentru cautarea **${query}**!`,
          ephemeral: true,
        });
      }

      const embed = createEmbed({
        title: '🔍 Rezultate Cautare',
        description: `S-au gasit **${cars.length}** vehicule:`,
        color: COLORS.primary,
        fields: cars.map(car => ({
          name: `🔢 ${car.plate}`,
          value: `**${car.brand} ${car.model}**\n👤 ${car.robloxUsername || car.ownerUsername}`,
          inline: true,
        })),
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to search cars: ${error.message}`);
    }
  }

  static async handleButton(interaction) {
    const { customId } = interaction;

    if (customId.startsWith('car_transfer_')) {
      const plate = customId.split('_')[2];
      await this.transferCar(interaction, plate);
    }

    if (customId.startsWith('car_insurance_')) {
      // Handle insurance
      await interaction.reply({
        content: '🛡️ Functia de asigurare va fi disponibila in curand!',
        ephemeral: true,
      });
    }

    if (customId.startsWith('car_scrap_') && !customId.includes('confirm') && !customId.includes('cancel')) {
      const plate = customId.split('_')[2];
      await this.scrapCar(interaction, plate);
    }

    if (customId.startsWith('car_scrap_confirm_')) {
      const plate = customId.split('_')[3];
      await this.confirmScrap(interaction, plate);
    }

    if (customId.startsWith('car_scrap_cancel_')) {
      await interaction.reply({
        content: '❌ Casarea a fost anulata!',
        ephemeral: true,
      });
    }
  }
}

module.exports = CarService;
