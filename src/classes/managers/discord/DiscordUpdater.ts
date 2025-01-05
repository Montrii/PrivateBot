import {Localisation} from "../../localisation/Localisation";

import {SteamGame} from "../steam/SteamGame";
import {GuildInformer} from "../../backend/GuildInformer";
import {SteamSettings} from "../steam/SteamSettings";

const { ButtonStyle } = require('discord.js');
import {ButtonBuilder, EmbedBuilder, ActionRowBuilder, Message, GuildBasedChannel} from "discord.js";
import {EbayOffer} from "../ebay/EbayOffer";
import {EbaySettings} from "../ebay/EbaySettings";
import {ErrorManager} from "../../backend/ErrorManager";
import {GenshinCode} from "../genshin/GenshinCode";
import {GenshinSettings} from "../genshin/GenshinSettings";
import {EpicGame} from "../epicgames/EpicGame";
import {EpicSettings} from "../epicgames/EpicSettings";
import {EpicGameOfferType} from "../epicgames/EpicGameOfferType";

// Handles updating any discord bot messages send by the bot.

export class DiscordUpdater {
    private static instance: DiscordUpdater;

    // The client for the DiscordUpdater
    private client: any;

    // The user (bot) for the DiscordUpdater
    private user: any;


    public static isAlreadyRunningDiscordJob: boolean = false;


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





    public async buildGenshinCodeEmbed(guild: any, genshinSettings: any, code: GenshinCode, localisation: Localisation) {
        const actionRow = new ActionRowBuilder()

        // Create the embed
        const gameEmbed = new EmbedBuilder()
            .setTitle(localisation.get("genshinTitle") + code.getCode()!)  // Set the truncated title or normal title
            .setURL(code.getLink()!)


        if(typeof(code.getValid()) !== "string") {
            // @ts-ignore
            code.setValid("(unknown)");
        }

        if(code.getIsSpecialCode()) {
            gameEmbed.setDescription(localisation.get("genshinSpecialCode") as string)

            // Create the button for the embed
            const addButton = new ButtonBuilder()
                .setLabel(localisation.get("genshinSpecialDescription"))  // Set the button label
                .setStyle(ButtonStyle.Link)
                .setURL(code.getLink());  // Set the URL to the base link

            // Add the button to the action row
            actionRow.addComponents(addButton);

        }
        else {
            gameEmbed.setDescription(localisation.get("genshinDescription") as string)
            gameEmbed.addFields(({name: localisation.get("genshinDiscovered"), value: code.getDiscovered(), inline: true} as any))
            gameEmbed.addFields(({name: localisation.get("genshinForWhichRegion"), value: code.getServer(), inline: true} as any))
            gameEmbed.addFields(({name: localisation.get("genshinValidUntil"), value: code.getValid()!, inline: false} as any))


            code.getItems().forEach((item) =>
            {
                let emojiName = item.replace("×", "").replace(/[0-9]/g, '').replace("'", "").replace(/\s+/g, '').toLowerCase();
                // @ts-ignore
                let emoji = this.client.emojis.cache.find(emoji => emoji.name.toLowerCase() === emojiName);

                if (emoji) {
                    let emojiString = emoji.toString();
                    gameEmbed.addFields({
                        name: "Item",
                        value: `${emojiString} ${item}`,
                        inline: true
                    });
                } else {
                    gameEmbed.addFields({
                        name: "Item",
                        value: `${item}`,
                        inline: true
                    });
                }

            })


            // Create the button for the embed
            const addButton = new ButtonBuilder()
                .setLabel(localisation.get("genshinOpen"))  // Set the button label
                .setStyle(ButtonStyle.Link)
                .setURL(code.getLink());  // Set the URL to the base link

            // Add the button to the action row
            actionRow.addComponents(addButton);

        }

        return { content: "@everyone", embeds: [gameEmbed], components: [actionRow] };
    }

    public async addGenshinCodeToChannel(guild: any, genshinSettings: GenshinSettings, code: GenshinCode, localisation: Localisation) {
        try {
            const components = await this.buildGenshinCodeEmbed(guild, genshinSettings, code, localisation)
            // @ts-ignore
            await guild.channels.cache.find((channel: GuildBasedChannel) => channel.name === genshinSettings.channelToSend).send(components)
        }
        catch(error) {
            ErrorManager.showError("Error while attempting to add Genshin code (" + code.getCode() + ") to channel", error)
        }
    }


    public async buildEpicGamesEmbed(guild: any, epicSettings: any, offer: EpicGame, localisation: Localisation) {
        const actionRow = new ActionRowBuilder()

        // Create the embed
        const gameEmbed = new EmbedBuilder()
            .setTitle(localisation.get("epicGamesTitle") + offer.title!)  // Set the truncated title or normal title
            .setThumbnail(offer.image!)
            .setURL(offer.link!)




        // check if offer is ADDON, BASEGAME OR BUNDLE
        if(offer.offerType === EpicGameOfferType.ADDON) {
            gameEmbed.setDescription(localisation.get("epicGamesDescriptionDLC") as string)
            gameEmbed.setColor("#FFA500")
        }
        else if(offer.offerType === EpicGameOfferType.BUNDLE) {
            gameEmbed.setDescription(localisation.get("epicGamesDescriptionBundle") as string)
            gameEmbed.setColor("#009A00")
        }
        else {
            gameEmbed.setDescription(localisation.get("epicGamesDescription") as string)
            gameEmbed.setColor("#0070FF")
        }

        gameEmbed.addFields(({ name: localisation.get("epicGamesType"), value: offer.offerType!, inline: true } as any))
        gameEmbed.addFields(({name: "App-ID", value: offer.appId, inline: false} as any))

        gameEmbed.addFields(({ name: localisation.get("epicGamesGameDescription"), value: offer.description!, inline: false } as any))

        gameEmbed.addFields(({ name: localisation.get("epicGamesDeveloper"), value: offer.developer!, inline: true } as any))
        gameEmbed.addFields(({ name: localisation.get("epicGamesReleaseDate"), value: offer.releaseDate?.toLocaleString(guild.preferredLocale), inline: false } as any))



        // Create the button for the embed
        const addButton = new ButtonBuilder()
            .setLabel(localisation.get("epicGamesOpen"))  // Set the button label
            .setStyle(ButtonStyle.Link)
            .setURL(offer.link!)




        // Check if offer is in the future.
        // @ts-ignore
        if ((offer.releaseDate! > new Date()) || (new Date(offer.promos.startDate!) > new Date())) {
            addButton.setDisabled(true)
            addButton.setLabel(localisation.get("epicGamesNotAvailableYet") as string)
        }

        // @ts-ignore
        gameEmbed.addFields(({ name: localisation.get("epicGamesOfferStartDate"), value: new Date(offer.promos.startDate).toLocaleString(guild.preferredLocale), inline: true } as any))

        // @ts-ignore
        gameEmbed.addFields(({ name: localisation.get("epicGamesOfferEndDate"), value: new Date(offer.promos.endDate).toLocaleString(guild.preferredLocale), inline: true } as any))


        gameEmbed.addFields(({name:  localisation.get("epicGamesOriginalPrice"), value: offer.originalPrice, inline: false} as any))

        gameEmbed.addFields(({name:  localisation.get("epicGamesDiscountPrice"), value: "**" + offer.discountPrice + "**", inline: true} as any))

        // Add the button to the action row
        actionRow.addComponents(addButton);
        return { embeds: [gameEmbed], components: [actionRow] };
    }

    public async addEpicGamesOfferToChannel(guild: any, epicSettings: any, offer: EpicGame, localisation: Localisation) {
        try {
            const components = await this.buildEpicGamesEmbed(guild, epicSettings, offer, localisation)
            await guild.channels.cache.find((channel: GuildBasedChannel) => channel.name === epicSettings.channelToSend).send(components)
        }
        catch(error) {
            ErrorManager.showError("Error while attempting to add Epic offer (" + offer.title + ") to channel", error)
        }
    }


    public async updateEpicGamesOfferToChannel(message: any, guild: any, epicSettings: any, offer: EpicGame, localisation: Localisation) {
        try {
            const components = await this.buildEpicGamesEmbed(guild, epicSettings, offer, localisation)
            await message.edit(components)
        }
        catch(error) {
            ErrorManager.showError("Error while attempting to add Epic offer (" + offer.title + ") to channel", error)
        }
    }

    public async updateEpicGames(offers: EpicGame[]) {
        DiscordUpdater.isAlreadyRunningDiscordJob = true;

        const guildInformer = GuildInformer.getInstance();
        const epicSettings = EpicSettings.getEpicGameDiscordEmbedSettigns();
        const localisation = new Localisation();


        // Remove duplicate offers (based on title)
        const uniqueOffers = Array.from(new Map(offers.map((offer) => [offer.title, offer])).values());

        // Sort offers in descending order based on the offerCreated ISO string
        // @ts-ignore
        uniqueOffers.sort((a, b) => new Date(b.promos.startDate).getTime() - new Date(a.promos.startDate).getTime());

        const guilds = await guildInformer.getGuildsWithChannelName((epicSettings as any).channelToSend);

        for (const guild of guilds) {
            try {
                localisation.setLanguage(guild.preferredLocale);

                const messagesArray: any[] = [];
                let lastMessageId: string | undefined = undefined;

                // Fetch all messages in the channel
                while (true) {
                    // @ts-ignore
                    const fetchedMessages = await guild.channelToSendTo.messages.fetch({
                        limit: 100,
                        ...(lastMessageId && { before: lastMessageId }),
                    });

                    if (fetchedMessages.size === 0) break;

                    messagesArray.push(...fetchedMessages.values());
                    lastMessageId = fetchedMessages.last()?.id;
                }

                console.log(`[DISCORD]: Fetched ${messagesArray.length} messages from channel.`);

                // Track which titles are already processed
                const processedTitles = new Set<string>();

                // Loop through each unique offer
                for (const offer of uniqueOffers) {

                    const offerTitle = localisation.get("epicGamesTitle") + offer.title!.trim();

                    // Find existing messages for this offer
                    const existingMessages = messagesArray.filter((message: any) => {
                        const messageContent = message.content.trim();
                        const embedTitles = message.embeds.map((embed: any) => embed.title?.trim());

                        // Check if the offer is present in the message (using title or embed)
                        return embedTitles.some((embedTitle: any) => embedTitle && embedTitle.toLowerCase().includes(offerTitle.toLowerCase())) ||
                            messageContent.toLowerCase().includes(offerTitle.toLowerCase());
                    });

                    // Keep only one message for the offer, remove duplicates
                    if (existingMessages.length > 1) {
                        for (let i = 1; i < existingMessages.length; i++) {
                            await existingMessages[i].delete();
                            console.log(`[DISCORD]: Deleted duplicate message for Epic offer: ${offer.title}`);
                        }
                    }

                    const existingMessage = existingMessages[0];

                    // If the message already exists, update it
                    if (existingMessage) {
                        // @ts-ignore
                        if (!processedTitles.has(offer.title)) {
                            await this.updateEpicGamesOfferToChannel(existingMessage, guild, epicSettings, offer, localisation);
                            console.log("[DISCORD]: Updated Epic offer: " + offer.title);
                            // @ts-ignore
                            processedTitles.add(offer.title);
                        }
                    } else {
                        // If no message exists for this offer, create a new one
                        // @ts-ignore
                        if (!processedTitles.has(offer.title)) {
                            await this.addEpicGamesOfferToChannel(guild, epicSettings, offer, localisation);
                            console.log("[DISCORD]: Added new Epic offer: " + offer.title);
                            // @ts-ignore
                            processedTitles.add(offer.title);
                        }
                    }
                }

                // Delete any messages not associated with a current offer
                for (const message of messagesArray) {
                    const offerTitle = localisation.get("epicGamesTitle");
                    const isOfferMessage = message.embeds.some((embed: any) => embed.title && embed.title.startsWith(offerTitle));

                    if (isOfferMessage && !uniqueOffers.some((offer) => message.embeds[0]?.title?.trim() === (offerTitle + offer.title).trim())) {
                        await message.delete();
                        console.log(`[DISCORD]: Deleted obsolete Epic offer message: ${message.embeds[0]?.title}`);
                    }
                }
                console.log("[DISCORD]: Finished updating Epic offers for Guild: " + guild.name);
                DiscordUpdater.isAlreadyRunningDiscordJob = false;
            } catch (error) {
                // @ts-ignore
                ErrorManager.showError("[DISCORD]: Error while updating Epic offers for guild: " + guild.name, error);
                DiscordUpdater.isAlreadyRunningDiscordJob = false;
            }
        }
    }

    public async updateGenshinCodes(codes: GenshinCode[]) {
        DiscordUpdater.isAlreadyRunningDiscordJob = true;

        const guildInformer = GuildInformer.getInstance();
        const genshinSettings = GenshinSettings.getDiscordSettings();
        const localisation = new Localisation();

        // Extract valid code strings from the codes array
        const validCodeStrings = codes.map((code) => code.getCode());

        // Loop through each guild that the bot is part of that has the channel name that the bot is supposed to send to.
        // @ts-ignore
        guildInformer.getGuildsWithChannelName(genshinSettings.channelToSend).forEach((guild: any) => {
            // Adjust the language of the bot to the preferred language of the guild.
            localisation.setLanguage(guild.preferredLocale);

            // Fetch all messages in the channel
            // Fetch all messages in the channel
            guild.channelToSendTo.messages.fetch({ limit: 100 })
                .then((messages: any) => {
                    const messagesToDelete = messages.filter((message: any) => {
                        // Check if the message contains a valid code, in content or embeds
                        const containsValidCode = validCodeStrings.some((code) => {
                            if (message.content.includes(code)) return true;
                            if (message.embeds?.length > 0) {
                                return message.embeds.some((embed: any) => {
                                    if (embed.title?.includes(code)) return true;
                                    if (embed.fields) {
                                        return embed.fields.some((field: any) => field.value.includes(code));
                                    }
                                    return false;
                                });
                            }
                            return false;
                        });

                        return !containsValidCode; // Mark for deletion if code is invalid
                    });

                    const existingValidCodes = new Set(
                        messages.filter((message: any) => {
                            return validCodeStrings.some((code) => {
                                if (message.content.includes(code)) return true;
                                if (message.embeds?.length > 0) {
                                    return message.embeds.some((embed: any) => {
                                        if (embed.title?.includes(code)) return true;
                                        if (embed.fields) {
                                            return embed.fields.some((field: any) => field.value.includes(code));
                                        }
                                        return false;
                                    });
                                }
                                return false;
                            });
                        }).map((message: any) => {
                            return validCodeStrings.find((code) => {
                                return message.content.includes(code) ||
                                    message.embeds?.some((embed: any) =>
                                        embed.title?.includes(code) ||
                                        embed.fields?.some((field: any) => field.value.includes(code))
                                    );
                            });
                        })
                    );

                    // Delete invalid messages
                    const deletePromises = messagesToDelete.map((message: any) => {
                        return message.delete().catch(console.error);
                    });

                    return Promise.all(deletePromises).then(() => existingValidCodes);
                })
                .then((existingValidCodes: Set<string>) => {
                    // Post new codes not already in the channel
                    codes.forEach((code) => {
                        // @ts-ignore
                        if (!existingValidCodes.has(code.getCode())) {
                            this.addGenshinCodeToChannel(guild, genshinSettings, code, localisation);
                            console.log(
                                `[DISCORD]: Adding message for code: ${code.getCode()} | guild: ${guild.name}`
                            );
                        }
                    });
                });

        });
    }


    public async updateSteamGames(games: SteamGame[]) {

        DiscordUpdater.isAlreadyRunningDiscordJob = true;

        const guildInformer = GuildInformer.getInstance();
        const steamSettings = SteamSettings.getSteamDiscordEmbedSettings();
        const localisation = new Localisation();


        // @ts-ignore
        guildInformer.getGuildsWithChannelName(steamSettings.channelToSend).forEach((guild: any) => {
            localisation.setLanguage(guild.preferredLocale);

            guild.channelToSendTo.messages.fetch({limit: 100})
                .then((messages: any) => {
                    const messagesFromThisModule = messages.filter((message: any) => {
                        return message.author.id === this.user.id && message.embeds.some((embed: any) => {
                            return embed.fields?.some((field: any) => {
                                return games.some((game) => game.appId === field.value);
                            });
                        });
                    });

                    const orphanedMessages = messages.filter((message: any) => {
                        // A message is orphaned if NONE of its embed fields contain a valid appId.
                        return message.author.id === this.user.id && message.embeds.some((embed: any) => {
                            return embed.fields?.every((field: any) => {
                                return !games.some((game) => game.appId === field.value);
                            });
                        });
                    });

                    return { messagesFromThisModule, orphanedMessages };
                })
                .then(({ messagesFromThisModule, orphanedMessages }: any) => {
                    // Deleting only orphaned messages that are NOT relevant anymore.
                    orphanedMessages.forEach((message: any) => {
                        message.delete()
                            .then(() => console.log("[DISCORD]: Deleted orphaned message with ID: " + message.id + " from Guild: " + guild.name))
                            .catch((error: Error) => console.error("[DISCORD]: Failed to delete orphaned message with ID: " + message.id, error));
                    });

                    if (messagesFromThisModule.size > 0) {
                        games.forEach((game) => {
                            const gameMessage = messagesFromThisModule.find((message: any) => {
                                return message.embeds.some((embed: any) => {
                                    return embed.fields.some((field: any) => {
                                        return field.value === game.appId;
                                    });
                                });
                            });

                            if (!gameMessage) {
                                this.addSteamGameToChannel(guild, steamSettings, game, localisation);
                                console.log("[DISCORD]: Adding message for game: " + game.title + "\n appId: " + game.appId + " | guild: " + guild.name);
                            } else {
                                this.updateSteamGameInChannel(gameMessage, guild, steamSettings, game, localisation);
                                console.log("[DISCORD]: Updating message for game: " + game.title + "\n appId: " + game.appId + " | guild: " + guild.name);
                            }
                        });
                    } else {
                        games.forEach((game) => {
                            this.addSteamGameToChannel(guild, steamSettings, game, localisation);
                            console.log("[DISCORD]: Adding message for game: " + game.title + "\n appId: " + game.appId + " | guild: " + guild.name);
                        });
                    }
                })
                .finally(() => {
                    console.log("[DISCORD]: Finished updating Steam messages for Guild: " + guild.name);
                    DiscordUpdater.isAlreadyRunningDiscordJob = false;
                })
                .catch((error: Error) => {
                    ErrorManager.showError("[DISCORD]: Error while updating Steam messages for guild: " + guild.name + "\nDown below:", error);
                    DiscordUpdater.isAlreadyRunningDiscordJob = false;
                });
        });
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

            return {embeds: [gameEmbed], components: [actionRow.addComponents((gameButton as any), gameMainButton)]}
        }
        else {
            return {embeds: [gameEmbed], components: [actionRow.addComponents((gameButton as any))]}
        }

    }

    private async updateSteamGameInChannel(message: any, guild: any, steamSettings: any, game: SteamGame, localisation: Localisation) {
        try {
            const components = await this.buildSteamGameEmbed(guild, steamSettings, game, localisation)
            await message.edit(components)
        }
        catch(error) {
            ErrorManager.showError("Error while attempting to update Steam game (" + game.appId + ") to channel", error)
        }
    }
    private async addSteamGameToChannel(guild: any, steamSettings: any, game: SteamGame, localisation: Localisation) {
        try {
            const components = await this.buildSteamGameEmbed(guild, steamSettings, game, localisation)
            await guild.channels.cache.find((channel: GuildBasedChannel) => channel.name === steamSettings.channelToSend).send(components)
        }
        catch(error) {
            ErrorManager.showError("Error while attempting to add Steam game (" + game.appId + ") to channel", error)
        }

    }


    private async addEbayOfferToChannel(guild: any, ebaySettings: any, offer: EbayOffer, localisation: Localisation) {
        try {
            const components = await this.buildEbayOfferEmbed(guild, ebaySettings, offer, localisation)
            await guild.channels.cache.find((channel: GuildBasedChannel) => channel.name === ebaySettings.channelToSend).send(components)
        }
        catch(error) {
            ErrorManager.showError("Error while attempting to add Ebay offer (" + offer.title + ") to channel", error)
        }
    }

    private async buildEbayBidExpiringEmbed(guild: any, ebaySettings: any, offer: EbayOffer, localisation: Localisation) {
        if(!offer.isBeddingOffer)
            return;


        try {
            const components = await this.buildEbayOfferEmbed(guild, ebaySettings, offer, localisation)

            components.content = "@everyone " + localisation.get("ebaySoonBidExpiring");
            await guild.channels.cache.find((channel: GuildBasedChannel) => channel.name === ebaySettings.channelToSend).send(components)
        }
        catch(error) {
            ErrorManager.showError("Error while attempting to build Ebay bid expiring offer (" + offer.title + ") to channel", error)
        }
    }

    private async updateEbayOfferToChannel(message: any, guild: any, ebaySettings: any, offer: EbayOffer, localisation: Localisation) {
        try {
            const components = await this.buildEbayOfferEmbed(guild, ebaySettings, offer, localisation)
            await message.edit(components)
        }
        catch(error) {
            ErrorManager.showError("Error while attempting to update Ebay offer (" + offer.title + ") to channel", error)
        }
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

        DiscordUpdater.isAlreadyRunningDiscordJob = true;


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

                const messagesArray: any[] = [];
                let lastMessageId: string | undefined = undefined;

                // Fetch all messages in the channel
                while (true) {
                    // @ts-ignore
                    const fetchedMessages = await guild.channelToSendTo.messages.fetch({
                        limit: 100,
                        ...(lastMessageId && { before: lastMessageId }),
                    });

                    if (fetchedMessages.size === 0) break;

                    messagesArray.push(...fetchedMessages.values());
                    lastMessageId = fetchedMessages.last()?.id;
                }

                console.log(`[DISCORD]: Fetched ${messagesArray.length} messages from channel.`);

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
                    const isOfferMessage = message.embeds.some((embed: any) => embed.title && embed.title.startsWith(offerTitle));

                    if (isOfferMessage && !uniqueOffers.some((offer) => message.embeds[0]?.title?.trim() === (offerTitle + offer.title).trim())) {
                        await message.delete();
                        console.log(`[DISCORD]: Deleted obsolete Ebay offer message: ${message.embeds[0]?.title}`);
                    }
                }

                console.log("[DISCORD]: Finished updating Ebay offers for Guild: " + guild.name);

                DiscordUpdater.isAlreadyRunningDiscordJob = false;
            } catch (error) {
                // @ts-ignore
                console.error("[DISCORD]: Error while updating Ebay offers for guild: " + guild.name + "\nError: " + error.message + " \n" + error.stack);
                DiscordUpdater.isAlreadyRunningDiscordJob = false;
            }
        }
    }




    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }




}