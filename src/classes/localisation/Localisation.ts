interface Language {
    [key: string]: any;
}

interface Localisation {
    [key: string]: Language | string | ((language: string) => void);
    en: Language;
    de: Language;
    setLanguage: (language: string) => void;
    _currentLanguage: string;
}

const Localisation: Localisation = {
    en: {
        steam: {
            title: "Game: ",
            dlcTitle: "DLC: ",
            description: "This game is free for a limited time!",
            dlcDescription: "This DLC is free for a limited time!",
            add: "Add",
            addDLC: "Add DLC",
            addGame: "Add (Main Game)",
            appId: "App ID: ",
            releaseDate: "Release Date: ",
            untilDate: "Until: ",
            dlcFor: "DLC for: ",
            ageRestriction: "Age Restriction: ",
        },
    },
    de: {
        steam: {
            title: "Spiel ",
            dlcTitle: "DLC: ",
            description: "Dieses Spiel ist für eine begrenzte Zeit kostenlos!",
            dlcDescription: "Dieses DLC ist für eine begrenzte Zeit kostenlos!",
            add: "Hinzufügen",
            addDLC: "DLC hinzufügen",
            addGame: "Hinzufügen (Hauptspiel)",
            appId: "App ID: ",
            releaseDate: "Veröffentlichungsdatum: ",
            untilDate: "Erhältlich bis: ",
            dlcFor: "DLC für: ",
            ageRestriction: "Altersbeschränkung: ",
        },
    },
    // Add translations for other languages as needed

    setLanguage(language: string): void {
        if (Object.keys(this).includes(language)) {
            this._currentLanguage = language;
        } else {
            console.error(`[LOCALISATION]: Language '${language}' is not supported. Defaulting to English.`);
            this._currentLanguage = "en";
        }
    },

    _currentLanguage: "en"
};

// Define dynamic getters
Object.keys(Localisation.en).forEach(key => {
    Object.defineProperty(Localisation, key, {
        get(): string {
            return (this as Localisation)[this._currentLanguage][key] || (this as Localisation).en[key];
        }
    });
});
export { Localisation }