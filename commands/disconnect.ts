import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
} from "discord.js";
import { connections } from "../connections";

export const register = () => {
  return new SlashCommandBuilder()
    .setName("disconnect")
    .setDescription("disconnect VC");
};

export const execute = async (
  interaction: ChatInputCommandInteraction<CacheType>,
  shard: number
) => {
  const connection = connections[shard];
  if (!connection) {
    await interaction.reply("参加していません");
    return;
  }
  await interaction.reply("切断しました");
  connection.disconnect();
  connection.destroy();
  connections[shard] = undefined;
  return;
};
