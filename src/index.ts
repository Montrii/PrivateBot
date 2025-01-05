import { Client } from "discord.js";
import "dotenv/config";

/*
*
* Custom imports from myself.
*
 */
import "./classes/backend/ErrorHandling"

// Managers (wrappers for all tasks requires to fulfill result)
import {SteamManager} from "./classes/managers/steam/SteamManager";
import {EpicGamesManager} from "./classes/managers/epicgames/EpicGamesManager";
import {DiscordUpdater} from "./classes/managers/discord/DiscordUpdater";
import {GuildInformer} from "./classes/backend/GuildInformer";
import {CommandRegister} from "./classes/backend/CommandRegister";
import {EbayManager} from "./classes/managers/ebay/EbayManager";
import {GenshinManager} from "./classes/managers/genshin/GenshinManager";


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

    await new GenshinManager().runAllTasks()
    await new SteamManager().runAllTasks()
    await new EpicGamesManager().runAllTasks()
    await new EbayManager().runAllTasks()


})

// Works!
client.login(process.env.TOKEN);
