/*

Task looks for free epic games. If it finds any, it will report back to the Manager.

*/

import {Task} from "./Task";
import {EpicGame} from "../managers/epicgames/EpicGame";
import {EpicGamesManager} from "../managers/epicgames/EpicGamesManager";

import axios from "axios";
import cheerio from "cheerio";
import {HTMLInfo} from "../backend/HTMLInfo";

export class EpicGamesSearcherTask extends Task {
    manager: EpicGamesManager;
    games: EpicGame[];
    constructor(manager: EpicGamesManager) {
        super("EpicGamesSearcherTask");
        this.manager = manager;
        this.games = [];
    }

    async runEpicGamesTask() {
        await super.runTask(async () => {
            await axios.get("https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions").then(async (result) => {
                // If URL does not return proper status code, something went wrong.
                if(result.status !== 200) {
                    this.manager.reportUnsuccessfulTask(this);
                    console.log("[TASK]: " + this.name + " failed! Status code: " + result.status)
                    return;
                }

                this.games = [];
                console.log("[TASK]: " + this.name + " is running!")

                // Websites returns JSON, so we can parse it directly.
                // Filter out any game that have no promotions.
                const gamesArray = result.data.data.Catalog.searchStore.elements.filter((element: any) => element.promotions !== null)

                gamesArray.forEach((element: any) => {
                    const thumbnail = element.keyImages.filter((image: any) => image.type === "Thumbnail")[0].url

                    // stores any upcoming promos for the game
                    let promos: any[] = [];

                    // Check if the game is available right now or in the future
                    let freeNow = false;

                    // Check if the game has any upcoming promos (if not, it is free right now)
                    if (element.promotions.upcomingPromotionalOffers.length > 0) {

                        // Receive the next promo for the game
                        promos = element.promotions.upcomingPromotionalOffers
                            .flatMap((offer: any) => offer.promotionalOffers)
                            .filter((promo: any) => {
                                return new Date(promo.startDate) > new Date();
                            })
                            .sort((promo1: any, promo2: any) => {
                                return (new Date(promo1.startDate) as any) - (new Date(promo2.startDate) as any);
                            })[0]
                            ;

                    }
                    else {
                        freeNow = true;
                        // Receive the current promo for the game
                        promos = element.promotions.promotionalOffers
                            .flatMap((offer: any) => offer.promotionalOffers)
                            .find((promo: any) => {
                                const startDate = new Date(promo.startDate);
                                const endDate = new Date(promo.endDate);
                                return new Date() >= startDate && new Date() <= endDate;
                            });

                    }


                    // Determing what slug to use for the game
                    let slug: string;

                    if (element.offerMappings?.length) {
                        // @ts-ignore
                        const offerMappingWithOfferPageType = element.offerMappings.find(mapping => mapping.pageType === 'offer');
                        slug = offerMappingWithOfferPageType ? offerMappingWithOfferPageType.pageSlug : element.offerMappings[0].pageSlug;
                    } else if (element.catalogNs.mappings?.length) {
                        slug = element.catalogNs.mappings[0].pageSlug;
                    } else {
                        slug = element.urlSlug || element.productSlug || "";
                    }

                    //gameInfoPromise.push(this.fetchEpicGamesLink(element.id))
                    // Add the game to the list
                    this.games.push(new EpicGame(element.id, element.urlSlug, element.title, element.description, new Date(element.effectiveDate), element.price.totalPrice.fmtPrice.originalPrice, element.price.totalPrice.currencyCode, element.offerType, thumbnail, "https://store.epicgames.com/en-US/p/" + slug, element.seller.name, freeNow, promos))
                })
                console.log(this.games)
                this.manager.reportSuccessfulTask(this, this.games);
            }).catch((error) => {
                console.error("[TASK]: " + this.name + " failed! Down below: " + error.message + " \n" + error.stack)
                this.manager.reportUnsuccessfulTask(this, this.games);
            })
        });
    }
    /*
    private async fetchEpicGamesLink(offerId): Promise<any> {
        /* we may use the global query search first in order to find the game on the store and then load the game */
        /* we need to use getCatalogOffer to get the correct link to the game */
        // will also give us more information about the game
}