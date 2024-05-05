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
    }

    runEpicGamesTask() {
        super.runTask(async () => {
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
                            .flatMap(offer => offer.promotionalOffers)
                            .filter(promo => {
                                const startDate = new Date(promo.startDate);
                                return startDate > new Date();
                            })
                            .sort((promo1, promo2) => {
                                const startDate1 = new Date(promo1.startDate);
                                const startDate2 = new Date(promo2.startDate);
                                return startDate1 - startDate2;
                            })[0]
                            ;

                    }
                    else {
                        freeNow = true;
                        // Receive the current promo for the game
                        promos = element.promotions.promotionalOffers
                            .flatMap(offer => offer.promotionalOffers)
                            .find(promo => {
                                const startDate = new Date(promo.startDate);
                                const endDate = new Date(promo.endDate);
                                return new Date() >= startDate && new Date() <= endDate;
                            });

                    }

                    // Add the game to the list
                    this.games.push(new EpicGame(element.id, element.urlSlug, element.title, element.description, new Date(element.effectiveDate), element.price.totalPrice.fmtPrice.originalPrice, element.price.totalPrice.currencyCode, element.offerType, thumbnail, "https://store.epicgames.com/en-US/p/" + element.urlSlug, element.seller.name, freeNow, promos))
                })

                this.manager.reportSuccessfulTask(this, this.games);
            }).catch((error) => {
                console.error("[TASK]: " + this.name + " failed! Down below: " + error.message + " \n" + error.stack)
                this.manager.reportUnsuccessfulTask(this);
            })
        });
    }
}