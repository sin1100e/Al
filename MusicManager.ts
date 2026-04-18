import { TextChannel, VoiceBasedChannel } from "discord.js";
import { GuildQueue } from "./GuildQueue.js";

const queues = new Map<string, GuildQueue>();

export function getQueue(guildId: string): GuildQueue | undefined {
  return queues.get(guildId);
}

export async function getOrCreateQueue(
  guildId: string,
  textChannel: TextChannel,
  voiceChannel: VoiceBasedChannel
): Promise<GuildQueue> {
  let queue = queues.get(guildId);
  if (!queue) {
    queue = new GuildQueue(guildId, textChannel);
    queues.set(guildId, queue);
    await queue.join(voiceChannel);
  }
  return queue;
}

export function deleteQueue(guildId: string): void {
  const queue = queues.get(guildId);
  if (queue) {
    queue.destroy();
    queues.delete(guildId);
  }
}
