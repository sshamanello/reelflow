import { useState, useEffect } from "react";
import { t, getLang, setLang, onLangChange } from "../lib/i18n";

export function useI18n() {
  const [lang, setLangState] = useState(getLang());

  useEffect(() => {
    const unsub = onLangChange((l) => setLangState(l));
    return unsub;
  }, []);

  return { t, lang, setLang };
}
