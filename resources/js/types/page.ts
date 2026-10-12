export type Locale = 'ka' | 'en' | 'ru';

export type SharedPageProps = {
    [key: string]: unknown;
    locale: Locale;
    availableLocales: Locale[];
};
