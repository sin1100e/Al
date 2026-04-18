import { ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import playdl from "play-dl";
import { getOrCreateQueue } from "../MusicManager.js";
import { formatDuration } from "../utils.js";
import { Track } from "../GuildQueue.js";
import { logger } from "../../lib/logger.js";

export async function handlePlay(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.editReply("You must be in a voice channel to use this command.");
    return;
  }

  const query = interaction.options.getString("query", true);

  try {
    let tracks: Track[] = [];

    if (playdl.yt_validate(query) === "video") {
      const info = await playdl.video_info(query);
      tracks.push({
        title: info.video_details.title ?? "Unknown",
        url: info.video_details.url,
        thumbnail: info.video_details.thumbnails?.[0]?.url ?? "",
        duration: formatDuration(info.video_details.durationInSec),
        requestedBy: interaction.user.username,
      });
    } else if (playdl.yt_validate(query) === "playlist") {
      const playlist = await playdl.playlist_info(query, { incomplete: true });
      const videos = await playlist.all_videos();
      tracks = videos.slice(0, 50).map((v) => ({
        title: v.title ?? "Unknown",
        url: v.url,
        thumbnail: v.thumbnails?.[0]?.url ?? "",
        duration: formatDuration(v.durationInSec),
        requestedBy: interaction.user.username,
      }));
    } else {
      const results = await playdl.search(query, { source: { youtube: "video" }, limit: 1 });
      if (!results.length) {
        await interaction.editReply("No results found for your query.");
        return;
      }
      const v = results[0];
      tracks.push({
        title: v.title ?? "Unknown",
        url: v.url,
        thumbnail: v.thumbnails?.[0]?.url ?? "",
        duration: formatDuration(v.durationInSec),
        requestedBy: interaction.user.username,
      });
    }

    const queue = await getOrCreateQueue(
      interaction.guildId!,
      interaction.channel as TextChannel,
      voiceChannel
    );

    for (const track of tracks) {
      await queue.addTrack(track);
    }

    if (tracks.length === 1) {
      const track = tracks[0];
      const isFirst = queue.currentTrack?.url === track.url && queue.tracks.length === 0;
      if (!isFirst) {
        await interaction.editReply({
          embeds: [
            {
              color: 0x5865f2,
              title: "Added to Queue",
              description: `**[${track.title}](${track.url})**`,
              thumbnail: { url: track.thumbnail },
              fields: [
                { name: "Duration", value: track.duration, inline: true },
                { name: "Position", value: `#${queue.tracks.length}`, inline: true },
              ],
            },
          ],
        });
      } else {
        await interaction.editReply({ content: "Starting playback..." });
      }
    } else {
      await interaction.editReply({
        embeds: [
          {
            color: 0x5865f2,
            title: "Playlist Added",
            description: `Added **${tracks.length}** tracks to the queue.`,
          },
        ],
      });
    }
  } catch (err: any) {
    logger.error({ err }, "Play command error");
    await interaction.editReply(`Error: ${err.message ?? "Something went wrong."}`);
  }
}
