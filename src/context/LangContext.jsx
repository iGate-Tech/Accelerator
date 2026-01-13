import { createContext, createSignal } from "solid-js";
import logger from '../lib/logger.js';


export const LangContext = createContext();

export const LangProvider = (props) => {
  logger.trace('LangProvider: Starting');
  const initialLang = localStorage.getItem('lang') || 'ar';
  logger.debug('LangProvider: Initial language:', initialLang);
  const [lang, setLang] = createSignal(initialLang);
  const [serverReachable, setServerReachable] = createSignal(true);
  logger.debug('LangProvider: Signals created, serverReachable default: true');
  logger.trace('LangProvider: Provider setup completed');
  return (
    <LangContext.Provider value={{ lang, setLang, serverReachable, setServerReachable }}>
      {props.children}
    </LangContext.Provider>
  );
};