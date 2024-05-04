export class Localisation {
    private readonly en: any;
    private readonly de: any;
    private _currentLanguage: string;

    constructor() {
        this.en = {
            task: "Task",
            tasks: "Tasks",
            showsAllTasks: "Shows all Tasks in the bot",
            manager: "Manager",
            managers: "Managers",
            showsAllManagers: "Shows all Managers in the bot",

            currentStatus: "Current Status: ",
            lastSuccessfulEndedRun: "Last successful Run: ",
            currentStartedRun: "Current Run started: ",

            contains_all_the_tasks: "Contains all the tasks of the bot",

            // Task descriptions
            SteamSearcherTask: "Searches the internet for free games on Steam.\n Also gives information about the game (like if it is a DLC or not).",

            steamtitle: "Game: ",
            steamdlcTitle: "DLC: ",
            steamdescription: "This game is free on Steam for a limited time!",
            steamdlcDescription: "This DLC is free on Steam for a limited time!",
            steamadd: "Add",
            steamaddDLC: "Add DLC",
            steamaddGame: "Add (Main Game)",
            steamappId: "App ID: ",
            steamreleaseDate: "Release Date: ",
            steamuntilDate: "Until: ",
            steamdlcFor: "DLC for: ",
            steamageRestriction: "Age Restriction: ",


            commandViewTasksDescription: "Displays all tasks in the bot."

        };

        this.de = {
            task: "Aufgabe",
            tasks: "Aufgaben",
            showsAllTasks: "Zeigt alle Aufgaben des Bots an",
            manager: "Manager",
            managers: "Manager",
            showsAllManagers: "Zeigt alle Manager des Bots an",

            currentStatus: "Momentaner Status: ",
            lastSuccessfulEndedRun: "Letzter erfolgreicher Lauf: ",
            currentStartedRun: "Aktueller Lauf: ",

            contains_all_the_tasks: "Enthält alle Aufgaben des Bots",

            // Task descriptions
            SteamSearcherTask: "Sucht im Internet nach kostenlosen Spielen auf Steam.\n Gibt auch Informationen preis über das Spiel (z.B. ob das Spiel ein DLC ist oder nicht).",


            steamtitle: "Spiel ",
            steamdlcTitle: "DLC: ",
            steamdescription: "Dieses Spiel ist für eine begrenzte Zeit auf Steam kostenlos!",
            steamdlcDescription: "Dieses DLC ist für eine begrenzte Zeit auf Steam kostenlos!",
            steamadd: "Hinzufügen",
            steamaddDLC: "DLC hinzufügen",
            steamaddGame: "Hinzufügen (Hauptspiel)",
            steamappId: "App ID: ",
            steamreleaseDate: "Veröffentlichungsdatum: ",
            steamuntilDate: "Erhältlich bis: ",
            steamdlcFor: "DLC für: ",
            steamageRestriction: "Altersbeschränkung: ",

            commandViewTasksDescription: "Zeigt alle Aufgaben im Bot an."
        };

        this._currentLanguage = "en";
    }

    public setLanguage(language: string) {
        if (Object.keys(this).includes(language)) {
            this._currentLanguage = language;
        } else {
            this._currentLanguage = "en";
        }
        return this
    }

    public getLanguage() {
        return this._currentLanguage;
    }

    // Define dynamic getters
    public get(key: string): string {
        return (this as any)[this._currentLanguage][key] || this.en[key];
    }
}