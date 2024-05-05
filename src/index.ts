import { Client } from "discord.js";
import "dotenv/config";

/*
*
* Custom imports from myself.
*
 */
import {ConsoleManager} from "./classes/backend/ConsoleManager";
import "./classes/backend/ErrorHandling"

// Managers (wrappers for all tasks requires to fulfill result)
import {SteamManager} from "./classes/managers/steam/SteamManager";
import {EpicGamesManager} from "./classes/managers/epicgames/EpicGamesManager";
import {DiscordUpdater} from "./classes/managers/discord/DiscordUpdater";
import {GuildInformer} from "./classes/backend/GuildInformer";
import {CommandRegister} from "./classes/backend/CommandRegister";


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

client.on("ready", async (user) => {

    console.log("[BOT]: " + user.user.username + " is being initialized!");

    // Feeding DiscordUpdater the client
    DiscordUpdater.getInstance().setClient(client).setUser(user.user);
    // Feeding the GuildInformer the client
    GuildInformer.getInstance().setClient(client);

    // Registering all commands
    await CommandRegister.getInstance().setClient(client).registerCommands();

    await new SteamManager().runAllTasks()
    await new EpicGamesManager().runAllTasks()

})

client.login(process.env.TOKEN);
