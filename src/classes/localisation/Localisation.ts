interface Language {
    [key: string]: any;
}

interface Localisation {
    [key: string]: Language | string | ((language: string) => void) | any;
    en: Language;
    de: Language;
    setLanguage: (language: string) => void;
    _currentLanguage: string;
}

const Localisation: Localisation = {
    en: {
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
    },
    de: {
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