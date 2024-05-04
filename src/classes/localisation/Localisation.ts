export class Localisation {
    private readonly en: any;
    private readonly de: any;
    private _currentLanguage: string;

    constructor() {
        this.en = {
            steamtitle: "Game: ",
            steamdlcTitle: "DLC: ",
            steamdescription: "This game is free for a limited time!",
            steamdlcDescription: "This DLC is free for a limited time!",
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
            steamtitle: "Spiel ",
            steamdlcTitle: "DLC: ",
            steamdescription: "Dieses Spiel ist für eine begrenzte Zeit kostenlos!",
            steamdlcDescription: "Dieses DLC ist für eine begrenzte Zeit kostenlos!",
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

    // Define dynamic getters
    public get(key: string): string {
        return (this as any)[this._currentLanguage][key] || this.en[key];
    }
}