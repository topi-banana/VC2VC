import { Client, Events, GatewayIntentBits, REST } from "discord.js";
import * as fs from "node:fs";
import * as commands from "./commands";
import { VoiceConnection } from "@discordjs/voice";

type Config = {
  clients: string[];
};
const config: Config = JSON.parse(
  fs.readFileSync("config.json", { encoding: "utf-8" })
);
const connections: (VoiceConnection | undefined)[] = [];

const clients = config.clients.map(
  () =>
    new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    })
);

clients.forEach((c, i) => {
  const token = config.clients[i];
  const rest = new REST({ version: "10" }).setToken(token);

  c.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await commands.execute(interaction, i);
  });

  // c.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  //   if (oldState.id != newState.id) return;
  //   if (oldState.id != c.user?.id) return;
  //   if (oldState.channelId && !newState.channelId) {
  //     connections[i] = undefined;
  //   }
  // })

  c.once(Events.ClientReady, async (client) => {
    console.log(`[CLIENT] Ready! Logged in as ${client.user.tag}`);
    await commands.register(rest, client.user.id);
  });

  c.login(token);
});
