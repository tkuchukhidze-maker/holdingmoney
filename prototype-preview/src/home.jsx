import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VENUE_COLLECTIONS } from './venue-collections.js';

const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tbilisi' }).format(new Date());
export function SiteIcon({ name, ...props }) {
  const paths = { arrow: ['M5 12h14', 'm13 6 6 6-6 6'], restaurant: ['M4 3v5a3 3 0 0 0 6 0V3', 'M7 3v18', 'M20 21V3c-4 2-5 7-5 10h5'], hotel: ['M3 21V4h18v17', 'M9 21v-6h6v6', 'M7 8h2m6 0h2M7 11h2m6 0h2'], person: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M4 21v-2a8 8 0 0 1 16 0v2'], calendar: ['M4 5h16v16H4z', 'M8 3v4m8-4v4M4 10h16'], spark: ['m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z'] };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{(paths[name] || paths.arrow).map(d => <path d={d} key={d}/>)}</svg>;
}
export function Home() {
  const [kind, setKind] = useState('restaurants');
  const [restaurant, setRestaurant] = useState('batumi');
  const [hotel, setHotel] = useState('magnolia');
  const [date, setDate] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState('2');
  const collection = VENUE_COLLECTIONS[kind];
  const submit = e => {
    e.preventDefault();
    const params = new URLSearchParams({ ...(date ? { date } : {}), time, guests });
    window.location.assign(kind === 'restaurants' ? `/restaurants/${restaurant}/book?${params}` : `/hotels/${hotel}/book?${new URLSearchParams({ ...(date ? { checkIn: date } : {}), ...(checkOut ? { checkOut } : {}), adults: guests })}`);
  };
  return <div className="eh-home" lang="ka">
    <header className="eh-header">
      <a className="eh-brand" href="/" aria-label="Episode Holding — მთავარი">EPISODE<span>HOLDING</span></a>
      <nav className="eh-desktop-nav" aria-label="მთავარი"><a href="/restaurants">რესტორნები</a><a href="/hotels">სასტუმროები</a><a href="#plan">შეადგინე მენიუ</a></nav>
      <a href="/my-episode" className="eh-profile"><SiteIcon name="person"/><span>My Episode</span></a>
    </header>
    <main className="eh-main">
      <section className="eh-hero">
        <div className="eh-intro"><span className="eh-eyebrow"><span/>შენი შემდეგი ეპიზოდი</span><h1>სად შევქმნათ<br/><em>ახალი მოგონება?</em></h1><p>საყვარელი გემოები, ახალი ადგილები და დრო, რომელიც შენია.</p></div>
        <div className="eh-discover" aria-label="აირჩიეთ გამოცდილება">
          <a className="eh-experience eh-dine" href="/restaurants"><div className="eh-experience-top"><span className="eh-icon-tile"><SiteIcon name="restaurant"/></span><span className="eh-count">3 რესტორანი</span></div><div><span className="eh-card-eyebrow">შევიკრიბოთ სუფრასთან</span><h2>რესტორნები</h2><p>ქართული გემო და შენი საყვარელი გარემო</p></div><span className="eh-circle-arrow"><SiteIcon name="arrow"/></span></a>
          <a className="eh-experience eh-stay" href="/hotels"><div className="eh-experience-top"><span className="eh-icon-tile"><SiteIcon name="hotel"/></span><span className="eh-count">2 სასტუმრო</span></div><div><span className="eh-card-eyebrow">შევცვალოთ ყოველდღიურობა</span><h2>სასტუმროები</h2><p>იპოვე ადგილი შენი შემდეგი დასვენებისთვის</p></div><span className="eh-circle-arrow"><SiteIcon name="arrow"/></span></a>
        </div>
      </section>
      <section className="eh-booking" aria-labelledby="quick-booking">
        <div className="eh-booking-top"><div><span className="eh-eyebrow">ყველაფერი რამდენიმე ნაბიჯში</span><h2 id="quick-booking">დაგეგმე შენი ვიზიტი</h2></div><div className="eh-segment" role="group" aria-label="ვიზიტის ტიპი"><button type="button" aria-pressed={kind === 'restaurants'} onClick={() => setKind('restaurants')}><SiteIcon name="restaurant"/>მაგიდა</button><button type="button" aria-pressed={kind === 'hotels'} onClick={() => setKind('hotels')}><SiteIcon name="hotel"/>ოთახი</button></div></div>
        <form className="eh-quick-form" onSubmit={submit}>
          <label className="eh-field eh-venue"><span>{kind === 'restaurants' ? 'რესტორანი' : 'სასტუმრო'}</span><select aria-label={kind === 'restaurants' ? 'რესტორანი' : 'სასტუმრო'} value={kind === 'restaurants' ? restaurant : hotel} onChange={e => kind === 'restaurants' ? setRestaurant(e.target.value) : setHotel(e.target.value)}>{collection.venues.map(v => <option key={v.slug} value={v.slug}>{v.name} · {v.city}</option>)}</select></label>
          {kind === 'restaurants' && <><label className="eh-field"><span>თარიღი</span><input aria-label="ვიზიტის თარიღი" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} /></label><label className="eh-field"><span>დრო</span><input aria-label="ვიზიტის დრო" type="time" required value={time} onChange={e => setTime(e.target.value)} /></label><label className="eh-field"><span>სტუმრები</span><input aria-label="სტუმრების რაოდენობა" type="number" min="1" max="100" required value={guests} onChange={e => setGuests(e.target.value)} /></label></>}
          {kind === 'hotels' && <><label className="eh-field"><span>შესვლა</span><input aria-label="სასტუმროში შესვლა" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} /></label><label className="eh-field"><span>გასვლა</span><input aria-label="სასტუმროდან გასვლა" type="date" min={date || today()} value={checkOut} onChange={e => setCheckOut(e.target.value)} /></label><label className="eh-field"><span>მოზრდილები</span><input aria-label="მოზრდილების რაოდენობა" type="number" min="1" max="10" required value={guests} onChange={e => setGuests(e.target.value)} /></label></>}
          <button className="eh-primary" type="submit">{kind === 'restaurants' ? 'გაგრძელება' : 'ნომრის შერჩევა'}<SiteIcon name="arrow"/></button>
        </form>
        <p className="eh-hint">{kind === 'restaurants' ? 'შემდეგ ეტაპზე შეგიძლია მენიუც შეადგინო. ჯავშანს რესტორანი დაგიდასტურებს.' : 'შემდეგ ეტაპზე დაგეხმარებით საწოლის ტიპისა და შესაფერისი ნომრის არჩევაში.'}</p>
      </section>
      <section className="eh-plan-banner" id="plan"><span className="eh-icon-tile"><SiteIcon name="spark"/></span><div><span className="eh-eyebrow">სუფრა შენს ბიუჯეტზე</span><h2>მენიუ, რომელიც ყველას შეკრებს</h2><p>მიუთითე სუფრის ტიპი და სტუმრების რაოდენობა. შეადარე 80, 100, 120 ₾-იანი ან შენი ბიუჯეტით შედგენილი ვარიანტები.</p></div><a href="/restaurants/batumi/menu#menu-planner">შევადგინოთ მენიუ<SiteIcon name="arrow"/></a></section>
      <section className="eh-places"><div className="eh-section-heading"><div><span className="eh-eyebrow">EPISODE-ის ადგილები</span><h2>რომელ ქალაქში შევხვდეთ?</h2></div><a href="/restaurants">ყველა რესტორანი <SiteIcon name="arrow"/></a></div><div className="eh-venue-list">{VENUE_COLLECTIONS.restaurants.venues.map(v => <a className="eh-venue-item" key={v.slug} href={v.href}>{v.logo ? <img src={v.logo} alt={v.name + ' — ლოგო'} loading="lazy"/> : <span className="eh-venue-monogram">თ</span>}<div><span>{v.city}</span><h3>{v.name}</h3></div><SiteIcon name="arrow"/></a>)}</div></section>
    </main>
    <footer className="eh-footer"><a className="eh-brand" href="/">EPISODE<span>HOLDING</span></a><span>შექმენი შენი ეპიზოდი.</span><small>© {new Date().getFullYear()} Episode Holding</small></footer>
  </div>;
}
export function mountHome() { document.title = 'Episode Holding — შექმენი შენი ეპიზოდი'; document.body.dataset.episodeScreen = 'Home'; createRoot(document.getElementById('root')).render(<Home/>); }
