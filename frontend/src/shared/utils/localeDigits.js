const LATIN_DIGIT_LOCALES = {
  ar: 'ar-EG-u-nu-latn',
  en: 'en-US-u-nu-latn'
};

export const getLatinDigitsLocale = (lang = 'en') => (
  String(lang).toLowerCase().startsWith('ar')
    ? LATIN_DIGIT_LOCALES.ar
    : LATIN_DIGIT_LOCALES.en
);
