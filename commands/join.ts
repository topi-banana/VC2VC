import {
  SlashCommandBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  CacheType,
  VoiceChannel,
} from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import { connections } from "../connections";

export const register = () => {
  return new SlashCommandBuilder()
    .setName("join")
    .setDescription("join VC")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("VC")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    );
};

export const execute = async (
  interaction: ChatInputCommandInteraction<CacheType>,
  shard: number
) => {
  const channel = interaction.options.getChannel("channel") as VoiceChannel;
  if (connections[shard]) {
    await interaction.reply("すでに接続済みです");
    return;
  }
  if (!interaction.guildId) return;
  const guild = interaction.client.guilds.cache.get(interaction.guildId);
  if (!guild) return;
  const connection = joinVoiceChannel({
    group: interaction.client.user.id,
    guildId: interaction.guildId,
    channelId: channel.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfMute: false,
    selfDeaf: false,
  });

  await interaction.reply("接続しました");
  connections[shard] = connection;

  return;
};
