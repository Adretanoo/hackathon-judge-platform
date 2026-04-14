import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ua from '../../locales/ua.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ua: { translation: ua }
    },
    lng: "ua", 
    fallbackLng: "ua",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
