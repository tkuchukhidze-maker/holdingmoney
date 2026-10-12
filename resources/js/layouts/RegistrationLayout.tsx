import type { PropsWithChildren } from 'react';
import { HoldingLayout } from '@/layouts/HoldingLayout';

export function RegistrationLayout({ children }: PropsWithChildren) {
    return <HoldingLayout title="My Episode · რეგისტრაცია">{children}</HoldingLayout>;
}
