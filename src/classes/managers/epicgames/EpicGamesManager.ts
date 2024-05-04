// Handles all the Epic Games related operations

import {Manager} from "../../backend/Manager";
import {Task} from "../../tasks/Task";

export class EpicGamesManager extends Manager {
    constructor() {
        super("EpicGamesManager");
    }
    runAllTasks() {
    }

    reportSuccessfulTask(task: Task, ...args: any[]): void {
    }

    reportUnsuccessfulTask(task: Task, ...args: any[]): void {
    }
}