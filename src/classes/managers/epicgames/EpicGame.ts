// Defines a game from the Epic Games Store

export class EpicGame {
    appId?: string;

    title?: string;

    releaseDate?: Date;

    untilDate?: Date;

    originalPrice?: string;

    image?: string;

    link?: string;

    ratingIcon?: string;

    rating?: string;

    constructor(appId: string, title: string, releaseDate: Date, ratingIcon: string, image: string, link: string, rating: string) {
        this.appId = appId;
        this.title = title;
        this.releaseDate = releaseDate;
        this.image = image;
        this.link = link;
        this.ratingIcon = ratingIcon;
        this.rating = rating;
    }
}