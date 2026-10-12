import { Head, Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { translate } from '@/i18n';
import type { SharedPageProps } from '@/types/page';

type LayoutProps = PropsWithChildren<{ title?: string }>;

export function HoldingLayout({ children, title }: LayoutProps) {
    const { locale } = usePage<SharedPageProps>().props;

    return (
        <div className="min-h-screen bg-ground text-ink" lang={locale}>
            <Head title={title ?? 'Episode Holding'} />
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3">
                Skip to content
            </a>
            <header className="border-b border-line bg-surface">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-12">
                    <Link href="/" className="text-lg font-semibold tracking-[0.28em] text-accent-holding">
                        EPISODE
                    </Link>
                    <div className="flex items-center gap-5">
                        <span className="hidden text-xs text-muted md:inline">{translate(locale, 'headline')}</span>
                        <LocaleSwitcher locale={locale} />
                    </div>
                </div>
            </header>
            <main id="main">{children}</main>
            <footer className="border-t border-line bg-surface px-6 py-8 text-center text-xs text-muted">
                EPISODE HOLDING · {translate(locale, 'privacy')}
            </footer>
        </div>
    );
}
