import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { TextChannel, VoiceBasedChannel } from "discord.js";
import { logger } from "../lib/logger.js";
import playdl from "play-dl";

export interface Track {
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  requestedBy: string;
}

export class GuildQueue {
  public tracks: Track[] = [];
  public currentTrack: Track | null = null;
  public volume = 100;
  public looping = false;

  private player: AudioPlayer;
  private connection: VoiceConnection | null = null;
  private textChannel: TextChannel;
  private guildId: string;
  private resource: AudioResource | null = null;

  constructor(guildId: string, textChannel: TextChannel) {
    this.guildId = guildId;
    this.textChannel = textChannel;
    this.player = createAudioPlayer();

    this.player.on(AudioPlayerStatus.Idle, () => {
      if (this.looping && this.currentTrack) {
        this.tracks.unshift(this.currentTrack);
      }
      this.playNext();
    });

    this.player.on("error", (err) => {
      logger.error({ err }, "Audio player error");
      this.textChannel.send(`Error playing track: ${err.message}`).catch(() => {});
      this.playNext();
    });
  }

  async join(voiceChannel: VoiceBasedChannel): Promise<void> {
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
      this.connection.subscribe(this.player);
    } catch (err) {
      this.connection.destroy();
      this.connection = null;
      throw new Error("Could not connect to voice channel within 20 seconds.");
    }

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  async addTrack(track: Track): Promise<void> {
    this.tracks.push(track);
    if (this.player.state.status === AudioPlayerStatus.Idle && !this.currentTrack) {
      await this.playNext();
    }
  }

  async playNext(): Promise<void> {
    if (this.tracks.length === 0) {
      this.currentTrack = null;
      this.textChannel.send("Queue finished. Disconnecting...").catch(() => {});
      setTimeout(() => this.destroy(), 5000);
      return;
    }

    const track = this.tracks.shift()!;
    this.currentTrack = track;

    try {
      const stream = await playdl.stream(track.url, { quality: 2 });
      this.resource = createAudioResource(stream.stream, {
        inputType: stream.type as StreamType,
        inlineVolume: true,
      });
      this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
      this.player.play(this.resource);

      await this.textChannel.send({
        embeds: [
          {
            color: 0x5865f2,
            title: "Now Playing",
            description: `**[${track.title}](${track.url})**`,
            thumbnail: { url: track.thumbnail },
            fields: [
              { name: "Duration", value: track.duration, inline: true },
              { name: "Requested by", value: track.requestedBy, inline: true },
            ],
          },
        ],
      });
    } catch (err: any) {
      logger.error({ err }, "Failed to play track");
      await this.textChannel.send(`Failed to play **${track.title}**. Skipping...`).catch(() => {});
      this.currentTrack = null;
      this.playNext();
    }
  }

  pause(): boolean {
    return this.player.pause();
  }

  resume(): boolean {
    return this.player.unpause();
  }

  skip(): void {
    this.player.stop();
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(200, vol));
    this.resource?.volume?.setVolumeLogarithmic(this.volume / 100);
  }

  isPlaying(): boolean {
    return this.player.state.status === AudioPlayerStatus.Playing;
  }

  isPaused(): boolean {
    return this.player.state.status === AudioPlayerStatus.Paused;
  }

  getStatus(): AudioPlayerStatus {
    return this.player.state.status;
  }

  destroy(): void {
    this.tracks = [];
    this.currentTrack = null;
    this.player.stop(true);
    const conn = getVoiceConnection(this.guildId);
    conn?.destroy();
    this.connection = null;
  }
}
