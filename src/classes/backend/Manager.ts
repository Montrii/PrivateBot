// Class that defines that a Task reports back to the Manager

import {Task} from "../tasks/Task";

export abstract class Manager {
    public name: string = "Manager";

    // Static instances for all managers
    static instances: Set<Manager> = new Set();

    tasks: Set<Task> = new Set();
    protected constructor(name: string) {
        Manager.instances.add(this);
        this.name = name;
    }

    protected registerTask(task: Task, repeat: number): Task {
        task.setRepeatsAfter(repeat);
        this.tasks.add(task);
        return task;
    }
    abstract reportSuccessfulTask(task: Task, ...args: any[]): void
    abstract reportUnsuccessfulTask(task: Task, ...args: any[]) : void

    abstract runAllTasks(): void;


    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}