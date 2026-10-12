import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './simple-home.module.css';

export const metadata: Metadata = {
  title: 'Episode Holding — შექმენი შენი ეპიზოდი',
  description: 'შექმენი შენი ეპიზოდი — აღმოაჩინე Episode Holding-ის რესტორნები ბათუმში, თბილისში და ქუთაისში, და სასტუმროები თბილისში და თელავში.',
};

const collections = [
  {
    href: '/restaurants',
    title: 'რესტორნები',
    cities: 'ბათუმი · თბილისი · ქუთაისი',
    label: 'აღმოაჩინე',
    image: '772 4 760 333',
  },
  {
    href: '/hotels',
    title: 'სასტუმროები',
    cities: 'თბილისი · თელავი',
    label: 'აღმოაჩინე',
    image: '4 4 760 333',
  },
] as const;

// Approved layout uses existing illustrative imagery until property owners
// supply photos approved for Episode Holding's public site.
function EditorialPhoto({ view, className = '' }: { view: string; className?: string }) {
  return (
    <svg className={className} viewBox={view} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <image href="/holding-interiors.webp" width="1536" height="1024" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className={styles.page} lang="ka">
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroVisual} aria-hidden="true">
          <EditorialPhoto view="4 4 760 333" className={styles.heroPhoto} />
        </div>
        <div className={styles.heroFade} aria-hidden="true" />
        <div className={styles.intro}>
          <p className={styles.eyebrow}>EPISODE HOLDING</p>
          <h1 id="home-title">შექმენი<br />შენი ეპიზოდი</h1>
          <div className={styles.introRule} aria-hidden="true" />
          <p className={styles.description}>რესტორნები და სასტუმროები —<br />ერთი სივრცე, განსაკუთრებული გამოცდილებით.</p>
        </div>

        <nav id="explore" className={styles.collections} aria-label="აირჩიე მიმართულება">
          {collections.map((item) => (
            <Link className={styles.collection} href={item.href} key={item.href}>
              <EditorialPhoto view={item.image} className={styles.collectionPhoto} />
              <span className={styles.collectionShade} aria-hidden="true" />
              <span className={styles.collectionContent}>
                <span className={styles.collectionTitle}>{item.title}</span>
                <span className={styles.collectionCities}>{item.cities}</span>
                <span className={styles.collectionAction}>
                  <span>{item.label}</span>
                  <span className={styles.actionCircle} aria-hidden="true">→</span>
                </span>
              </span>
            </Link>
          ))}
        </nav>
      </section>
      <div className={styles.destinationNote} aria-label="Episode-ის ქალაქები">
        <span className={styles.noteRule} aria-hidden="true" />
        <span className={styles.noteCity}>ბათუმი</span>
        <span aria-hidden="true">·</span>
        <span className={styles.noteCity}>თბილისი</span>
        <span aria-hidden="true">·</span>
        <span className={styles.noteCity}>ქუთაისი</span>
        <span aria-hidden="true">·</span>
        <span className={styles.noteCity}>თელავი</span>
        <span className={styles.noteRule} aria-hidden="true" />
      </div>
      <p className={styles.photoNote}>ფოტოები საილუსტრაციოა</p>
    </div>
  );
}
