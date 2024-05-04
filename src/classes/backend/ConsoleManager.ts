/*
*
* This object overwrites the console.log and console.error methods for Error Handling
* and potential redirecting
*
 */
export const ConsoleManager: object = {
    originalLog: console.log,
    originalError: console.error,


    logOverwritten: false,
    errorOverwritten: false,

    log(text: any): void {
        this.originalLog(text);
    },

    error(text: any): void {
        this.originalError(text);
    },

    overwriteLog(func: any): boolean {
        if (typeof func === 'function') {
            const parameters = func.length;
            if (parameters === 1) {
                console.log = func;
                this.logOverwritten = true;
                return true;
            }
        }
        return false;
    },

    overwriteError(func: any): boolean {
        if (typeof func === 'function') {
            const parameters = func.length;
            if (parameters === 1) {
                console.error = func;
                this.errorOverwritten = true;
                return true;
            }
        }
        return false;
    }

}

// This makes sure that even if console.log and console.error arent overwritten
// They are being redirected to me.

ConsoleManager.overwriteLog((text) => {
    ConsoleManager.log(text);
})

ConsoleManager.overwriteError((text) => {
    ConsoleManager.error(text);
})