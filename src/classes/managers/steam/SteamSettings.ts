// Defines any settings for how steam games are being displayed.


export class SteamSettings {

    // returns an object with the steam discord embed settings
    static getSteamDiscordEmbedSettings(): object {
        return {
            color: 0x0099ff,
            dlcColor: "#317256",
            url: "https://www.montriscript.com",
            author: "This Bot - Steam Game Searcher",
            channelToSend: process.env?.STEAM_REPORT_CHANNEL ?? "free-steam-games"
        }
    }
}