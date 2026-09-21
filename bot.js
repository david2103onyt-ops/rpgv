require('dotenv').config();
const config = require('./config');
const BotClient = require('./bot/client');
const connectDB = require('./database/connection');
const logger = require('./utils/logger');
const { REST, Routes } = require('discord.js');

const client = new BotClient();

async function deployCommands() {
  const commands = [];
  client.commands.forEach(command => {
    commands.push(command.data.toJSON());
  });

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    logger.info('Started refreshing application (/) commands.');

    if (config.discord.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands }
      );
      logger.info(`Successfully reloaded ${commands.length} guild commands.`);
    } else {
      await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands }
      );
      logger.info(`Successfully reloaded ${commands.length} global commands.`);
    }
  } catch (error) {
    logger.error(`Error deploying commands: ${error.message}`);
  }
}

async function startBot() {
  try {
    logger.info('Starting Greenville RP Bot...');

    const requiredEnvs = ['DISCORD_TOKEN', 'CLIENT_ID', 'MONGODB_URI', 'ENCRYPTION_KEY'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

    if (missingEnvs.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
    }

    await connectDB();
    logger.info('Database connected.');
    
    await client.loadCommands();
    logger.info('Commands loaded.');
    
    await client.loadEvents();
    logger.info('Events loaded.');
    
    await deployCommands();
    
    await client.login(config.discord.token);
    logger.info('Bot logged in successfully.');
  } catch (error) {
    console.error('FATAL STARTUP ERROR:');
    console.error(error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:');
  console.error(error);
  process.exit(1);
});

startBot();

module.exports = client;
