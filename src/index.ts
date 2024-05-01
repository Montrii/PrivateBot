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

// Managers (wrappers for all tasks requires to fulfill result)
import {SteamManager} from "./classes/managers/steam/SteamManager";


// Class Hierachy
// ------------------------------------------
// Updater (DiscordUpdater) reads and writes to discord
// Manager define an entire area (like e.g. steam, epic games, etc)
// Managers have Tasks
// Tasks report to Manager
// Manager decide when to notify updater
// Updater updates data on Discord if needed.
// ------------------------------------------
// DiscordUpdater -> Managers (Area) -> Tasks
// ------------------------------------------
// Structures independent from this circle: ConsoleManager, DockerHandler, Localisation.

const client = new Client({
    intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent", "DirectMessageTyping", "DirectMessageReactions", "DirectMessageReactions"]
});

client.on("ready", (user) => {
    // If .env setting determines that the bot is required to run in Docker and it isnt, it will fail to execute.
    if(process.env.NEEDS_DOCKER === 'true' && !DockerHandler.isInDocker())
        throw new Error("Bot is required to run in Docker!")


    console.log("[BOT]: " + user.user.username + " is being initialized!");

    new SteamManager().runAllTasks()

})

client.login(process.env.TOKEN);
