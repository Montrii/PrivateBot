import { Client } from "discord.js";
import "dotenv/config";

/*
*
* Custom imports from myself.
*
 */
import {ConsoleManager} from "./classes/backend/ConsoleManager";
import "./classes/backend/ErrorHandling"
import {Localisation} from "./classes/localisation/Localisation";
import {DockerHandler} from "./classes/docker/DockerHandler";



const client = new Client({
    intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent", "DirectMessageTyping", "DirectMessageReactions", "DirectMessageReactions"]
});


client.on("ready", (user) => {
    // If .env setting determines that the bot is required to run in Docker and it isnt, it will fail to execute.
    if(process.env.NEEDS_DOCKER === 'true' && !DockerHandler.isInDocker())
        throw new Error("Bot is required to run in Docker!")


    console.log("[BOT]: " + user.user.username + " is being initialized!");
})

client.login(process.env.TOKEN);
