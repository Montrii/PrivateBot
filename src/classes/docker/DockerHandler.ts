import isDocker from "is-docker";
import {Handler} from "../backend/Handler";


/*
*
* This class handles anything related to docker
* It is supposed to detect and even potentially run the process in docker if it isnt already.
*
 */

export class DockerHandler extends Handler {
    static isInDocker() {
        const value = isDocker();
        super.logDebug("Bot running in Docker Container -> " + value + ".");
        return value;
    }
}