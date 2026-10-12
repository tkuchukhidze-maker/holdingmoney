import { router } from '@inertiajs/react';
import type { Locale } from '@/types/page';

const locales: Locale[] = ['ka', 'en', 'ru'];

export function LocaleSwitcher({ locale }: { locale: Locale }) {
    return (
        <nav aria-label="Language" className="flex items-center gap-1">
            {locales.map((candidate) => (
                <button
                    key={candidate}
                    type="button"
                    lang={candidate}
                    aria-current={candidate === locale ? 'true' : undefined}
                    className={
                        'rounded-full px-3 py-2 text-xs font-semibold uppercase ' +
                        (candidate === locale
                            ? 'bg-accent-holding text-white'
                            : 'text-muted hover:bg-cream-deep')
                    }
                    onClick={() => router.post('/locale', { locale: candidate }, {
                        preserveState: false,
                        preserveScroll: true,
                    })}
                >
                    {candidate}
                </button>
            ))}
        </nav>
    );
}
