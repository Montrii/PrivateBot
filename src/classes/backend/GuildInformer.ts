import {Manager} from "./Manager";
import {Collection, Guild, GuildBasedChannel, Snowflake} from "discord.js";
import {Command} from "./commands/Command";
import * as _ from 'lodash';


// Defines the Manager for managing guilds.
export class GuildInformer {
    private static instance: GuildInformer;

    // The client for the DiscordUpdater
    private client: any;

    // Private constructor to prevent external instantiation
    private constructor() {
    }

    // Static method to get the single instance of the class
    public static getInstance(): GuildInformer {
        if (!GuildInformer.instance) {
            GuildInformer.instance = new GuildInformer();
        }
        return GuildInformer.instance;
    }

    // Sets the client for the DiscordUpdater
    public setClient(client: any) {
        this.client = client;
    }
    public getAllGuilds(): Collection<Snowflake, Guild> {
        return this.client.guilds.cache;
    }

    public getGuildsWithTheirCommands(commands: Command[]) {
        return this.getAllGuilds().map((guild: any) => {
            // We need to make sure we clone the commands so we have a fresh copy for each guild.
            guild["botCommands"] = commands.map(command => _.cloneDeep(command)).filter((command: Command) => command.isForAllGuilds() || command.specifcGuildId() === guild.id)
            return guild
        });
    }

    public getGuildsWithChannelName(channelName: string) {
        return this.getAllGuilds().filter((guild: Guild) => {
            return guild.channels.cache.find((channel: GuildBasedChannel) => channel.name === channelName)
        }).map((guild: any) => {
            guild["channelToSendTo"] = guild.channels.cache.find((channel: GuildBasedChannel) => channel.name === channelName)
            return guild
        })
    }

    public getGuildsWithChannelId(channelId: string): Guild[] {
        return this.getAllGuilds().filter((guild: Guild) => {
            return guild.channels.cache.find((channel: GuildBasedChannel) => channel.id === channelId)
        }).map((guild: any) => {
            guild["channelToSendTo"] = guild.channels.cache.find((channel: GuildBasedChannel) => channel.id === channelId)
            return guild
        })
    }
}