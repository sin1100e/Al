import { ChatInputCommandInteraction } from "discord.js";
import { getQueue, deleteQueue } from "../MusicManager.js";

export async function handleStop(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue) {
    await interaction.reply({ content: "Nothing is playing right now.", ephemeral: true });
    return;
  }
  deleteQueue(interaction.guildId!);
  await interaction.reply({
    embeds: [
      {
        color: 0xed4245,
        description: "Stopped playback and cleared the queue.",
      },
    ],
  });
}
