// Handles all the Epic Games related operations

import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";
import {EbayOfferSearchingTask} from "../../tasks/EbayOfferSearchingTask";
import {EbayOfferSearchResultsTask} from "../../tasks/EbayOfferSearchResultsTask";


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
        this.ebaySearchingOfferTask = this.registerTask(new EbayOfferSearchingTask(this) as Task, 300) as EbayOfferSearchingTask;
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
        console.log("[TASK]: " + task.name + " successfully completed!")
    }

    reportUnsuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " unsuccessfully completed!")
    }
}