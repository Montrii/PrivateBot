import {SteamSearcherTask} from "../../tasks/SteamSearcherTask";
import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";
import {SteamGame} from "./SteamGame";
import {DiscordUpdater} from "../discord/DiscordUpdater";


// Defines the Manager for managing Steam searches.
export class SteamManager extends Manager {

    steamSearcherTask: SteamSearcherTask;
    constructor() {
        super("SteamManager");
        this.steamSearcherTask = this.registerTask(new SteamSearcherTask(this) as Task, process.env.RUN_STEAM_SEARCHING_TASK_TIMER_IN_SECONDS as any) as SteamSearcherTask;
    }

    async runAllTasks() {
        await this.steamSearcherTask.runSteamTask();
    }

    public reportSuccessfulTask(task: Task, ...args: any[]) {
        // if completed task is steamSearcher, then second parameter are the found games and the third (boolean) is if it ran entirely.
        console.log("[TASK]: " + task.name + " successfully completed!")
        if(task === this.steamSearcherTask && args[1] === true) {
            DiscordUpdater.getInstance().updateSteamGames(args[0] as SteamGame[]);
        }
    }

    public reportUnsuccessfulTask(task: Task, ...args: any[]) {
        console.log("Task unsuccessfully completed!")
    }
}