// Handles all the Epic Games related operations

import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";
import {EpicGamesSearcherTask} from "../../tasks/EpicGamesSeacherTask";

export class EpicGamesManager extends Manager {

    epicGamesSearchTask: EpicGamesSearcherTask
    constructor() {
        super("EpicGamesManager");
        this.epicGamesSearchTask = this.registerTask(new EpicGamesSearcherTask(this) as Task, 1800) as EpicGamesSearcherTask;
    }
    async runAllTasks() {
        await this.epicGamesSearchTask.runEpicGamesTask();
    }

    reportSuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " successfully completed!")
    }

    reportUnsuccessfulTask(task: Task, ...args: any[]): void {
        console.log("[TASK]: " + task.name + " unsuccessfully completed!")
    }
}