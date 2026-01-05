import { createContext, createSignal } from "solid-js";

export const LangContext = createContext();

export const LangProvider = (props) => {
  const [lang, setLang] = createSignal(localStorage.getItem('lang') || 'en');
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {props.children}
    </LangContext.Provider>
  );
};