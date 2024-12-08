// Defines any settings for how epic games are being displayed.


export class EpicSettings {

    // returns an object with the epic discord embed settings
    static getEpicGameDiscordEmbedSettigns(): object {
        return {
            color: "blue",
            url: "https://www.montriscript.com",
            author: "This Bot - Epic Game Searcher",
            channelToSend: process.env?.EPIC_REPORT_CHANNEL ?? "free-epic-games"
        }
    }
}