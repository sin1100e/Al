import { ChatInputCommandInteraction } from "discord.js";
import { getQueue } from "../MusicManager.js";

export async function handleNowPlaying(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue || !queue.currentTrack) {
    await interaction.reply({ content: "Nothing is playing right now.", ephemeral: true });
    return;
  }
  const track = queue.currentTrack;
  await interaction.reply({
    embeds: [
      {
        color: 0x5865f2,
        title: queue.isPlaying() ? "Now Playing" : "Paused",
        description: `**[${track.title}](${track.url})**`,
        thumbnail: { url: track.thumbnail },
        fields: [
          { name: "Duration", value: track.duration, inline: true },
          { name: "Requested by", value: track.requestedBy, inline: true },
          { name: "Volume", value: `${queue.volume}%`, inline: true },
          { name: "Queue", value: `${queue.tracks.length} track(s) up next`, inline: true },
        ],
      },
    ],
  });
}
