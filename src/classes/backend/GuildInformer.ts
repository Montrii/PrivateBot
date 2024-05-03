import {Manager} from "./Manager";


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


    public getAllGuilds() {
        return this.client.guilds.cache;
    }

    public getGuildsWithChannelName(channelName: string) {
        return this.client.guilds.cache.filter((guild) => {
            return guild.channels.cache.find((channel) => channel.name === channelName)
        }).map((guild) => {
            guild["channelToSendTo"] = guild.channels.cache.find((channel) => channel.name === channelName)
            return guild
        })
    }

    public getGuildsWithChannelId(channelId: string) {
        return this.client.guilds.cache.filter((guild) => {
            return guild.channels.cache.find((channel) => channel.id === channelId)
        }).map((guild) => {
            guild["channelToSendTo"] = guild.channels.cache.find((channel) => channel.id === channelId)
            return guild
        })
    }
}