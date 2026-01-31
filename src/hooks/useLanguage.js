import { useContext, createMemo } from 'solid-js';
import { LangContext } from '@context/LangContext.jsx';
import { translations } from '@assets/translations/translations-index.js';

// Helper function to get nested property using dot notation
const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : path; // Return original path if not found
  }, obj);
};

export const useLanguage = () => {
  const context = useContext(LangContext);

  return {
    currentLang: context.lang,
    t: context.lang
      ? (path) => {
          const translationObj = translations[context.lang()];
          if (path) {
            return getNestedProperty(translationObj, path);
          } else {
            return translationObj;
          }
        }
      : () => ({}),
    setLang: context.setLang,
  };
};
