/*
*
* Abstract class for all Handler classes for common methods and attributes.
*
 */


export abstract class Handler {
    static logDebug(text: string) {
        console.log("[" + "HANDLER" + "]: " + text)
    }
}