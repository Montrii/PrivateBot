import { Client } from "discord.js";
import "dotenv/config";

const client = new Client({
    intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent", "DirectMessageTyping", "DirectMessageReactions", "DirectMessageReactions"]
});


client.on("ready", () => {
    console.log("Hey");
})

client.login(process.env.TOKEN);
