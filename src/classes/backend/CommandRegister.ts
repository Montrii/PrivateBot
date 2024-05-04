// Registers all commands in the backend

import {ChatInputCommandInteraction, Guild, REST} from "discord.js"
import {Command} from "./commands/Command";
import commands from "./commands/CommandStorage";
import {GuildInformer} from "./GuildInformer";

const { Routes } = require("discord.js")

export class CommandRegister {

    private static instance: CommandRegister;

    private client: any;
    // Private constructor to prevent external instantiation

    private areCommandRegistered: boolean = false;

    private commands: Command[] = [];
    private constructor() {
    }

    // Static method to get the single instance of the class
    public static getInstance(): CommandRegister {
        if (!CommandRegister.instance) {
            CommandRegister.instance = new CommandRegister();
        }
        return CommandRegister.instance;
    }

    // Sets the client for the CommandRegister
    public setClient(client: any) {
        this.client = client;
        return this
    }

    private loadCommands(): Command[] {
        this.commands = commands;
        return this.commands;
    }


    public async registerCommands() {
        // Early exit if already registered
        if (this.areCommandRegistered) {
            return;
        }

        const commands = this.loadCommands()

        const rest = new REST({ version: '10' }).setToken((process.env.TOKEN as string))
        await (async () => {
            try {
                console.log("[COMMAND-REGISTRATION]: Started registering commands.")
                const promises = [];
                GuildInformer.getInstance().getAllGuilds().forEach(async (guild) => {
                    // Get all the commands that are for this guild
                    const guildCommands = commands.filter((command) => command.isForAllGuilds() || command.specifcGuildId() === guild.id);
                    console.log("[COMMAND-REGISTRATION]: Registering " + guildCommands.length + " commands for guild " + guild.name);

                    // Put the commands in the right format for registering
                    const formattedCommands = guildCommands.map((command) => ({
                        name: command.getName(),
                        description: command.getDescription(),
                    }));

                    // Make promises to register the commands
                    const promise = rest.put(
                        Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                        { body: formattedCommands }
                    );

                    promises.push(promise);
                });

                // Register all the commands
                try {
                    // Run all promises
                    await Promise.all(promises);
                    // Once all commands are registered, launch the interactionCreate event and check if the command got called
                    this.client.on("interactionCreate", this.handleInteractionCreateEvent);

                    console.log("[COMMAND-REGISTRATION]: Successfully registered commands.");
                } catch (error) {
                    console.error("[COMMAND-REGISTRATION]: Error occurred while registering commands: " + error.message);
                }

            } catch(error: any) {
                console.error("[COMMAND-REGISTRATION]: " + error.message)
            }
        })();
    }

    // Handles the interactionCreate event
    private async handleInteractionCreateEvent(interaction: ChatInputCommandInteraction) {
        if (!interaction.isChatInputCommand()) return;

        // if interaction is chatInputCommand, then find the command and call the callback
        const command = commands.find((command: Command) => command.getName() === interaction.commandName);
        if(!command) {
            console.error("[COMMAND-REGISTRATION]: Command not found: " + interaction.commandName)
            return;
        }

        // Call interaction callback
        command.callInteractionCallback(interaction);
    }

}