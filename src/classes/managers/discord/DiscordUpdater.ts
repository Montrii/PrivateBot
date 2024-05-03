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

        // Loop through each guild that the bot is part of that has the channel name that the bot is supposed to send to.
        guildInformer.getGuildsWithChannelName(steamSettings.channelToSend).forEach((guild) => {
            const channelToSendTo = guild.channelToSendTo;

            // Adjust the language of the bot to the preferred language of the guild.
            Localisation.setLanguage(guild.preferredLocale)

            // Now we can scan of any messages we have sent and verify if we need to update them.
            channelToSendTo.messages.fetch({limit: 100})

                // Step: Find messages and filter out messages that are not from the bot.
                .then((messages) => {

                    // We filter out any messages that are not from the bot.
                    // Checks if any messages from bot with embeds are found that contain the appId of the games.
                    const messagesFromThisModule = messages.filter((message) => {
                        return message.author.id === this.user.id && message.embeds !== undefined || message.embeds !== null || message.embeds.some((embed) => {
                            return games?.some((game) => {
                                return embed.fields?.some((field) => {
                                    return field.value === game.appId;
                                });
                            });
                        });
                    });

                    // We check if there are any messages from this module.
                    // We return a promise to ensure that we can continue with the next step.
                    return new Promise((resolve, reject) => {
                        resolve(messagesFromThisModule.length <= 0, messagesFromThisModule)
                    })

                })
                // Next step: determines if we need to update messages or not.
                .then((messagesFound, messages) => {
                    if(messagesFound) {
                        console.log("messages were found, updating them!")
                    }
                    else {
                        console.log("no messages were found!")
                        games.forEach((game) => {

                            let gameButton = new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setURL(game.link)
                                .setLabel(Localisation.steam.add)

                            let gameMainButton;

                            const actionRow = new ActionRowBuilder()

                            const gameEmbed = new EmbedBuilder()
                                .setColor(steamSettings.color)
                                .setThumbnail(game.image)
                                .setTitle(Localisation.steam.title + game.title)
                                .setURL(game.link)
                                .setDescription(Localisation.steam.description)

                            gameEmbed.addFields({ name: Localisation.steam.appId, value: game.appId, inline: true })
                            gameEmbed.addFields({ name: Localisation.steam.releaseDate, value: game.releaseDate?.toLocaleString(guild.preferredLocale), inline: false })
                            gameEmbed.addFields( { name: Localisation.steam.untilDate, value: game.untilDate?.toLocaleString(guild.preferredLocale), inline: false})

                            if(game.isDLC) {
                                gameEmbed
                                    .setTitle(Localisation.steam.dlcTitle + game.title)
                                    .setColor(steamSettings.dlcColor)
                                    .setDescription(Localisation.steam.dlcDescription)

                                gameButton.setLabel(Localisation.steam.addDLC)
                                gameMainButton = new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(game.mainGame.link).setLabel(Localisation.steam.addGame)
                                gameEmbed.addFields( { name: Localisation.steam.dlcFor, value: game.mainGame.title, inline: false})
                            }

                            channelToSendTo.send({embeds: [gameEmbed], components: [actionRow.addComponents(gameButton, gameMainButton)]})

                        })
                    }
                })
                // Finally: Finish up the process.
                .finally(() => {
                    console.log("[DISCORD]: Finished updating Steam messages!");
                })
                // Error Handling
                .catch((error) => {
                    console.error("[DISCORD]: Error while updating Steam messages! Down below: " + error.message + " \n" + error.stack)
                })
        })
    }
}