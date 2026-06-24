import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../services/firebase';
import { getUserSettings } from '../services/settingsService';
import {
  Language,
  translate,
} from './translations';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        return;
      }

      try {
        const settings = await getUserSettings();
        setLanguage(settings.language);
      } catch (error) {
        console.log('Error al cargar idioma', error);
      }
    });

    return unsubscribe;
  }, []);

  const t = (key: string) => translate(language, key);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }

  return context;
}