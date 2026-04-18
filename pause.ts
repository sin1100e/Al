import { ChatInputCommandInteraction } from "discord.js";
import { getQueue } from "../MusicManager.js";

export async function handlePause(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue || !queue.currentTrack) {
    await interaction.reply({ content: "Nothing is playing right now.", ephemeral: true });
    return;
  }
  if (queue.isPaused()) {
    await interaction.reply({ content: "Playback is already paused.", ephemeral: true });
    return;
  }
  queue.pause();
  await interaction.reply({
    embeds: [{ color: 0xfaa61a, description: "Paused playback." }],
  });
}
