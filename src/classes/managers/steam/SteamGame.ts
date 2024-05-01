// Defines a Steam game


export class SteamGame {
    title: string
    releaseDate: string
    untilDate: string
    image: string
    link: string
    isDLC: boolean
    mainGameTitle: string
    mainGameLink: string

    constructor(title, releaseDate, untilDate, image, link, isDLC, mainGameTitle, mainGameLink) {
        this.title = title;
        this.releaseDate = releaseDate;
        this.untilDate = untilDate;
        this.image = image;
        this.link = link;
        this.isDLC = isDLC;
        this.mainGameTitle = mainGameTitle
        this.mainGameLink = mainGameLink
    }
}