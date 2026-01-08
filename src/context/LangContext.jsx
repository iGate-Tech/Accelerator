import { createContext, createSignal } from "solid-js";

export const LangContext = createContext();

export const LangProvider = (props) => {
  const [lang, setLang] = createSignal(localStorage.getItem('lang') || 'ar');
  const [serverReachable, setServerReachable] = createSignal(true);
  return (
    <LangContext.Provider value={{ lang, setLang, serverReachable, setServerReachable }}>
      {props.children}
    </LangContext.Provider>
  );
};