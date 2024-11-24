import {Localisation} from "../../localisation/Localisation";

import {SteamGame} from "../steam/SteamGame";
import {GuildInformer} from "../../backend/GuildInformer";
import {SteamSettings} from "../steam/SteamSettings";

const { ButtonStyle } = require('discord.js');
import {ButtonBuilder, EmbedBuilder, ActionRowBuilder, Message} from "discord.js";
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
        await guild.channelToSendTo.send(components)
    }


    private async addEbayOfferToChannel(guild: any, ebaySettings: any, offer: EbayOffer, localisation: Localisation) {
        const components = await this.buildEbayOfferEmbed(guild, ebaySettings, offer, localisation)
        await guild.channelToSendTo.send(components)
    }

    private async buildEbayBidExpiringEmbed(guild: any, ebaySettings: any, offer: EbayOffer, localisation: Localisation) {
        if(offer.isBeddingOffer == false)
            return;


        const components = await this.buildEbayOfferEmbed(guild, ebaySettings, offer, localisation)

        components.content = "@everyone " + localisation.get("ebaySoonBidExpiring");
        await guild.channelToSendTo.send(components)
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
        // @ts-ignore
        if(typeof(offer.offerCreated) == "string") {
            gameEmbed.addFields(({ name: localisation.get("ebayOfferCreated"), value: this.formatDateIntoGermanDate(offer.offerCreated as string), inline: false } as any))
        }
        else {
            gameEmbed.addFields(({ name: localisation.get("ebayOfferCreated"), value: this.formatDateIntoGermanDate(offer.offerCreated?.toISOString() as string), inline: false } as any))
        }


        gameEmbed.addFields(({ name: localisation.get("ebayPrice"), value: offer.price ?? 0 + "", inline: false } as any))

        gameEmbed.addFields(({ name: localisation.get("ebaySeller"), value: offer.seller, inline: true } as any))
        gameEmbed.addFields(({ name: localisation.get("ebaySellerSold"), value: offer.sellerSold + "", inline: true } as any))
        gameEmbed.addFields(({ name: localisation.get("ebaySellerRating"), value: offer.sellerRating + "%", inline: true } as any))

        gameEmbed.addFields(({ name: localisation.get("ebayViewerAmount"), value: offer.viewerAmount + "", inline: false } as any))

        if(offer.isBeddingOffer) {
            gameEmbed.setDescription(localisation.get("ebaydescriptionWithBid") as string)

            gameEmbed.addFields(({name: localisation.get("ebayBidExpiring"), value: this.formatDateIntoGermanDate(offer.bidExpiring as any), inline: true} as any))
            gameEmbed.addFields(({name: localisation.get("ebayBiddingOffersAmount"), value: offer.biddingOffersAmount + "", inline: true} as any))

            gameEmbed.setColor(ebaySettings.bidColor)
        }
        else {
            gameEmbed.setDescription(localisation.get("ebaydescriptionWithoutBid") as string)
            gameEmbed.setColor(ebaySettings.color)
        }

        // Extract the base URL from the offer.link and split it by "_", then use the first part (up to the eBay item ID)
        const baseLink = offer.link?.split('_')[0] ?? offer.link; // Safe fallback to offer.link if no "_" found

        // Create the button for the embed
        const addButton = new ButtonBuilder()
            .setLabel(localisation.get("ebayadd"))  // Set the button label
            .setStyle(ButtonStyle.Link)
            .setURL(baseLink);  // Set the URL to the base link

        // Add the button to the action row
        actionRow.addComponents(addButton);

        // Return the embed and the optional message with the full title if necessary
        const result: any = { embeds: [gameEmbed], components: [actionRow] };
        if (titleMessage) {
            result.content = titleMessage;  // Attach the full title as normal text if truncated
        }

        return result;
    }


    public async addBidExpiringOffers(offers: EbayOffer[]) {
        const guildInformer = GuildInformer.getInstance();
        const ebaySettings = EbaySettings.getEbayDiscordEmbedSettings() as EbaySettings;
        const localisation = new Localisation();

        const guilds = await guildInformer.getGuildsWithChannelName((ebaySettings as any).bidExpiringChannelToSend);

        // Sort offers in descending order based on the offerCreated ISO string
        offers.sort((a, b) => new Date(b.bidExpiring as any).getTime() - new Date(a.bidExpiring as any).getTime());

        for (const guild of guilds) {
            try {
                localisation.setLanguage(guild.preferredLocale);


                // Delete all messages in the channel
                const messages = await guild.channelToSendTo.messages.fetch({ limit: 100 });
                await Promise.all(messages.map((msg: Message) => msg.delete()));

                // Loop through offers and send messages
                for (const offer of offers) {
                    await this.buildEbayBidExpiringEmbed(guild, ebaySettings, offer, localisation);
                }

                console.log(`[DISCORD]: Finished updating Ebay expiring bids for Guild: ${guild.name}`);
            } catch (error) {
                console.error(
                    `[DISCORD]: Error while updating Ebay expiring bids for guild: ${guild.name}\nError: ${error}`
                );
            }
        }
    }

    public async updateEbaySearchResults(offers: EbayOffer[]) {
        const guildInformer = GuildInformer.getInstance();
        const ebaySettings = EbaySettings.getEbayDiscordEmbedSettings() as EbaySettings;
        const localisation = new Localisation();

        const guilds = await guildInformer.getGuildsWithChannelName((ebaySettings as any).channelToSend);

        // Remove duplicate offers (based on title)
        const uniqueOffers = Array.from(new Map(offers.map((offer) => [offer.title, offer])).values());

        // Sort offers in descending order based on the offerCreated ISO string
        // @ts-ignore
        uniqueOffers.sort((a, b) => new Date(a.offerCreated).getTime() - new Date(b.offerCreated).getTime());

        for (const guild of guilds) {
            try {
                localisation.setLanguage(guild.preferredLocale);

                const messages = await guild.channelToSendTo.messages.fetch({ limit: 100 });
                const messagesArray = Array.from(messages.values());

                // Track which titles are already processed
                const processedTitles = new Set<string>();

                // Loop through each unique offer
                for (const offer of uniqueOffers) {
                    const offerTitle = localisation.get("ebaytitle") + offer.title!.trim();
                    const titleMessage = localisation.get("ebayTooLongTitle") + offer.title!.trim();

                    // Find existing messages for this offer
                    const existingMessages = messagesArray.filter((message: any) => {
                        const messageContent = message.content.trim();
                        const embedTitles = message.embeds.map((embed: any) => embed.title?.trim());

                        // Check if the offer is present in the message (using title or embed)
                        return embedTitles.some((embedTitle: any) => embedTitle && embedTitle.toLowerCase().includes(offerTitle.toLowerCase())) ||
                            messageContent.toLowerCase().includes(titleMessage.toLowerCase());
                    });

                    // Keep only one message for the offer, remove duplicates
                    if (existingMessages.length > 1) {
                        for (let i = 1; i < existingMessages.length; i++) {
                            // @ts-ignore
                            await existingMessages[i].delete();
                            console.log(`[DISCORD]: Deleted duplicate message for Ebay offer: ${offer.title}`);
                        }
                    }

                    const existingMessage = existingMessages[0];

                    // If the message already exists, update it
                    if (existingMessage) {
                        if (!processedTitles.has(offer.title)) {
                            await this.updateEbayOfferToChannel(existingMessage, guild, ebaySettings, offer, localisation);
                            console.log("[DISCORD]: Updated Ebay offer: " + offer.title);
                            processedTitles.add(offer.title);
                        }
                    } else {
                        // If no message exists for this offer, create a new one
                        if (!processedTitles.has(offer.title)) {
                            await this.addEbayOfferToChannel(guild, ebaySettings, offer, localisation);
                            console.log("[DISCORD]: Added new Ebay offer: " + offer.title);
                            processedTitles.add(offer.title);
                        }
                    }
                }

                // Delete any messages not associated with a current offer
                for (const message of messagesArray) {
                    const offerTitle = localisation.get("ebaytitle");
                    // @ts-ignore
                    const isOfferMessage = message.embeds.some((embed: any) => embed.title && embed.title.startsWith(offerTitle));

                    // @ts-ignore
                    if (isOfferMessage && !uniqueOffers.some((offer) => message.embeds[0]?.title?.trim() === (offerTitle + offer.title).trim())) {
                        // @ts-ignore
                        await message.delete();
                        // @ts-ignore
                        console.log(`[DISCORD]: Deleted obsolete Ebay offer message: ${message.embeds[0]?.title}`);
                    }
                }

                console.log("[DISCORD]: Finished updating Ebay offers for Guild: " + guild.name);
            } catch (error) {
                // @ts-ignore
                console.error("[DISCORD]: Error while updating Ebay offers for guild: " + guild.name + "\nError: " + error.message + " \n" + error.stack);
            }
        }
    }



    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }




}