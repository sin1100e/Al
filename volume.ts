import { ChatInputCommandInteraction } from "discord.js";
import { getQueue } from "../MusicManager.js";

export async function handleVolume(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue) {
    await interaction.reply({ content: "Nothing is playing right now.", ephemeral: true });
    return;
  }
  const vol = interaction.options.getInteger("level", true);
  queue.setVolume(vol);
  await interaction.reply({
    embeds: [
      {
        color: 0x5865f2,
        description: `Volume set to **${queue.volume}%**.`,
      },
    ],
  });
}
