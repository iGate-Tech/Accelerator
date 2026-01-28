import { createContext, createSignal, createEffect } from 'solid-js';
import { logger } from '@lib/core';

export const LangContext = createContext();

export const LangProvider = props => {
  logger.trace('LangProvider: Starting');
  const initialLang = localStorage.getItem('lang') || 'ar';
  logger.debug('LangProvider: Initial language:', initialLang);
  const [lang, setLang] = createSignal(initialLang);

  // Create a key that changes when language changes to force re-render
  const [langKey, setLangKey] = createSignal(initialLang);

  const updateLang = newLang => {
    logger.debug('LangProvider: Changing language to:', newLang);
    setLang(newLang);
    setLangKey(newLang);
    localStorage.setItem('lang', newLang);

    // Update document direction for RTL/LTR
    document.documentElement.setAttribute(
      'dir',
      newLang === 'ar' ? 'rtl' : 'ltr'
    );
    document.documentElement.setAttribute('lang', newLang);

    // No reload - Router key will trigger re-render
  };

  // Initialize direction on mount
  createEffect(() => {
    const currentLang = lang();
    logger.debug('LangProvider: Setting initial direction:', currentLang);
    document.documentElement.setAttribute(
      'dir',
      currentLang === 'ar' ? 'rtl' : 'ltr'
    );
    document.documentElement.setAttribute('lang', currentLang);
  });

  logger.trace('LangProvider: Provider setup completed');
  return (
    <LangContext.Provider value={{ lang, setLang: updateLang, langKey }}>
      {props.children}
    </LangContext.Provider>
  );
};
