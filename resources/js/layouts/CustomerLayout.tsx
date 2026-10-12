import type { PropsWithChildren } from 'react';
import { HoldingLayout } from '@/layouts/HoldingLayout';

export function CustomerLayout({ children }: PropsWithChildren) {
    return <HoldingLayout title="My Episode">{children}</HoldingLayout>;
}
