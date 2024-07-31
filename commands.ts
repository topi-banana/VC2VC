import {
  CacheType,
  ChatInputCommandInteraction,
  REST,
  Routes,
} from "discord.js";
import * as join from "./commands/join";
import * as disconnect from "./commands/disconnect";
import * as stream from "./commands/stream";

export const register = async (rest: REST, client_id: string) => {
  const commands = [
    join.register().toJSON(),
    disconnect.register().toJSON(),
    stream.register().toJSON(),
  ];

  await rest.put(Routes.applicationCommands(client_id), { body: commands });
};

export const execute = async (
  interaction: ChatInputCommandInteraction<CacheType>,
  shard: number
) => {
  switch (interaction.commandName) {
    case "join":
      await join.execute(interaction, shard);
      break;
    case "disconnect":
      await disconnect.execute(interaction, shard);
      break;
    case "stream":
      await stream.execute(interaction, shard);
      break;
  }
};
