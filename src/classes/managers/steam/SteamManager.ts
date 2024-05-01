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
        this.steamSearcherTask.runSteamTask(10000);
    }

    private reportSuccessfulTask(task: Task, ...args: any[]) {
        // if completed task is steamSearcher, then second parameter are the found games and the third (boolean) is if it ran entirely.
        if(task === this.steamSearcherTask) {
            if (args.length >= 2) {
                const foundGames = args[0]; // Access the first argument
                const ranEntirely = args[1]; // Access the second argument

                console.log("Found games:", foundGames);
                console.log("Ran entirely:", ranEntirely);
            }
        }
    }

    private reportUnsuccessfulTask(task: Task, ...args: any[]) {
        console.log("Task unsuccessfully completed!")
    }
}