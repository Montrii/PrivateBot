
import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";
import {DiscordUpdater} from "../discord/DiscordUpdater";
import {GenshinCodeSearcherTask} from "../../tasks/GenshinCodeSearcherTask";


// Defines the Manager for managing Steam searches.
export class GenshinManager extends Manager {

    genshinCodeSearcher: GenshinCodeSearcherTask;
    constructor() {
        super("GenshinManager");
        this.genshinCodeSearcher = this.registerTask(new GenshinCodeSearcherTask(this) as Task, process.env.RUN_GENSHIN_SEARCHING_TASK_TIMER_IN_SECONDS as any) as GenshinCodeSearcherTask;
    }

    async runAllTasks() {
        await this.genshinCodeSearcher.runGenshinTask();
    }

    public reportSuccessfulTask(task: Task, ...args: any[]) {
        // if completed task is steamSearcher, then second parameter are the found games and the third (boolean) is if it ran entirely.
        console.log("[TASK]: " + task.name + " successfully completed!")
        if(task === this.genshinCodeSearcher) {
            DiscordUpdater.getInstance().updateGenshinCodes(args[0]);
        }
    }

    public reportUnsuccessfulTask(task: Task, ...args: any[]) {
        console.log("Task unsuccessfully completed!")
    }
}