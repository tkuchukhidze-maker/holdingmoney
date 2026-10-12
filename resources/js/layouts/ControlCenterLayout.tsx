import type { PropsWithChildren } from 'react';
import { HoldingLayout } from '@/layouts/HoldingLayout';

export function ControlCenterLayout({ children }: PropsWithChildren) {
    return <HoldingLayout title="Episode Control Center">{children}</HoldingLayout>;
}
