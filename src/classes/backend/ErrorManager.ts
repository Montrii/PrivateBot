// Manage error messages and show them in the console.


export class ErrorManager {
    static showError(title: string, error: any) {
        console.error(`[ERROR]: ${title}! Read below: `);

        // If error.errors set, it is an array of errors (Discord.js e.g.)
        if(error.errors) {
            error.errors.forEach((err: any) => {
                console.error(err[1]);
            })
        }
        else if (Array.isArray(error)) {
            error.forEach((err, index) => {
                console.error(`Error ${index + 1}: ${err.message || err}`);
                console.error(`Cause: ${err.cause}`);
                console.error(`Stack: ${err.stack}`);
            });
        } else if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            console.error(`Cause: ${error.cause}`);
            console.error(`Stack: ${error.stack}`);
        } else if (typeof error === 'object') {
            console.error("Received errors:");
            for (const [key, value] of Object.entries(error)) {
                console.error(`Key: ${key}, Value: ${value}`);
            }
        } else {
            console.error(`Unexpected error format: ${error}`);
        }
    }
}