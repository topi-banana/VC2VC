import {
  SlashCommandBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  CacheType,
  VoiceChannel,
} from "discord.js";
import {
  createAudioPlayer,
  createAudioResource,
  EndBehaviorType,
  NoSubscriberBehavior,
  StreamType,
} from "@discordjs/voice";
import * as AudioMixer from "audio-mixer-v2";
import Prism = require("prism-media");
import { PassThrough, Readable } from "node:stream";
import { connections } from "../connections";

export const register = () => {
  return new SlashCommandBuilder()
    .setName("stream")
    .setDescription("stream vc to vc")
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

  const connection_from = connections.find((x) => {
    const config = x?.joinConfig;
    return config && config.channelId == channel.id;
  });
  if (!connection_from) {
    await interaction.reply("そのチャンネルにはbotが参加していません");
    return;
  }

  const connection_to = connections[shard];
  if (!connection_to) {
    await interaction.reply("このbotがVCに接続されていません");
    return;
  }

  if (
    connection_from.joinConfig.channelId == connection_to.joinConfig.channelId
  ) {
    await interaction.reply("同じチャンネルの接続はできません");
    return;
  }

  const mixer = new AudioMixer.Mixer({
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000,
    // clearInterval: 250,
  });

  connection_from.receiver.speaking.on("start", (userId) => {
    const audio = connection_from.receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 100,
      },
    });

    const standaloneInput = new AudioMixer.Input({
      channels: 2,
      bitDepth: 16,
      sampleRate: 48000,
      volume: 100,
    });
    const audioMixer = mixer;
    audioMixer.addInput(standaloneInput);

    const rawStream = new PassThrough();
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });
    const resource = createAudioResource(mixer as unknown as Readable, {
      inputType: StreamType.Raw,
    });
    player.play(resource);
    connection_to.subscribe(player);

    const decoder = new Prism.opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960,
    });
    audio.on("data", (chunk) => decoder.write(chunk));
    decoder.on("data", (chunk) => rawStream.write(chunk));
    rawStream.on("data", (chunk) => standaloneInput.write(chunk));

    rawStream.on("end", () => {
      if (audioMixer != null) {
        audioMixer.removeInput(standaloneInput);
        standaloneInput.destroy();
        rawStream.destroy();
      }
    });
  });

  await interaction.reply("VCを中継します");
  return;
};
