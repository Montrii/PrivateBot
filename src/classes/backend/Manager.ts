// Class that defines that a Task reports back to the Manager

import {Task} from "../tasks/Task";

export abstract class Manager {
    abstract reportSuccessfulTask(task: Task, ...args: any[]): void
    abstract reportUnsuccessfulTask(task: Task, ...args: any[]) : void

    abstract runAllTasks(): void;
}