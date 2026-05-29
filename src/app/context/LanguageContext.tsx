"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type KolkapLanguage = "en" | "zh" | "id" | "ms";

type LanguageContextValue = {
  language: KolkapLanguage;
  setLanguage: (language: KolkapLanguage) => void;
  languageLabel: string;
};

const labels: Record<KolkapLanguage, string> = {
  en: "English",
  zh: "中文",
  id: "Bahasa Indonesia",
  ms: "Malay",
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function KolkapLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<KolkapLanguage>("en");

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languageLabel: labels[language],
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useKolkapLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useKolkapLanguage must be used inside KolkapLanguageProvider"
    );
  }

  return context;
}

export const kolkapLanguageOptions: {
  code: KolkapLanguage;
  label: string;
}[] = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Malay" },
];