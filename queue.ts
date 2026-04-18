import { ChatInputCommandInteraction } from "discord.js";
import { getQueue } from "../MusicManager.js";

export async function handleQueue(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = getQueue(interaction.guildId!);
  if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
    await interaction.reply({ content: "The queue is empty.", ephemeral: true });
    return;
  }

  const page = (interaction.options.getInteger("page") ?? 1) - 1;
  const pageSize = 10;
  const tracks = queue.tracks;
  const totalPages = Math.max(1, Math.ceil(tracks.length / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = tracks.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const lines: string[] = [];
  if (safePage === 0 && queue.currentTrack) {
    lines.push(`**Now Playing:**\n[${queue.currentTrack.title}](${queue.currentTrack.url}) — ${queue.currentTrack.duration}`);
  }

  if (slice.length > 0) {
    lines.push("\n**Up Next:**");
    slice.forEach((t, i) => {
      lines.push(`${safePage * pageSize + i + 1}. [${t.title}](${t.url}) — ${t.duration} | *${t.requestedBy}*`);
    });
  }

  await interaction.reply({
    embeds: [
      {
        color: 0x5865f2,
        title: `Queue — ${tracks.length} track${tracks.length !== 1 ? "s" : ""} in queue`,
        description: lines.join("\n"),
        footer: { text: `Page ${safePage + 1}/${totalPages} • Volume: ${queue.volume}%` },
      },
    ],
  });
}
