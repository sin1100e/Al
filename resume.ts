import { ChatInputCommandInteraction } from "discord.js";
import { getQueue } from "../MusicManager.js";

export async function handleResume(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue || !queue.currentTrack) {
    await interaction.reply({ content: "Nothing is paused right now.", ephemeral: true });
    return;
  }
  if (!queue.isPaused()) {
    await interaction.reply({ content: "Playback is not paused.", ephemeral: true });
    return;
  }
  queue.resume();
  await interaction.reply({
    embeds: [{ color: 0x57f287, description: "Resumed playback." }],
  });
}
