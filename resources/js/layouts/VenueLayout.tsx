import { Head, Link, usePage } from '@inertiajs/react';
import type { CSSProperties, PropsWithChildren } from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import type { SharedPageProps } from '@/types/page';

export type VenueTheme = 'batumi' | 'kutaisi' | 'tbilisi' | 'magnolia' | 'chateau-mere';

const accents: Record<VenueTheme, string> = {
    batumi: '#1F4E63',
    kutaisi: '#7A5418',
    tbilisi: '#6E3326',
    magnolia: '#6A3D5E',
    'chateau-mere': '#4A5D3F',
};

export function VenueLayout({ children, theme, venueName }: PropsWithChildren<{
    theme: VenueTheme;
    venueName: string;
}>) {
    const { locale } = usePage<SharedPageProps>().props;
    const style = { '--venue-accent': accents[theme] } as CSSProperties;

    return (
        <div lang={locale} className="min-h-screen bg-ground text-ink" style={style}>
            <Head title={venueName} />
            <header className="border-b border-line bg-surface">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
                    <Link href="/" className="font-semibold tracking-[.18em]" style={{ color: 'var(--venue-accent)' }}>
                        {venueName}
                    </Link>
                    <LocaleSwitcher locale={locale} />
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}
