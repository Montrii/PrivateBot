/*
*
* This class wraps any given function.
*
 */

import {TaskState} from "./TaskState";

export class Task {

    name: string


    state: TaskState

    lastError?: Error | null = null;

    amountOfRuns: number = 0;

    amountOfFailures: number = 0;

    currentRunStarted: Date | null = null;

    lastRunFinished: Date | null = null;

    // repeat after x seconds * 1000
    repeatsAfter: number = 0;
    constructor(name: string) {
        console.log("[TASK]: Initializing Task: " + name + ".")
        this.state = TaskState.IDLE
        this.name = name;
        this.lastError = null;
        this.amountOfRuns = 0;
        this.amountOfFailures = 0;
    }

    async runTask(func: (...args: any[]) => void, ...args: any[]): Promise<void> {
        // Starts the task on the first time immediately and then repeats after x seconds.
        try {
            this.state = TaskState.RUNNING;
            this.currentRunStarted = new Date();
            await func(...args); // Call func with provided arguments
            this.state = TaskState.FINISHED;
            this.lastRunFinished = new Date();
            this.amountOfRuns += 1;
        }
        catch(error: any) {
            console.error("Error occurred during task execution:", error);
            this.state = TaskState.FAILED;
            this.lastError = error;
            this.amountOfFailures += 1;
        } finally {
            setInterval(async () => {
                // Make sure that the Task only repeats if it is finished or failed (might be temporarily an issue)
                if (this.state !== TaskState.RUNNING) {
                    this.state = TaskState.RUNNING;
                    try {
                        this.currentRunStarted = new Date();
                        await func(...args); // Call func with provided arguments
                    } catch (error: any) {
                        console.error("Error occurred during task execution:", error);
                        this.state = TaskState.FAILED;
                        this.lastError = error;
                        this.amountOfFailures += 1;
                    } finally {
                        this.state = TaskState.FINISHED;
                        this.lastRunFinished = new Date();
                        this.amountOfRuns += 1;
                    }
                }
            }, this.repeatsAfter * 1000);
        }
    }

    public setRepeatsAfter(seconds: number): Task {
        this.repeatsAfter = seconds;
        return this;
    }
    public toString = () : string => {
        return `Task (Name: ${this.name})`;
    }
}