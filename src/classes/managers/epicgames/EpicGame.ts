// Defines a game from the Epic Games Store

export class EpicGame {
    constructor(
        public appId?: string,
        public urlslug?: string,
        public title?: string,
        public description?: string,
        public releaseDate?: Date,
        public originalPrice?: string,
        public currencyCode?: string,
        public type?: string,
        public image?: string,
        public link?: string,
        public developer?: string,
        public freeNow?: boolean,
        public promos: any[] = []
    ) {}
}