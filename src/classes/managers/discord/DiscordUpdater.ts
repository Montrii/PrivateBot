import {Localisation} from "../../localisation/Localisation";

import {SteamGame} from "../steam/SteamGame";
import {GuildInformer} from "../../backend/GuildInformer";
import {SteamSettings} from "../steam/SteamSettings";

const { ButtonStyle } = require('discord.js');
import {ButtonBuilder, EmbedBuilder, ActionRowBuilder} from "discord.js";

// Handles updating any discord bot messages send by the bot.

export class DiscordUpdater {
    private static instance: DiscordUpdater;

    // The client for the DiscordUpdater
    private client: any;

    // The user (bot) for the DiscordUpdater
    private user: any;


    // Private constructor to prevent external instantiation
    private constructor() { }

    // Static method to get the single instance of the class
    public static getInstance(): DiscordUpdater {
        if (!DiscordUpdater.instance) {
            DiscordUpdater.instance = new DiscordUpdater();
        }
        return DiscordUpdater.instance;
    }

    // Sets the client for the DiscordUpdater
    public setClient(client: any) {
        this.client = client;
        return this;
    }

    // Sets the user (bot) for the DiscordUpdater
    public setUser(user: any) {
        this.user = user;
        return this;
    }

    public async updateSteamGames(games: SteamGame[]) {
        const guildInformer = GuildInformer.getInstance();
        const steamSettings = SteamSettings.getSteamDiscordEmbedSettings();
        const localisation = new Localisation();

        // Loop through each guild that the bot is part of that has the channel name that the bot is supposed to send to.
        // @ts-ignore
        guildInformer.getGuildsWithChannelName(steamSettings.channelToSend).forEach((guild: any) => {
            // Adjust the language of the bot to the preferred language of the guild.
            localisation.setLanguage(guild.preferredLocale)

            // Now we can scan of any messages we have sent and verify if we need to update them.
            guild.channelToSendTo.messages.fetch({limit: 100})

                // Step: Find messages and filter out messages that are not from the bot.
                .then((messages: any) => {

                    // We filter out any messages that are not from the bot.
                    // Checks if any messages from bot with embeds are found that contain the appId of the games.
                    // We're only checking any messages are found.
                    const messagesFromThisModule = messages.filter((message: any) => {
                        return message.author.id == this.user.id && message.embeds !== undefined || message.embeds !== null || messages.embeds.some((embed: any) => {
                            return embed.fields?.some((field: any) => {
                                return games.some((game) => game.appId === field.value)
                            })
                        })
                    });

                    // We check if there are any messages from this module.
                    // We return a promise to ensure that we can continue with the next step.
                    return new Promise((resolve, reject) => {
                        if(messagesFromThisModule.size > 0) {
                            resolve(messagesFromThisModule)
                        }
                        else {
                            resolve(null)
                        }
                    })

                })
                // Next step: determines if we need to update messages or not.
                .then((messages: any) => {
                    if(messages) {
                        games.forEach((game) => {
                            // We need to check here if the message containing this specific game is found.
                            const gameMessage = messages.find((message: any) => {
                                return message.embeds.some((embed: any) => {
                                    return embed.fields.some((field: any) => {
                                        return field.value === game.appId
                                    })
                                })
                            })
                            // If we did not find the current game, we need to add it.
                            if (!gameMessage) {
                                this.addSteamGameToChannel(guild, steamSettings, game, localisation)
                                console.log("[DISCORD]: Adding message for game: " + game.title + "\n appId: " + game.appId + "| guild: " + guild.name)
                            }
                        })
                    }
                    else {
                        games.forEach((game) => {
                            this.addSteamGameToChannel(guild, steamSettings, game, localisation)
                            console.log("[DISCORD]: Adding message for game: " + game.title + "\n appId: " + game.appId + "| guild: " + guild.name)
                        })
                    }
                })
                // Finally: Finish up the process.
                .finally(() => {
                    console.log("[DISCORD]: Finished updating Steam messages "  + "for Guild: " + guild.name);
                })
                // Error Handling
                .catch((error: Error) => {
                    console.error("[DISCORD]: Error while updating Steam messages for guild: " + guild.name + "\nDown below: " + error.message + " \n" + error.stack)
                })
        })
    }

    private async buildSteamGameEmbed(guild: any, steamSettings: any, game: SteamGame, localisation: Localisation) {
        let gameButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(game.link!)
            .setLabel(localisation.get("steamadd") as string)

        let gameMainButton;

        const actionRow = new ActionRowBuilder()

        const gameEmbed = new EmbedBuilder()
            .setColor(steamSettings.color)
            .setThumbnail(game.image!)
            .setTitle(localisation.get("steamtitle") + game.title!)
            .setURL(game.link!)
            .setDescription(localisation.get("steamdescription") as string)

        gameEmbed.addFields(({ name: localisation.get("steamappId"), value: game.appId, inline: true } as any))
        gameEmbed.addFields(({ name: localisation.get("steamreleaseDate"), value: game.releaseDate?.toLocaleString(guild.preferredLocale), inline: false } as any))
        gameEmbed.addFields( ({ name: localisation.get("steamuntilDate"), value: game.untilDate?.toLocaleString(guild.preferredLocale), inline: false} as any))

        if(game.isDLC) {
            gameEmbed
                .setTitle(localisation.get("steamdlcTitle") + game.title!)
                .setColor(steamSettings.dlcColor as any)
                .setDescription(localisation.get("steamdlcDescription") as string)

            gameButton.setLabel(localisation.get("steamaddDLC") as string)
            gameMainButton = new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(game.mainGame!.link as string).setLabel(localisation.get("steamaddGame") as string)
            gameEmbed.addFields( ({ name: localisation.get("steamdlcFor"), value: game.mainGame!.title, inline: false} as any))
        }
        return {embeds: [gameEmbed], components: [actionRow.addComponents((gameButton as any), gameMainButton)]}
    }

    private async updateSteamGameInChannel(message: any, guild: any, steamSettings: any, game: SteamGame, localisation: Localisation) {
        const components = await this.buildSteamGameEmbed(guild, steamSettings, game, localisation)
        await message.edit(components)
    }
    private async addSteamGameToChannel(guild: any, steamSettings: any, game: SteamGame, localisation: Localisation) {
        const components = await this.buildSteamGameEmbed(guild, steamSettings, game, localisation)
        guild.channelToSendTo.send(components)
    }
}