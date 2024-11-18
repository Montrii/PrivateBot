import { Localisation } from "../../localisation/Localisation";
import { ChatInputCommandInteraction, Guild, SlashCommandBuilder } from "discord.js";

// Define a type for the parameters
interface CommandParameter {
    name: string;
    type: string;  // e.g. 'STRING', 'INTEGER', 'BOOLEAN', etc.
    description: string;
    required: boolean;
}

export class Command {

    // Name of the command
    private readonly name: string;

    // Description translation key
    private descriptionKey: string;

    // Description of the command
    private description: string = "";

    // Should command be for all guilds?
    private allGuilds: boolean = true;

    // if allGuilds is false, then this is the guild id
    private onlyForThisGuild: string = "";

    // Should the command return feedback only for the user
    private onlyForUser: boolean = false;

    // Callback function when command is called
    private interactionCallback: any = ((interaction: ChatInputCommandInteraction, command: Command) => {
        console.log("Command: " + this.name + " called" + interaction);
    });

    // Commands own localisation
    public localisation: Localisation;

    // List of parameters for the command
    private parameters: CommandParameter[] = [];

    constructor(name: string, descriptionKey: string) {
        this.name = this.formatName(name);
        this.descriptionKey = descriptionKey;
        this.localisation = new Localisation();
    }

    // Add a parameter to the command
    public addParameter(name: string, type: string, description: string, required: boolean) {
        this.parameters.push({ name, type, description, required });
        return this;
    }

    // Adjust the command for a specific guild
    public adjustCommandForGuild(guild: Guild) {
        this.description = this.localisation.setLanguage(guild.preferredLocale as string).get(this.descriptionKey);
        console.log("[COMMAND] '" + this.name + "' has adjusted for guild: '" + guild.name + "' into language '" + guild.preferredLocale + "'.");
        return this;
    }

    // Format that helps adjust the name of the command
    private formatName(name: string) {
        let formattedName = name.toLowerCase();
        for (let i = 1; i < name.length; i++) {
            if (name[i] !== name[i].toLowerCase() && name[i - 1] === name[i - 1].toLowerCase()) {
                formattedName = formattedName.slice(0, i) + "-" + formattedName.slice(i);
            }
        }
        return formattedName;
    }

    // Set the command for a specific guild
    public setForSpecficGuild(guildId: string) {
        this.allGuilds = false;
        this.onlyForThisGuild = guildId;
        return this;
    }

    // Set the callback function
    public setInteractionCallback(callback: any) {
        this.interactionCallback = callback;
        return this;
    }

    // Set the command to be for a specific user only
    public setOnlyForUser() {
        this.onlyForUser = true;
        return this;
    }

    // Check if the command is for a specific user only
    public isOnlyForUser(): boolean {
        return this.onlyForUser;
    }

    // Get the command name
    public getName(): string {
        return this.name;
    }

    // Get the command description
    public getDescription(): string {
        return this.description;
    }

    // Check if the command is for all guilds
    public isForAllGuilds(): boolean {
        return this.allGuilds;
    }

    // Get the specific guild id
    public specifcGuildId(): string {
        return this.onlyForThisGuild;
    }

    // Get the interaction callback
    public getInteractionCallback(): any {
        return this.interactionCallback;
    }

    // Call the interaction callback
    public callInteractionCallback(interaction: ChatInputCommandInteraction, command: Command) {
        this.interactionCallback(interaction, command);
    }

    // Method to register the command and parameters with Discord
    public registerCommand(builder: SlashCommandBuilder) {
        builder.setName(this.name)
            .setDescription(this.description);

        this.parameters.forEach(param => {
            builder.addStringOption(option =>
                option.setName(param.name)
                    .setDescription(param.description)
                    .setRequired(param.required)
            );
        });

        return builder;
    }

    // Method to parse the parameters from the interaction
    public parseParameters(interaction: ChatInputCommandInteraction) {
        const parsedParams: { [key: string]: any } = {};
        this.parameters.forEach(param => {
            const value = interaction.options.get(param.name);
            if (value) {
                parsedParams[param.name] = value.value;
            }
        });
        return parsedParams;
    }
}
