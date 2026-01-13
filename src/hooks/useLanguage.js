import { useContext, createSignal, createEffect } from "solid-js";
import { LangContext } from "../context/LangContext.jsx";
import { translations } from "../assets/translations/translations-index.js";
import logger from '../lib/logger.js';


export const useLanguage = () => {
  logger.trace('useLanguage: Starting');
  const context = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(context.lang());

  createEffect(() => {
    setCurrentLang(context.lang());
  });

  const t = () => translations[currentLang()];

  return {
    currentLang,
    t,
    setLang: context.setLang
  };
};