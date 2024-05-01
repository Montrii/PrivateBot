/*
*
* This class wraps any given function.
*
 */

export class Task {


    constructor() {
        console.log("[TASK]: Initialising new Task!")
    }
    constructor(name: string) {
        console.log("[TASK]: Initialsing Task: " + name)
    }

    runTask(repeat: number, func: (...args: any[]) => void, ...args: any[]): void {
        console.log("[TASK]: Running Task: " + func.name);
        func(...args); // Call func with provided arguments
    }

    runTaskWithReturn(repeat: number, func: (...args: any[]) => any, ...args: any[]): any {
        console.log("[TASK]: Running Returning Task: " + func.name);
        return func(...args); // Call func with provided arguments
    }
}