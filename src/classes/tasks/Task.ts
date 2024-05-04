/*
*
* This class wraps any given function.
*
 */

import {TaskState} from "./TaskState";

export class Task {

    name: string


    state: TaskState

    currentRunStarted: Date = new Date();

    lastRunFinished: Date = new Date();
    constructor(name: string) {
        console.log("[TASK]: Initializing Task: " + name + ".")
        this.state = TaskState.IDLE
        this.name = name;
    }

    runTask(repeat: number, func: (...args: any[]) => void, ...args: any[]): void {
        setInterval(async () => {
            // Make sure that the Task only repeats if it is finished or failed (might be temporarily an issue)
            if (this.state !== TaskState.RUNNING) {
                this.state = TaskState.RUNNING;
                try {
                    this.currentRunStarted = new Date();
                    await func(...args); // Call func with provided arguments
                } catch (error) {
                    console.error("Error occurred during task execution:", error);
                    this.state = TaskState.FAILED;
                } finally {
                    this.state = TaskState.FINISHED;
                    this.lastRunFinished = new Date();
                }
            }
        }, repeat);
    }

    public toString = () : string => {
        return `Task (Name: ${this.name})`;
    }
}