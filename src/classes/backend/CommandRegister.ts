// Registers all commands in the backend

import {ChatInputCommandInteraction, Guild, REST, SlashCommandBuilder} from "discord.js"
import {Command} from "./commands/Command";
import getCommands from "./commands/CommandStorage";
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
        this.commands = getCommands();
        return this.commands;
    }


    public async registerCommands() {
        // Early exit if already registered
        if (this.areCommandRegistered) {
            return;
        }

        const commands = this.loadCommands()
        if(commands.length <= 0) {
            console.error("[COMMAND-REGISTRATION]: No commands found. Exiting command registration.")
            return;
        }

        const rest = new REST({ version: '10' }).setToken((process.env.TOKEN as string))
        await (async () => {
            try {
                console.log("[COMMAND-REGISTRATION]: Started registering commands.")
                const promises: Promise<any>[] = [];
                GuildInformer.getInstance().getGuildsWithTheirCommands(commands).forEach(async (guild) => {
                    // Get all the commands that are for this guild
                    console.log("[COMMAND-REGISTRATION]: Registering " + guild.botCommands.length + " commands for guild " + guild.name);

                    // Put the commands in the right format for registering
                    const formattedCommands = guild.botCommands.map((command: Command) => {
                        // Start building the command using SlashCommandBuilder
                        const slashCommand = new SlashCommandBuilder()
                            .setName(command.getName())
                            .setDescription(command.adjustCommandForGuild(guild).getDescription());

                        // @ts-ignore
                        // Add parameters to the command
                        command.parameters.forEach((param) => {
                            // Add the parameters to the command using proper types (e.g., STRING, INTEGER)
                            if (param.type === 'STRING') {
                                slashCommand.addStringOption(option =>
                                    option.setName(param.name)
                                        .setDescription(param.description)
                                        .setRequired(param.required)
                                );
                            } else if (param.type === 'INTEGER') {
                                slashCommand.addIntegerOption(option =>
                                    option.setName(param.name)
                                        .setDescription(param.description)
                                        .setRequired(param.required)
                                );
                            } else if (param.type === 'BOOLEAN') {
                                slashCommand.addBooleanOption(option =>
                                    option.setName(param.name)
                                        .setDescription(param.description)
                                        .setRequired(param.required)
                                );
                            }
                            // Add more types if needed (e.g., USER, CHANNEL, etc.)
                        });

                        // Return the formatted command
                        return slashCommand.toJSON(); // Convert SlashCommandBuilder to plain object for API registration
                    });

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
                    await Promise.all((promises as Promise<any>[]));
                    // Once all commands are registered, launch the interactionCreate event and check if the command got called
                    this.client.on("interactionCreate", this.handleInteractionCreateEvent);

                    console.log("[COMMAND-REGISTRATION]: Successfully registered commands.");
                } catch (error: any) {
                    console.error("[COMMAND-REGISTRATION]: Error occurred while registering commands: " + error.message + " - " + error.stack);
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
        // @ts-ignore
        const command = interaction.guild!.botCommands!.find((command: Command) => command.getName() === interaction.commandName);
        if(!command) {
            console.error("[COMMAND-REGISTRATION]: Command not found: " + interaction.commandName)
            return;
        }

        // Call interaction callback
        command.callInteractionCallback(interaction, command);
    }

}