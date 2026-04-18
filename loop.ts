import { ChatInputCommandInteraction } from "discord.js";
import { getQueue } from "../MusicManager.js";

export async function handleLoop(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue) {
    await interaction.reply({ content: "Nothing is playing right now.", ephemeral: true });
    return;
  }
  queue.looping = !queue.looping;
  await interaction.reply({
    embeds: [
      {
        color: 0x5865f2,
        description: queue.looping
          ? "Loop enabled — current track will repeat."
          : "Loop disabled.",
      },
    ],
  });
}
