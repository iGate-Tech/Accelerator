import { useContext } from "solid-js";
import { LangContext } from "../context/LangContext.jsx";
import { translations } from "../assets/translations/translations-index.js";

export const useLanguage = () => {
  const context = useContext(LangContext);
  
  return {
    currentLang: context.lang,
    t: () => translations[context.lang()],
    setLang: context.setLang
  };
};
