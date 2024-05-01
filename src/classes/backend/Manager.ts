// Class that defines that a Task reports back to the Manager

import {Task} from "../tasks/Task";

export abstract class Manager {
    abstract reportSuccessTask(task: Task, ...args: any[])
    abstract reportUnsuccessfulTask(task: Task, ...args: any[])

    abstract runAllTasks();
}