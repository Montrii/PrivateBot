/*
*
* Abstract class for all Handler classes for common methods and attributes.
*
 */


export abstract class Handler {
    static logDebug(text) {
        console.log("[" + "HANDLER" + "]: " + text)
    }
}