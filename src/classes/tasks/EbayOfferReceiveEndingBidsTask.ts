import {Task} from "./Task";
import axios from "axios";
import {EbayManager} from "../managers/ebay/EbayManager";



export class EbayOfferReceiveEndingBidsTask extends Task {
    manager: EbayManager;
    searchResults = [];
    constructor(manager: EbayManager) {
        super("EbayOfferReceiveEndingBidsTask");
        this.manager = manager;

    }
    async runEbayOfferReceiveEndingBids() {
        await super.runTask(async () => {
            console.log("[TASK]: " + this.name + " is running!")
            axios.get("https://api.montriscript.com/api/ebay/offer/getCloseOffers").then((response: any) => {
                if(response.status !== 200) {
                    throw new Error("Response status was not 200. It was: " + response.status)
                }
                let results: any[] = [];
                this.manager.reportSuccessfulTask(this, results);
            })
        }).catch((error) => {
            console.error("[TASK]: " + this.name + " failed! Down below: " + error.message + " \n" + error.stack)
            this.manager.reportUnsuccessfulTask(this, null);
        })
    }
}