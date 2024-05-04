/*
*
* This object overwrites the console.log and console.error methods for Error Handling
* and potential redirecting
*
 */
interface ConsoleManager {
    originalLog: typeof console.log;
    originalError: typeof console.error;
    logOverwritten: boolean;
    errorOverwritten: boolean;
    log: (text: any) => void;
    error: (text: any) => void;
    overwriteLog: (func: (message?: any, ...optionalParams: any[]) => void) => boolean;
    overwriteError: (func: (message?: any, ...optionalParams: any[]) => void) => boolean;
}

export const ConsoleManager: ConsoleManager = {
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
    overwriteLog(func: (message?: any, ...optionalParams: any[]) => void): boolean {
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
    overwriteError(func: (message?: any, ...optionalParams: any[]) => void): boolean {
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
};

// This makes sure that even if console.log and console.error arent overwritten
// They are being redirected to me.

ConsoleManager.overwriteLog((text: string) => {
    ConsoleManager.log(text);
})

ConsoleManager.overwriteError((text: string) => {
    ConsoleManager.error(text);
})