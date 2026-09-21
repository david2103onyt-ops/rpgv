const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { Application } = require('../database/models');
const logger = require('../utils/logger');

const applicationQuestions = {
    police: [
        { id: 'name', label: 'Numele Discord', placeholder: 'Ex: David#0001' },
        { id: 'age', label: 'Vârsta', placeholder: 'Ex: 16' },
        { id: 'exp', label: 'Experiența în Roleplay', placeholder: 'Povestește-ne despre experiența ta...' },
        { id: 'reason', label: 'De ce dorești să intri în Poliție?', placeholder: 'Explicația ta...' },
        { id: 'fit', label: 'De ce consideri că ești potrivit?', placeholder: 'Calitățile tale...' },
        { id: 'activity', label: 'Cât timp poți fi activ?', placeholder: 'Ex: 4 ore pe zi' },
        { id: 'past', label: 'Ai mai făcut parte dintr-o facțiune?', placeholder: 'Da/Nu și care' },
        { id: 'situation', label: 'Ce ai face într-o situație RP dificilă?', placeholder: 'Descrie reacția ta...' },
    ],
    fire: [
        { id: 'age', label: 'Vârsta', placeholder: 'Ex: 16' },
        { id: 'exp', label: 'Experiența RP', placeholder: 'Descrie experiența ta...' },
        { id: 'reason', label: 'Motivul aplicării', placeholder: 'De ce vrei să fii pompier?' },
        { id: 'emergency', label: 'Experiență în situații de urgență RP', placeholder: 'Cum ai reacționat?' },
        { id: 'activity', label: 'Activitate', placeholder: 'Cât timp ești disponibil?' },
        { id: 'past', label: 'Experiență anterioară', placeholder: 'Unde mai ai experiență?' },
    ],
    dot: [
        { id: 'age', label: 'Vârsta', placeholder: 'Ex: 16' },
        { id: 'exp', label: 'Experiența RP', placeholder: 'Descrie experiența ta...' },
        { id: 'reason', label: 'Motivul aplicării', placeholder: 'De ce alegi DOT?' },
        { id: 'dot_exp', label: 'Experiență cu DOT', placeholder: 'Ai mai lucrat în DOT?' },
        { id: 'activity', label: 'Activitate', placeholder: 'Cât timp ești disponibil?' },
        { id: 'situation', label: 'Situații RP', placeholder: 'Cum gestionezi traficul?' },
    ],
    host: [
        { id: 'age', label: 'Vârsta', placeholder: 'Ex: 16' },
        { id: 'exp', label: 'Experiență RP', placeholder: 'Descrie experiența ta...' },
        { id: 'host_exp', label: 'Experiență în organizarea sesiunilor', placeholder: 'Ai mai fost host?' },
        { id: 'reason', label: 'De ce vrei să fii Session Host?', placeholder: 'Motivația ta...' },
        { id: 'crowd', label: 'Cum ai gestiona un server aglomerat?', placeholder: 'Planul tău de organizare...' },
        { id: 'conflict', label: 'Cum ai gestiona un conflict?', placeholder: 'Cum rezolvi disputele?' },
        { id: 'time', label: 'Cât timp poți organiza sesiuni?', placeholder: 'Disponibilitatea ta...' },
    ]
};

async function createApplicationModal(interaction, faction) {
    const questions = applicationQuestions[faction];
    const modal = new ModalBuilder().setTitle(`Aplicație ${faction.toUpperCase()} RPGV`);

    // Modals only support 5 fields. We split questions into sets or prioritize.
    // To implement all 8, we need a multi-step modal system. For now, we take first 5.
    const rows = [];
    for (let i = 0; i < Math.min(questions.length, 5); i++) {
        const q = questions[i];
        const input = new TextInputBuilder()
            .setCustomId(`app_${faction}_${q.id}`)
            .setLabel(q.label)
            .setPlaceholder(q.placeholder)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        rows.push(new ActionRowBuilder().addComponents(input));
    }
    modal.addComponents(...rows);
    await interaction.showModal(modal);
}

module.exports = { createApplicationModal, applicationQuestions };
