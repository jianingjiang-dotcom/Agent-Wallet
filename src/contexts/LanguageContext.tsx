import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'zh-CN' | 'en';

interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
}

export const languageOptions: LanguageOption[] = [
  { code: 'zh-CN', label: '简体中文', nativeName: '简体中文' },
  { code: 'en', label: 'English', nativeName: 'English' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  getLabel: (lang: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_language';

function getSystemLanguage(): Language {
  const systemLang = navigator.language || (navigator as any).userLanguage || 'en';
  if (systemLang.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    return saved || getSystemLanguage();
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const getLabel = (lang: Language): string => {
    return languageOptions.find(opt => opt.code === lang)?.nativeName || lang;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
