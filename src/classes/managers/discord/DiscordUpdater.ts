import {Localisation} from "../../localisation/Localisation";

import {SteamGame} from "../steam/SteamGame";
import {GuildInformer} from "../../backend/GuildInformer";
import {SteamSettings} from "../steam/SteamSettings";

const { ButtonStyle } = require('discord.js');
import {ButtonBuilder, EmbedBuilder, ActionRowBuilder} from "discord.js";
import {EbayOffer} from "../ebay/EbayOffer";
import {EbaySettings} from "../ebay/EbaySettings";

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


    private async addEbayOfferToChannel(guild: any, ebaySettings: any, offer: EbayOffer, localisation: Localisation) {
        const components = await this.buildEbayOfferEmbed(guild, ebaySettings, offer, localisation)
        guild.channelToSendTo.send(components)
    }

    private async updateEbayOfferToChannel(message: any, guild: any, ebaySettings: any, offer: EbayOffer, localisation: Localisation) {
        const components = await this.buildEbayOfferEmbed(guild, ebaySettings, offer, localisation)
        await message.edit(components)
    }

    private formatDateIntoGermanDate(dateString: string) {
        let offerCreatedDate = new Date(dateString); // Create a new Date object from the string
        const day = String(offerCreatedDate.getDate()).padStart(2, '0'); // Get day and pad with leading zero if needed
        const month = String(offerCreatedDate.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed, so add 1)
        const year = offerCreatedDate.getFullYear(); // Get the full year
        const hours = String(offerCreatedDate.getHours()).padStart(2, '0'); // Get hours and pad with leading zero
        const minutes = String(offerCreatedDate.getMinutes()).padStart(2, '0'); // Get minutes and pad with leading zero
        const seconds = String(offerCreatedDate.getSeconds()).padStart(2, '0'); // Get seconds and pad with leading zero

        const formattedDate = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

        return formattedDate
    }



    private async buildEbayOfferEmbed(guild: any, ebaySettings: any, offer: EbayOffer, localisation: Localisation) {
        const actionRow = new ActionRowBuilder()

        // Construct the title with prefix
        let title = localisation.get("ebaytitle") + offer.title!;

        // Initialize the content for full title message
        let titleMessage = "";

        // Check if the title exceeds 256 characters
        if (title.length > 64) {
            titleMessage = localisation.get("ebayTooLongTitle") + offer.title!;  // Store the full title in titleMessage
        }

        // Create the embed
        const gameEmbed = new EmbedBuilder()
            .setThumbnail(offer.image!)
            .setTitle(title)  // Set the truncated title or normal title
            .setURL(offer.link!)

        // Add the fields to the embed
        gameEmbed.addFields(({ name: localisation.get("ebayOfferCreated"), value: this.formatDateIntoGermanDate(offer.offerCreated?.toISOString()), inline: false } as any))

        gameEmbed.addFields(({ name: localisation.get("ebayPrice"), value: offer.price ?? 0 + "", inline: false } as any))

        gameEmbed.addFields(({ name: localisation.get("ebaySeller"), value: offer.seller, inline: true } as any))
        gameEmbed.addFields(({ name: localisation.get("ebaySellerSold"), value: offer.sellerSold + "", inline: true } as any))
        gameEmbed.addFields(({ name: localisation.get("ebaySellerRating"), value: offer.sellerRating + "%", inline: true } as any))

        gameEmbed.addFields(({ name: localisation.get("ebayViewerAmount"), value: offer.viewerAmount + "", inline: false } as any))

        if(offer.isBeddingOffer) {
            gameEmbed.setDescription(localisation.get("ebaydescriptionWithBid") as string)

            gameEmbed.addFields(({name: localisation.get("ebayBidExpiring"), value: this.formatDateIntoGermanDate(offer.bidExpiring), inline: true} as any))
            gameEmbed.addFields(({name: localisation.get("ebayBiddingOffersAmount"), value: offer.biddingOffersAmount + "", inline: true} as any))

            gameEmbed.setColor(ebaySettings.bidColor)
        }
        else {
            gameEmbed.setDescription(localisation.get("ebaydescriptionWithoutBid") as string)
            gameEmbed.setColor(ebaySettings.color)
        }

        // Return the embed and the optional message with the full title if necessary
        const result: any = { embeds: [gameEmbed] };
        if (titleMessage) {
            result.content = titleMessage;  // Attach the full title as normal text if truncated
        }

        return result;
    }

    public async updateEbaySearchResults(offers: EbayOffer[]) {
        const guildInformer = GuildInformer.getInstance();
        const ebaySettings = EbaySettings.getEbayDiscordEmbedSettings() as EbaySettings;
        const localisation = new Localisation();

        // Loop through each guild that the bot is part of that has the channel name that the bot is supposed to send to.
        const guilds = await guildInformer.getGuildsWithChannelName(ebaySettings.channelToSend);


        // Sort the offers array by the offerCreated ISO string in descending order
        offers.sort((a, b) => {
            // Convert offerCreated strings to Date objects and compare
            const dateA = new Date(a.offerCreated);
            const dateB = new Date(b.offerCreated);

            // Return the comparison in descending order (most recent first)
            return dateA.getTime() - dateB.getTime();
        });
        // Use for...of to await each iteration sequentially
        for (const guild of guilds) {
            try {
                // Adjust the language of the bot to the preferred language of the guild.
                localisation.setLanguage(guild.preferredLocale);

                // Fetch all messages from the channel (with a limit, you can adjust this as needed)
                const messages = await guild.channelToSendTo.messages.fetch({ limit: 100 });

                // Convert messages to an array for easier processing (filtering, etc.)
                const messagesArray = Array.from(messages.values());

                // Step 1: Check if any message contains "Angebot: <title>"
                // We will iterate through each offer to see if it has a matching message or if we need to delete/update any existing message.
                for (const offer of offers) {
                    const offerTitle = localisation.get("ebaytitle") + offer.title!.trim(); // Trim the title for cleaner comparison

                    // Check if the combined title exceeds 256 characters
                    let titleMessage = localisation.get("ebayTooLongTitle") + offer.title!.trim();
                    let embedTitle = offerTitle;

                    // Step 2: Find an existing message that contains the title of this offer
                    const existingMessage = messagesArray.find((message: any) => {
                        // Normalize the message content and embed titles for comparison
                        const messageContent = message.content.trim();
                        const embedTitles = message.embeds.map((embed: any) => embed.title?.trim());

                        // Check if the combined title exists in the content or embed title (case-insensitive)
                        return embedTitles.some((embedTitle) => embedTitle && embedTitle.toLowerCase().includes(embedTitle.toLowerCase())) ||
                            messageContent.toLowerCase().includes(titleMessage.toLowerCase());
                    });

                    // Step 3: Check if we found the message
                    if (existingMessage) {
                        // If the offer exists in the current offers array, we update the message
                        const offerExists = offers.some((game) => game.title === offer.title);
                        if (offerExists) {
                            await this.updateEbayOfferToChannel(existingMessage, guild, ebaySettings, offer, localisation);
                            console.log("[DISCORD]: Updated Ebay offer: " + offer.title);
                        } else {
                            // If the offer doesn't exist anymore, delete the message
                            await existingMessage.delete();
                            console.log("[DISCORD]: Deleted obsolete Ebay offer: " + offer.title);
                        }
                    } else {
                        // Step 4: If no message for this offer exists, we add a new one
                        const offerExists = offers.some((game) => game.title === offer.title);
                        if (offerExists) {
                            await this.addEbayOfferToChannel(guild, ebaySettings, offer, localisation);
                            console.log("[DISCORD]: Added new Ebay offer: " + offer.title);
                        }
                    }
                }

                // Step 5: Ensure that any message not associated with a current offer is deleted.
                // Delete any messages that are not found in the `offers` array.
                for (const message of messagesArray) {
                    const offerTitle = localisation.get("ebaytitle");
                    const isOfferMessage = message.embeds.some((embed: any) => embed.title && embed.title.startsWith(offerTitle));

                    // If the message is an offer message but the offer no longer exists, delete the message
                    if (isOfferMessage && !offers.some((game) => game.title === message.embeds[0].title?.replace(offerTitle, '').trim())) {
                        await message.delete();
                        console.log("[DISCORD]: Deleted obsolete Ebay offer: " + message.embeds[0].title);
                    }
                }

                console.log("[DISCORD]: Finished updating Ebay offers for Guild: " + guild.name);
            } catch (error) {
                console.error("[DISCORD]: Error while updating Ebay offers for guild: " + guild.name + "\nDown below: " + error.message + " \n" + error.stack);
            }
        }

    }




}