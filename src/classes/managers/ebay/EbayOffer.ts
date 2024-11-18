export class EbayOffer {
    private _title: string;
    private _image: string;
    private _link: string;
    private _price: string;
    private _seller: string;
    private _sellerSold: number;
    private _sellerRating: number; // New field for seller rating
    private _isBeddingOffer: boolean;
    private _offerCreated?: Date;  // Renamed from bidExpiring to offerCreated
    private _bidExpiring?: Date;  // New variable for bid expiration date
    private _biddingOffersAmount?: number; // New property for bidding offers amount
    private _viewerAmount?: number; // New property for viewer amount

    constructor() {}

    // Getters and Setters for each property

    // Title
    get title(): string {
        return this._title;
    }
    set title(value: string) {
        this._title = value;
    }

    // Image
    get image(): string {
        return this._image;
    }
    set image(value: string) {
        this._image = value;
    }

    // Link
    get link(): string {
        return this._link;
    }
    set link(value: string) {
        this._link = value;
    }

    // Price
    get price(): string {
        return this._price;
    }
    set price(value: string) {
        this._price = value;
    }

    // Seller
    get seller(): string {
        return this._seller;
    }
    set seller(value: string) {
        this._seller = value;
    }

    // Seller Sold
    get sellerSold(): number {
        return this._sellerSold;
    }
    set sellerSold(value: number) {
        this._sellerSold = value;
    }

    // Seller Rating (New property)
    get sellerRating(): number {
        return this._sellerRating;
    }
    set sellerRating(value: number) {
        this._sellerRating = value;
    }

    // Is Bedding Offer
    get isBeddingOffer(): boolean {
        return this._isBeddingOffer;
    }
    set isBeddingOffer(value: boolean) {
        this._isBeddingOffer = value;
    }

    // Offer Created (Renamed from bidExpiring)
    get offerCreated(): Date | undefined {
        return this._offerCreated;
    }
    set offerCreated(value: Date | undefined) {
        this._offerCreated = value;
    }

    // Bid Expiring (New property for bid expiration date)
    get bidExpiring(): Date | undefined {
        return this._bidExpiring;
    }
    set bidExpiring(value: Date | undefined) {
        this._bidExpiring = value;
    }

    // Bidding Offers Amount (New property)
    get biddingOffersAmount(): number | undefined {
        return this._biddingOffersAmount;
    }
    set biddingOffersAmount(value: number | undefined) {
        this._biddingOffersAmount = value;
    }

    // Viewer Amount (New property for the number of viewers)
    get viewerAmount(): number | undefined {
        return this._viewerAmount;
    }
    set viewerAmount(value: number | undefined) {
        this._viewerAmount = value;
    }

    // toString Method
    toString(): string {
        return `EbayOffer {
            Title: ${this._title},
            Image: ${this._image},
            Link: ${this._link},
            Price: ${this._price},
            Seller: ${this._seller},
            SellerSold: ${this._sellerSold},
            SellerRating: ${this._sellerRating}%,
            IsBeddingOffer: ${this._isBeddingOffer},
            OfferCreated: ${this._offerCreated ? this._offerCreated.toISOString() : 'N/A'},
            BidExpiring: ${this._bidExpiring ? this._bidExpiring.toISOString() : 'N/A'},
            BiddingOffersAmount: ${this._biddingOffersAmount ?? 'N/A'},
            ViewerAmount: ${this._viewerAmount ?? 'N/A'}
        }`;
    }
}
