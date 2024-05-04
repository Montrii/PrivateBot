// Class that defines that a Task reports back to the Manager

import {Task} from "../tasks/Task";

export abstract class Manager {
    // Static instances for all managers
    static instances: Set<Manager> = new Set();
    protected constructor() {
        Manager.instances.add(this);
    }
    abstract reportSuccessfulTask(task: Task, ...args: any[]): void
    abstract reportUnsuccessfulTask(task: Task, ...args: any[]) : void

    abstract runAllTasks(): void;
}