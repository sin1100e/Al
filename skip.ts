import { ChatInputCommandInteraction } from "discord.js";
import { getQueue } from "../MusicManager.js";

export async function handleSkip(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue || !queue.currentTrack) {
    await interaction.reply({ content: "Nothing is playing right now.", ephemeral: true });
    return;
  }
  const skipped = queue.currentTrack.title;
  queue.skip();
  await interaction.reply({
    embeds: [
      {
        color: 0x5865f2,
        description: `Skipped **${skipped}**.`,
      },
    ],
  });
}
