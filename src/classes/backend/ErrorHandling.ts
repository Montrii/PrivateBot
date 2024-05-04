/*
*
* This file stores all the exceptions handled and catched individually.
*
*
 */


// Sigterm handling
process.on("SIGTERM", (error: Error) => {
    console.log("[SYSTEM]: SIGTERM called, terminating..")
    process.exit(error ? 1 : 0);
})

// unhandledException handling
process.on("uncaughtException", (error: Error) => {
    console.log("[SYSTEM]: Uncaught Exception! Read below: ")
    if(error) {
        console.log("Message: " + error.message);
        console.log("Cause: " + error.cause)
        console.log("Stack: " + error.stack);
    }
    process.exit(error ? 1 : 0);
})

// unhandledRejection handling
process.on("unhandledRejection", (error: Error) => {
    console.log("[SYSTEM]: Unhandled Rejection! Read below: ")
    if(error) {
        console.log("Message: " + error.message);
        console.log("Cause: " + error.cause)
        console.log("Stack: " + error.stack);
    }
    process.exit(error ? 1 : 0);
})