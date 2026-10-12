import type { Metadata } from 'next';
import './globals.css';
import { SiteProvider } from '../components/site';
export const metadata: Metadata = {
  title: 'Episode Holding — One account. Every experience.',
  description: 'Restaurants, hotels and experiences across Georgia. One Episode account.',
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><SiteProvider>{children}</SiteProvider></body></html>;
}
