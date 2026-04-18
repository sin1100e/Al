import { ChatInputCommandInteraction } from "discord.js";
import { getQueue } from "../MusicManager.js";

export async function handleShuffle(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue || queue.tracks.length < 2) {
    await interaction.reply({ content: "Not enough tracks in the queue to shuffle.", ephemeral: true });
    return;
  }
  for (let i = queue.tracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
  }
  await interaction.reply({
    embeds: [
      {
        color: 0x5865f2,
        description: `Shuffled **${queue.tracks.length}** tracks in the queue.`,
      },
    ],
  });
}
