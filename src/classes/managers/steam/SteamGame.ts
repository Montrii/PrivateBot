// Defines a Steam game


export class SteamGame {
    appId? : string
    title?: string
    releaseDate?: Date
    untilDate?: Date = new Date()
    originalPrice?: string = "0.00"
    image?: string = ""
    link?: string = ""
    ratingIcon?: string
    isDLC?: boolean = false
    mainGame?: SteamGame

    // @ts-ignore
    constructor();
    // Constructor for main Game
    constructor(appId: string, title: string, releaseDate: Date, ratingIcon: string, image: string, link: string)
    // Constructor for DLC
    constructor(appId: string, title: string, releaseDate: Date, ratingIcon: string, image: string, link: string, untilDate: Date, originalPrice: string, isDLC: boolean, mainGame: SteamGame) {
        this.appId = appId;
        this.title = title;
        this.releaseDate = releaseDate;
        this.untilDate = untilDate;
        this.originalPrice = originalPrice;
        this.image = image;
        this.link = link;
        this.ratingIcon = ratingIcon;
        this.isDLC = isDLC;
        this.mainGame = mainGame;
    }

}