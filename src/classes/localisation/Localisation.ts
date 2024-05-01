interface Language {
    [key: string]: string;
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
        test: "English Test"
    },
    de: {
        test: "German Test"
    },
    // Add translations for other languages as needed

    setLanguage(language: string): void {
        if (Object.keys(this).includes(language)) {
            this._currentLanguage = language;
        } else {
            console.error(`Language '${language}' is not supported. Defaulting to English.`);
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