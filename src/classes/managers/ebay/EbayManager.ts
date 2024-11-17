// Handles all the Epic Games related operations

import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";
import {EbayOfferSearchingTask} from "../../tasks/EbayOfferSearchingTask";

export class EbayManager extends Manager {
    ebayTasks: Task[] = [];
    ebaySearchingOfferTask: EbayOfferSearchingTask;

    constructor() {
        super("EbayManager");
        this.ebaySearchingOfferTask = this.registerTask(new EbayOfferSearchingTask(this) as Task, 1800) as EbayOfferSearchingTask;
        this.ebayTasks.fill(this.ebaySearchingOfferTask);
    }
    async runAllTasks() {
        await this.ebaySearchingOfferTask.runEbayOfferSearchingTask();
    }

    reportSuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " successfully completed!")
    }

    reportUnsuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " unsuccessfully completed!")
    }
}