// Defines any settings for how steam games are being displayed.


export class GenshinSettings {

    // returns an object with the steam discord embed settings
    static getDiscordSettings(): object {
        return {
            color: 0x0099ff,
            dlcColor: "#317256",
            url: "https://www.montriscript.com",
            author: "This Bot - Genshin Code Searcher",
            channelToSend: process.env?.GENSHIN_CODE_REPORT_CHANNEL ?? "free-genshin-codes"
        }
    }
}