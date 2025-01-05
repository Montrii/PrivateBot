// Handles all the Epic Games related operations

import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";
import {EpicGamesSearcherTask} from "../../tasks/EpicGamesSeacherTask";
import {DiscordUpdater} from "../discord/DiscordUpdater";

export class EpicGamesManager extends Manager {

    epicGamesSearchTask: EpicGamesSearcherTask
    constructor() {
        super("EpicGamesManager");
        this.epicGamesSearchTask = this.registerTask(new EpicGamesSearcherTask(this) as Task, process.env.RUN_EPIC_SEARCHING_TASK_TIMER_IN_SECONDS as any) as EpicGamesSearcherTask;
    }
    async runAllTasks() {
        await this.epicGamesSearchTask.runEpicGamesTask();
    }

    reportSuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " successfully completed!")

        if(task === this.epicGamesSearchTask) {
            console.log("[DISCORD]: Updating Discord with new Epic Games offers.")
            DiscordUpdater.getInstance().updateEpicGames(args[0]);
        }
    }

    reportUnsuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " unsuccessfully completed!")
    }
}