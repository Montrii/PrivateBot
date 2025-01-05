// Defines a game from the Epic Games Store


export class EpicGame {
    constructor(
        public appId?: string,
        public urlslug?: string,
        public title?: string,
        public description?: string,
        public releaseDate?: Date,
        public originalPrice?: string,
        public discountPrice?: number,
        public currencyCode?: string,
        public type?: string,
        public image?: string,
        public link?: string,
        public developer?: string,
        public freeNow?: boolean,
        public offerType?: string,
        public promos: any[] = []
    ) {}
}


/*

epicGamesDeveloper: "Developer: ",
    epicGamesReleaseDate: "Release Date: ",
    epicGamesOfferStartDate: "Offer Start Date: ",
    epicGamesOfferEndDate: "Offer End Date: ",

    epicGamesOriginalPrice: "Original Price: ",
    epicGamesDiscountPrice: "Discount Price: ",
 */