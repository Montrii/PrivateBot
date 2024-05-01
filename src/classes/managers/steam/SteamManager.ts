import {SteamSearcherTask} from "../../tasks/SteamSearcherTask";
import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";


// Defines the Manager for managing Steam searches.
export class SteamManager extends Manager {

    steamSearcherTask: SteamSearcherTask;
    constructor() {
        super();
        this.steamSearcherTask = new SteamSearcherTask(this);
    }

    runAllTasks() {
        this.steamSearcherTask.runSteamTask(5000);
    }

    private reportSuccessTask(task: Task, ...args: any[]) {
        console.log("Task successfully completed!")
    }

    private reportUnsuccessfulTask(task: Task, ...args: any[]) {
        console.log("Task unsuccessfully completed!")
    }
}