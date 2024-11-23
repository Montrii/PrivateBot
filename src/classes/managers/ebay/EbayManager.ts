// Handles all the Epic Games related operations

import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";
import {EbayOfferSearchingTask} from "../../tasks/EbayOfferSearchingTask";
import {EbayOfferSearchResultsTask} from "../../tasks/EbayOfferSearchResultsTask";
import {DiscordUpdater} from "../discord/DiscordUpdater";
import {EbayOffer} from "./EbayOffer";
import axios from "axios";


// A wrapper class for the Ebay offer search item.
class EbayOfferSearchItem {
    constructor(public title: string, public sortingListBy: EbaySortingListBy) {}
}

// Holds an enum of the sorting list by options for Ebay.
enum EbaySortingListBy {
    BEST = 12,
    LOWEST_PRICE = 15,
    HIGHEST_PRICE = 16,
    NEWEST_OFFER = 10,
    SOONEST_ENDING = 1,
    NEAREST_TO_ME = 7,
}


export class EbayManager extends Manager {
    ebayTasks: Task[] = [];
    ebaySearchingOfferTask: EbayOfferSearchingTask;
    ebayOfferSearchResultsTask: EbayOfferSearchResultsTask;

    constructor() {
        super("EbayManager");
        this.ebayOfferSearchResultsTask = this.registerTask(new EbayOfferSearchResultsTask(this) as Task, 60) as EbayOfferSearchResultsTask;
        this.ebaySearchingOfferTask = this.registerTask(new EbayOfferSearchingTask(this) as Task, 420) as EbayOfferSearchingTask;
        this.ebayTasks.fill(this.ebaySearchingOfferTask);
        this.ebayTasks.fill(this.ebayOfferSearchResultsTask);
    }
    async runAllTasks() {
        await this.ebayOfferSearchResultsTask.runEbayOfferFindSearchResults();
        await this.ebaySearchingOfferTask.runEbayOfferSearchingTask();
    }

    reportSuccessfulTask(task: Task, ...args: any[]): void {

        // load the search results into the other task.
        if(task instanceof EbayOfferSearchResultsTask) {
            this.ebayOfferSearchResultsTask.searchResults = args[0];
            this.ebaySearchingOfferTask.searchResults = [];
            for(let i = 0; i < this.ebayOfferSearchResultsTask.searchResults.length; i++) {
                console.log("[TASK]: Found search result: '" + this.ebayOfferSearchResultsTask.searchResults[i] + "'.")
                this.ebaySearchingOfferTask.searchResults.push(new EbayOfferSearchItem(this.ebayOfferSearchResultsTask.searchResults[i], EbaySortingListBy.NEWEST_OFFER));
            }
        }


        if(task instanceof EbayOfferSearchingTask) {
            // Save to server and then pass down to discord.
            this.saveOffersToServer(args[0]).then((result) => {
                DiscordUpdater.getInstance().updateEbaySearchResults(args[0]).then((result) => {
                    console.log("[TASK]: Updated Discord with Ebay search results.")
                }).catch((error) => {
                    console.error("[TASK]: Error occurred while updating Discord with Ebay search results: ", error);
                });
            })

        }
        console.log("[TASK]: " + task.name + " successfully completed!")
    }

    async saveOffersToServer(offers: EbayOffer[]) {
        // Add 1 hour to each offer's bidExpiring
        offers.forEach((offer) => {
            if (offer.bidExpiring) {
                // Parse the bidExpiring time as a Date object
                const bidExpiringDate = new Date(offer.bidExpiring);

                // Add 1 hour to the bidExpiring time
                bidExpiringDate.setHours(bidExpiringDate.getHours() + 1); // Add 1 hour

                // Update the bidExpiring with the new date
                offer.bidExpiring = bidExpiringDate;
            }
        });


        axios.post("https://api.montriscript.com/api/ebay/offer/addOffers", {
            offers: offers
        }).then((response: any) => {
            console.log(response.data.message);

            offers.forEach((offer) => {
                if (offer.bidExpiring) {
                    // Parse the bidExpiring time as a Date object
                    const bidExpiringDate = new Date(offer.bidExpiring);

                    // Add 1 hour to the bidExpiring time
                    bidExpiringDate.setHours(bidExpiringDate.getHours() - 1); // Subtract 1 hour

                    // Update the bidExpiring with the new date
                    offer.bidExpiring = bidExpiringDate;
                }
            });
        }).catch((error) => {
            console.error("[TASK]: Error occurred while saving offers to server: ", error);
        })
    }

    reportUnsuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " unsuccessfully completed!")
    }
}