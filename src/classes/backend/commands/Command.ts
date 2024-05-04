// Class definition for a Command (Discord)

import {ChatInputCommandInteraction} from "discord.js";

export class Command {

    // Name of the command
    private name: string;

    // Description of the command
    private description: string;

    // Should command be for all guilds?
    private allGuilds: boolean = true;

    // if allGuilds is false, then this is the guild id
    private onlyForThisGuild: string = "";

    // Callback function when command is called

    private interactionCallback: any = ((interaction: ChatInputCommandInteraction) => {console.log("Command: " + this.name + " called" + interaction)})


    // @ts-ignore
    constructor(name: string, description: string)
    constructor(name: string, description: string, allGuilds: boolean, onlyForThisGuild: string) {
        this.name = name;
        this.description = description;
        this.allGuilds = allGuilds;
        this.onlyForThisGuild = onlyForThisGuild;
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