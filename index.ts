import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Interaction,
} from "discord.js";
import { logger } from "../lib/logger.js";
import { handlePlay } from "./commands/play.js";
import { handlePause } from "./commands/pause.js";
import { handleResume } from "./commands/resume.js";
import { handleSkip } from "./commands/skip.js";
import { handleStop } from "./commands/stop.js";
import { handleQueue } from "./commands/queue.js";
import { handleNowPlaying } from "./commands/nowplaying.js";
import { handleVolume } from "./commands/volume.js";
import { handleShuffle } from "./commands/shuffle.js";
import { handleLoop } from "./commands/loop.js";

const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or playlist from YouTube")
    .addStringOption((o) =>
      o.setName("query").setDescription("Song name or YouTube URL").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the current track"),
  new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume paused playback"),
  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current track"),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop playback and clear the queue"),
  new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current queue")
    .addIntegerOption((o) =>
      o.setName("page").setDescription("Page number").setMinValue(1)
    ),
  new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show the currently playing track"),
  new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set the playback volume (0–200)")
    .addIntegerOption((o) =>
      o
        .setName("level")
        .setDescription("Volume level (0–200, default 100)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(200)
    ),
  new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle the queue"),
  new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Toggle loop mode for the current track"),
];

async function registerCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    logger.info("Registering slash commands globally...");
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands.map((c) => c.toJSON()),
    });
    logger.info("Slash commands registered successfully.");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
    throw err;
  }
}

export async function startBot(): Promise<void> {
  const token = process.env["DISCORD_BOT_TOKEN"]?.trim();
  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN not set — Discord bot will not start.");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
    ],
  });

  client.once("clientReady", async (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot is ready");
    try {
      await registerCommands(token, c.user.id);
    } catch (err) {
      logger.error({ err }, "Command registration failed");
    }
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This bot only works in servers.",
        ephemeral: true,
      });
      return;
    }

    const cmd = interaction as ChatInputCommandInteraction;
    try {
      switch (interaction.commandName) {
        case "play":        await handlePlay(cmd); break;
        case "pause":       await handlePause(cmd); break;
        case "resume":      await handleResume(cmd); break;
        case "skip":        await handleSkip(cmd); break;
        case "stop":        await handleStop(cmd); break;
        case "queue":       await handleQueue(cmd); break;
        case "nowplaying":  await handleNowPlaying(cmd); break;
        case "volume":      await handleVolume(cmd); break;
        case "shuffle":     await handleShuffle(cmd); break;
        case "loop":        await handleLoop(cmd); break;
        default:
          await interaction.reply({ content: "Unknown command.", ephemeral: true });
      }
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Command handler error");
      const payload = { content: "An error occurred while executing this command.", ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  });

  await client.login(token);
}
