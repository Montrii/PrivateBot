import {Task} from "./Task";
import axios from "axios";
import {EbayManager} from "../managers/ebay/EbayManager";
import {ErrorManager} from "../backend/ErrorManager";



export class EbayOfferReceiveEndingBidsTask extends Task {
    manager: EbayManager;
    searchResults = [];
    constructor(manager: EbayManager) {
        super("EbayOfferReceiveEndingBidsTask");
        this.manager = manager;

    }

    // fixed this API callasd
    async runEbayOfferReceiveEndingBids() {
        await super.runTask(async () => {
            console.log("[TASK]: " + this.name + " is running!")
            axios.get("https://api.montriscript.com/api/ebay/offer/getCloseOffers").then((response: any) => {
                if(response.status !== 200) {
                    throw new Error("Response status was not 200. It was: " + response.status)
                }
                let results: any[] = response.data;
                this.manager.reportSuccessfulTask(this, results);
            })
        }).catch((error) => {
            ErrorManager.showError("[TASK]: " + this.name + " failed! Down below: ", error);
            this.manager.reportUnsuccessfulTask(this, null);
        })
    }
}