import React, { createContext, useContext, useState, useCallback } from 'react';
import { TRANSLATIONS, type Language, type Translations } from './translations';

interface LanguageContextType {
  language: Language;
  t: Translations;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  t: TRANSLATIONS.tr,
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('tr');

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'tr' ? 'en' : 'tr'));
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, t: TRANSLATIONS[language], toggleLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext);
}
