import type { Locale } from '@/types/page';

const messages = {
    ka: {
        home: 'მთავარი',
        dine: 'რესტორნები',
        stay: 'სასტუმროები',
        myEpisode: 'My Episode',
        controlCenter: 'Control Center',
        headline: 'ერთი ანგარიში. ყველა გამოცდილება.',
        summary: 'Episode Holding — რესტორნები, სასტუმროები და გამოცდილებები ერთ სივრცეში.',
        foundation: 'სისტემის საწყისი ვერსია',
        phaseInfo: 'ფუნქციური გვერდები დამტკიცებული პროტოტიპებიდან ეტაპობრივად გადმოვა.',
        primaryAction: 'დამტკიცებული დიზაინების მიხედვით',
        privacy: 'მხოლოდ სტრუქტურული საძირკველი. რეალური ჯავშნები გამორთულია.',
    },
    en: {
        home: 'Home',
        dine: 'Restaurants',
        stay: 'Hotels',
        myEpisode: 'My Episode',
        controlCenter: 'Control Center',
        headline: 'One account. Every experience.',
        summary: 'Episode Holding — restaurants, hotels, and experiences in one place.',
        foundation: 'Platform foundation',
        phaseInfo: 'Functional screens will be implemented from the approved prototypes, phase by phase.',
        primaryAction: 'Based on the approved designs',
        privacy: 'Foundation only. Live bookings are not enabled.',
    },
    ru: {
        home: 'Главная',
        dine: 'Рестораны',
        stay: 'Отели',
        myEpisode: 'My Episode',
        controlCenter: 'Control Center',
        headline: 'Один аккаунт. Все впечатления.',
        summary: 'Episode Holding — рестораны, отели и впечатления в одном пространстве.',
        foundation: 'Основа платформы',
        phaseInfo: 'Рабочие страницы будут перенесены из утверждённых прототипов по этапам.',
        primaryAction: 'По утверждённому дизайну',
        privacy: 'Только основа. Реальное бронирование не включено.',
    },
} as const;

export type MessageKey = keyof (typeof messages)['ka'];

export function translate(locale: Locale, key: MessageKey): string {
    return messages[locale]?.[key] ?? messages.ka[key];
}
