// Handles all the Epic Games related operations

import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";
import {EbayOfferSearchingTask} from "../../tasks/EbayOfferSearchingTask";
import {EbayOfferSearchResultsTask} from "../../tasks/EbayOfferSearchResultsTask";
import {DiscordUpdater} from "../discord/DiscordUpdater";
import {EbayOffer} from "./EbayOffer";
import axios from "axios";
import { EbayOfferReceiveEndingBidsTask } from "../../tasks/EbayOfferReceiveEndingBidsTask";
import {ErrorManager} from "../../backend/ErrorManager";


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
    ebayOfferReceiveEndingBidsTask: EbayOfferReceiveEndingBidsTask;

    constructor() {
        super("EbayManager");
        this.ebayOfferSearchResultsTask = this.registerTask(new EbayOfferSearchResultsTask(this) as Task, 60) as EbayOfferSearchResultsTask;
        this.ebaySearchingOfferTask = this.registerTask(new EbayOfferSearchingTask(this) as Task, 300) as EbayOfferSearchingTask;
        this.ebayOfferReceiveEndingBidsTask = this.registerTask(new EbayOfferReceiveEndingBidsTask(this) as Task, 150) as EbayOfferReceiveEndingBidsTask;
        this.ebayTasks.fill(this.ebaySearchingOfferTask);
        this.ebayTasks.fill(this.ebayOfferSearchResultsTask);
        this.ebayTasks.fill(this.ebayOfferReceiveEndingBidsTask);
    }
    async runAllTasks() {
        await this.ebayOfferSearchResultsTask.runEbayOfferFindSearchResults();
        await this.ebayOfferReceiveEndingBidsTask.runEbayOfferReceiveEndingBids();
        await this.ebaySearchingOfferTask.runEbayOfferSearchingTask();
    }

    reportSuccessfulTask(task: Task, ...args: any[]): void {

        if(task instanceof EbayOfferReceiveEndingBidsTask) {
            if(args[0].length === 0) {
                console.log("[TASK]: No bid is about to end.")
            }
            else {
                DiscordUpdater.getInstance().addBidExpiringOffers(args[0]).then(() => {
                    console.log("[TASK]: Updated Discord with bid expiring offers.")
                }).catch((error: any) => {
                    ErrorManager.showError("[TASK]: Error occurred while updating Discord with bid expiring offers: ", error);
                });
            }
        }

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
            this.saveOffersToServer(args[0]).then(() => {
                DiscordUpdater.getInstance().updateEbaySearchResults(args[0]).then((result) => {
                    console.log("[TASK]: Updated Discord with Ebay search results.")
                }).catch((error) => {
                    ErrorManager.showError("[TASK]: Error occurred while updating Discord with Ebay search results: ", error);
                });
            })

        }
        console.log("[TASK]: " + task.name + " successfully completed!")
    }

    async saveOffersToServer(offers: EbayOffer[]) {

        axios.post("https://api.montriscript.com/api/ebay/offer/addOffers", {
            offers: offers
        }).then((response: any) => {
            console.log(response.data.message);
        }).catch((error) => {
            ErrorManager.showError("[TASK]: Error occurred while saving offers to server: ", error);
        })
    }

    reportUnsuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " unsuccessfully completed!")
    }
}