// Defines any settings for how epic games are being displayed.


export class EbaySettings {

    // returns an object with the epic discord embed settings
    static getEbayDiscordEmbedSettings(): object {
        return {
            color: 0x0099ff,
            bidColor: 0xfc4e03,
            url: "https://www.montriscript.com",
            author: "This Bot - Ebay Offer Scouter",
            channelToSend: process.env?.EBAY_CHANNEL ?? "ebay-offers",
            bidExpiringChannelToSend: process.env?.EBAY_BID_EXPIRING_CHANNEL ?? "ebay-bids-expiring"
        }
    }
}