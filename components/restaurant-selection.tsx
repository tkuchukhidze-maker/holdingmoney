'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { api, dateOnly, dateTime, Photo, useSite, type Property, type EventItem } from './site';
import styles from './restaurant-selection.module.css';

type AvailabilityState = { available: boolean; remaining: number } | { error: true };
type SearchResult = Record<string, AvailabilityState>;
const MAX_GUESTS = 12;

const locations = [
  { city: 'Batumi', slug: 'batumi', name: 'Batumis Sakhlshi', caption: 'Modern Georgian cuisine by the sea', photo: 'batumi', logo: '/brand/batumis-sakhlshi.png' },
  { city: 'Tbilisi', slug: 'tbilisi', name: 'Tbilisis Sakhlshi', caption: 'A new chapter in the capital', photo: 'hero', logo: '' },
  { city: 'Kutaisi', slug: 'kutaisi', name: 'Kutaisis Sakhli', caption: 'Georgian hospitality in Kutaisi', photo: 'kutaisi', logo: '/brand/kutaisis-sakhlshi.png' },
] as const;

function localFuture(date: string, time: string) {
  // The booking backend interprets the chosen fields in Asia/Tbilisi.
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const hour = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!parts || !hour) return false;
  const localMs = Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(hour[1]) - 4, Number(hour[2]));
  return Number.isFinite(localMs) && localMs > Date.now();
}

function RestaurantCard({
  item, property, events, selectedDate, time, guests, availability,
}: {
  item: typeof locations[number];
  property?: Property;
  events: EventItem[];
  selectedDate: string;
  time: string;
  guests: number;
  availability?: AvailabilityState;
}) {
  const published = events
    .filter(event => event.property_id === property?.id && event.active !== false && dateOnly(event.starts_at) === selectedDate)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const programme = published[0];
  const params = new URLSearchParams({ date: selectedDate, time, guests: String(guests) });
  const href = '/places/' + encodeURIComponent(property?.slug || item.slug) + '?' + params.toString();
  const result = availability;
  const resultIsError = Boolean(result && 'error' in result);
  const resultAvailable = Boolean(result && 'available' in result && result.available);
  const hasResult = Boolean(result && 'available' in result);
  return <Link className={styles.card} href={href} aria-label={'Open '+item.name}>
    <div className={styles.cardPicture}>
      <Photo name={item.photo} />
      <div className={styles.photoShade} aria-hidden="true" />
      {item.logo && <div className={styles.logo} aria-label={item.name + ' brand logo'}>
        <Image src={item.logo} width={92} height={92} alt={item.name + ' logo'} unoptimized />
      </div>}
      {!item.logo && <span className={styles.photoWordmark}>TBILISI</span>}
      <span className={styles.cityPill}>{item.city}</span>
    </div>
    <div className={styles.cardBody}>
      <p className={styles.category}>EPISODE RESTAURANT</p>
      <h2>{property?.name || item.name}</h2>
      <p className={styles.city}><span aria-hidden="true">⌖</span> {item.city}, Georgia</p>
      <p className={styles.description}>{item.caption}</p>
      <div className={styles.programme}>
        <span className={styles.programmeIcon} aria-hidden="true">♫</span>
        <div>
          <p className={styles.programmeLabel}>PROGRAMME FOR SELECTED DATE</p>
          {programme ? <>
            <strong>{programme.title}{property?.is_demo ? ' (sample)' : ''}</strong>
            <span>{dateTime(programme.starts_at)}</span>
          </> : <span>No programme announced for this date</span>}
        </div>
      </div>
      {property?.is_demo && <p className={styles.demo}>Sample venue · Test reservations only</p>}
      {hasResult && <p className={resultAvailable ? styles.available : styles.unavailable} role="status">
        {resultAvailable ? 'Tables available for your selection' : 'No suitable table for these details'}
      </p>}
      {resultIsError && <p className={styles.unavailable} role="status">Availability could not be checked</p>}
      <span className={styles.cardAction}>Explore Restaurant <span aria-hidden="true">↗</span></span>
    </div>
  </Link>;
}

export function RestaurantSelection() {
  const { properties, events, loading, error } = useSite();
  const [date, setDate] = useState(() => dateOnly(Date.now() + 86400000));
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState(2);
  const [searched, setSearched] = useState('');
  const [result, setResult] = useState<SearchResult>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const start = dateOnly();
  const end = dateOnly(Date.now() + 365 * 86400000);
  const signature = date + '|' + time + '|' + guests;
  const activeProperties = properties.filter(p => p.kind === 'restaurant' && p.active !== false);
  const lookup = (city: string) => activeProperties.find(p => p.city.toLowerCase() === city.toLowerCase());

  function invalidate() {
    setSearched('');
    setResult({});
    setFormError('');
  }

  async function findTables(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setResult({});
    setSearched('');
    if (!localFuture(date, time)) {
      setFormError('Choose a future date and time in Georgia.');
      return;
    }
    if (error || !activeProperties.length) {
      setFormError('The reservation service is currently unavailable.');
      return;
    }
    setBusy(true);
    const checks = await Promise.all(activeProperties.map(async p => {
      try {
        const availability = await api<{available:boolean;remaining:number}>('availability', {
          propertyId: p.id, kind: 'table', date, time, duration: 120,
          guests, notes: '', requestKey: crypto.randomUUID(),
        });
        return [p.id, { available: availability.available, remaining: availability.remaining }] as const;
      } catch {
        return [p.id, { error: true }] as const;
      }
    }));
    setResult(Object.fromEntries(checks));
    setSearched(signature);
    setBusy(false);
  }

  return <div className={styles.page} lang="en">
    <header className={styles.intro}>
      <p className={styles.eyebrow}>EPISODE HOLDING · OUR RESTAURANTS</p>
      <h1>Three Cities. <em>Three Stories.</em></h1>
      <p>Discover Georgia’s dining experiences and plan your next Episode.</p>
    </header>

    <form className={styles.findBar} onSubmit={findTables} aria-label="Find an available table">
      <label className={styles.field}><span>Date</span>
        <input type="date" name="date" min={start} max={end} value={date} required onChange={e => {setDate(e.target.value); invalidate();}} />
      </label>
      <label className={styles.field}><span>Time · Georgia (UTC+4)</span>
        <input type="time" name="time" value={time} required onChange={e => {setTime(e.target.value); invalidate();}} />
      </label>
      <label className={styles.field}><span>Guests</span>
        <select name="guests" value={guests} onChange={e => {setGuests(Number(e.target.value)); invalidate();}}>
          {Array.from({ length: MAX_GUESTS }, (_, index) => index + 1).map(n => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
        </select>
      </label>
      <button className={styles.findButton} type="submit" disabled={busy || loading}>{busy ? 'Checking tables…' : 'Find a Table'} <span aria-hidden="true">→</span></button>
    </form>
    {formError && <p className={styles.alert} role="alert">{formError}</p>}

    <section className={styles.places} aria-label="Choose a restaurant">
      <div className={styles.sectionHeading}>
        <div><span className={styles.sectionEyebrow}>THE COLLECTION</span><h2>Choose your restaurant</h2></div>
        <p>Batumi · Tbilisi · Kutaisi</p>
      </div>
      <div className={styles.cards}>
        {locations.map(item => <RestaurantCard
          key={item.city}
          item={item}
          property={lookup(item.city)}
          events={events}
          selectedDate={date}
          time={time}
          guests={guests}
          availability={searched === signature ? result[lookup(item.city)?.id || ''] : undefined}
        />)}
      </div>
      <p className={styles.disclaimer}>Photography is illustrative. Artist programmes are shown only when present in the selected restaurant’s calendar. Availability is confirmed when booking.</p>
    </section>
  </div>;
}
