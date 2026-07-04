import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { I18nManager } from "react-native";
import { en, ar, TranslationKey, Language } from "./translations";

const translations = { en, ar };

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  const isRTL = language === "ar";

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let text = translations[language][key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [language]
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(lang === "ar");
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "ar" : "en");
  }, [language, setLanguage]);

  return (
    <LanguageContext.Provider value={{ language, isRTL, t, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
