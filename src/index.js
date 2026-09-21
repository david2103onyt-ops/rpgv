require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const connectDB = require('./database/connection');
const logger = require('./utils/logger');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();

async function loadResources() {
    const commandsPath = path.join(__dirname, 'commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            client.commands.set(command.data.name, command);
            logger.info(`Loaded command: ${command.data.name}`);
        }
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        logger.error(`Command Error: ${error.message}`);
        await interaction.reply({ content: '❌ A apărut o eroare internă!', ephemeral: true }).catch(() => {});
    }
});

client.once('ready', () => {
    logger.info(`✅ RPGV Bot Online: ${client.user.tag}`);
});

async function start() {
    try {
        await connectDB();
        await loadResources();
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        logger.error(`Critical Startup Error: ${error.message}`);
        process.exit(1);
    }
}

start();

module.exports = client;
