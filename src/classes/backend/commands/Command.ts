// Class definition for a Command (Discord)
import { Localisation } from "../../localisation/Localisation";
import {ChatInputCommandInteraction, Guild} from "discord.js";

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

    // Callback function when command is called

    private interactionCallback: any = ((interaction: ChatInputCommandInteraction) => {console.log("Command: " + this.name + " called" + interaction)})

    // Commands own localisation
    private localisation: Localisation;


    constructor(name: string, descriptionKey: string)
    {
        this.name = this.formatName(name);
        this.descriptionKey = descriptionKey;
        this.localisation = new Localisation();
    }

    // Adjustes the command for a specific guild
    public adjustCommandForGuild(guild: Guild) {
        this.description = this.localisation.setLanguage(guild.preferredLocale as string).get(this.descriptionKey);
        console.log("[COMMAND] '" + this.name + "' has adjusted for guild: '" + guild.name + "' into language '" + guild.preferredLocale + "'.");
        return this
    }

    // Format that helps adjust the name of the command.
    private formatName(name: string) {
        let formattedName = name.toLowerCase();
        for (let i = 1; i < name.length; i++) {
            if (name[i] !== name[i].toLowerCase() && name[i - 1] === name[i - 1].toLowerCase()) {
                formattedName = formattedName.slice(0, i) + "-" + formattedName.slice(i);
            }
        }
        return formattedName;
    }

    public setForSpecficGuild(guildId: string) {
        this.allGuilds = false;
        this.onlyForThisGuild = guildId;
        return this;
    }

    public setInteractionCallback(callback: any) {
        this.interactionCallback = callback;
        return this;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }

    public isForAllGuilds(): boolean {
        return this.allGuilds;
    }

    public specifcGuildId(): string {
        return this.onlyForThisGuild;
    }

    public getInteractionCallback(): any {
        return this.interactionCallback;
    }

    public callInteractionCallback(interaction: ChatInputCommandInteraction) {
        this.interactionCallback(interaction);
    }
}