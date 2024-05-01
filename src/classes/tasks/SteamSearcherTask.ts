import {Task} from "./Task";
import {SteamManager} from "../managers/steam/SteamManager";

/*
*
* This task looks for any free games on Steam and then passed that data to other objects.
*
 */


// A task may receive all required references passed in the constructor so that the Task function can interact with it.
// The repeating time for the task may be determined as parameter.
export class SteamSearcherTask extends Task {

    manager: SteamManager;
    constructor(manager) {
        super("SteamSearcherTask");
        this.manager = manager;
    }
    runSteamTask(repeat: number) {
        super.runTask(repeat, () => {
            console.log("Executing! ")
            this.manager.reportSuccessTask(this, "SHDJFG")
        });
    }
}