import { usePage } from '@inertiajs/react';
import { HoldingLayout } from '@/layouts/HoldingLayout';
import { translate } from '@/i18n';
import type { SharedPageProps } from '@/types/page';

export default function Home() {
    const { locale } = usePage<SharedPageProps>().props;

    return (
        <HoldingLayout>
            <section className="mx-auto flex min-h-[65vh] max-w-6xl flex-col justify-center gap-7 px-6 py-20 lg:px-12">
                <p className="text-xs font-bold uppercase tracking-[.24em] text-accent-holding">
                    Episode Holding
                </p>
                <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                    {translate(locale, 'headline')}
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-muted">
                    {translate(locale, 'summary')}
                </p>
                <div className="max-w-2xl border-l-4 border-accent-holding bg-surface p-6">
                    <p className="font-semibold">{translate(locale, 'foundation')}</p>
                    <p className="mt-2 text-sm text-muted">{translate(locale, 'phaseInfo')}</p>
                    <p className="mt-4 text-xs text-muted">{translate(locale, 'primaryAction')}</p>
                </div>
            </section>
        </HoldingLayout>
    );
}
