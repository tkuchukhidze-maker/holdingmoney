import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BED_PREFERENCES, STAY_PURPOSES, hotelFor, recommendRooms, stayNights } from './hotel-rooms.js';

const dateToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tbilisi' }).format(new Date());
export function HotelBooking({ slug }) {
  const hotel = hotelFor(slug);
  const query = new URLSearchParams(window.location.search);
  const number = (key, fallback, min, max) => { const n = Number(query.get(key)); return Number.isInteger(n) && n >= min && n <= max ? String(n) : fallback; };
  const [preferences, setPreferences] = useState({ adults: number('adults', '2', 1, 10), children: '0', roomCount: '1', bed: 'any', purpose: 'leisure' });
  const [checkIn, setCheckIn] = useState(/^\d{4}-\d{2}-\d{2}$/.test(query.get('checkIn') || '') ? query.get('checkIn') : '');
  const [checkOut, setCheckOut] = useState(/^\d{4}-\d{2}-\d{2}$/.test(query.get('checkOut') || '') ? query.get('checkOut') : '');
  const [matches, setMatches] = useState(null); const [selected, setSelected] = useState(null);
  const [contact, setContact] = useState({ fullName: '', phone: '', email: '', notes: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [receipt, setReceipt] = useState(null);
  const criteria = useRef(null); const contactForm = useRef(null); const request = useRef(null); const submitting = useRef(false);
  const nights = stayNights(checkIn, checkOut);
  useEffect(() => { if (selected) document.getElementById('hotel-contact')?.scrollIntoView({ block: 'start' }); }, [selected]);
  const update = key => e => { setPreferences(p => ({ ...p, [key]: e.target.value })); setMatches(null); setSelected(null); setError(''); };
  const search = e => {
    e.preventDefault(); if (!criteria.current.reportValidity()) return;
    if (!nights) { setError('გასვლის თარიღი უნდა იყოს შესვლის შემდეგ; მაქსიმუმ 365 ღამე.'); return; }
    try { setMatches(recommendRooms(slug, preferences)); setSelected(null); setError(''); }
    catch (e) { setError(e.message); }
  };
  const send = async e => {
    e.preventDefault(); if (submitting.current || !selected) return;
    if (!criteria.current.reportValidity() || !contactForm.current.reportValidity() || !nights) return;
    const payload = { venue: slug, ...contact, checkIn, checkOut, adults: Number(preferences.adults), children: Number(preferences.children), roomCount: Number(preferences.roomCount), bed: preferences.bed, purpose: preferences.purpose, roomId: selected === 'assist' ? null : selected };
    const fingerprint = JSON.stringify(payload); if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: crypto.randomUUID() };
    submitting.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/hotel-booking-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...payload, requestId: request.current.id }), signal: AbortSignal.timeout(20000) });
      const data = await response.json(); if (!response.ok || !data.reference) throw new Error(data.message || 'გაგზავნა ვერ მოხერხდა.');
      setReceipt(data);
    } catch (e) { setError(e.name === 'TimeoutError' ? 'პასუხი დაგვიანდა. მონაცემები შენარჩუნებულია; ხელახლა ცდა მოთხოვნას არ გააორმაგებს.' : e.message === 'Failed to fetch' ? 'კავშირი ვერ დამყარდა. მონაცემები შენარჩუნებულია.' : e.message); }
    finally { submitting.current = false; setBusy(false); }
  };
  const room = hotel.rooms.find(r => r.id === selected);
  return <div className="ec-menu"><header className="ecm-header"><a className="ecm-wordmark" href="/">EPISODE <small>HOLDING</small></a><a href={'/hotels/' + slug}>← {hotel.name}</a></header><main className="ecm-body ep-booking eh-room-helper">
    <span className="eh-eyebrow">{hotel.name} · {hotel.city}</span><h1>ვიპოვოთ შენი ნომერი</h1>
    {receipt ? <section className="ep-receipt" role="status"><h2>მოთხოვნა მიღებულია</h2><p>ნომერი: <strong>{receipt.reference}</strong></p><p>შერჩეული ნომერი და ვიზიტის დეტალები სასტუმროს გადაეცა. ფასსა და თავისუფალ ადგილს სასტუმრო დაგიდასტურებთ.</p><a href={'/hotels/' + slug}>სასტუმროს გვერდზე დაბრუნება</a></section> : <>
    <p>მოგვიყევი შენი ვიზიტის შესახებ — შევადარებთ ნომრის ტიპებს და დაგეხმარებით არჩევანში.</p>
    <form ref={criteria} onSubmit={search} className="ep-planner">
      <div className="ep-fields"><label>შესვლის თარიღი<input required type="date" min={dateToday()} value={checkIn} onChange={e => { setCheckIn(e.target.value); setMatches(null); setSelected(null); }} /></label><label>გასვლის თარიღი<input required type="date" min={checkIn || dateToday()} value={checkOut} onChange={e => { setCheckOut(e.target.value); setMatches(null); setSelected(null); }} /></label>
      <label>მოზრდილები<input required type="number" min="1" max="10" step="1" value={preferences.adults} onChange={update('adults')} /></label><label>ბავშვები<input required type="number" min="0" max="9" step="1" value={preferences.children} onChange={update('children')} /></label><label>ნომრების რაოდენობა<input required type="number" min="1" max="5" step="1" value={preferences.roomCount} onChange={update('roomCount')} /></label>
      <label>საწოლის ტიპი<select aria-label="საწოლის ტიპი" value={preferences.bed} onChange={update('bed')}>{Object.entries(BED_PREFERENCES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>ვიზიტის მიზანი<select aria-label="ვიზიტის მიზანი" value={preferences.purpose} onChange={update('purpose')}>{Object.entries(STAY_PURPOSES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
      {nights > 0 && <p className="ep-note">{nights} ღამე · {Number(preferences.adults) + Number(preferences.children)} სტუმარი</p>}
      <button type="submit">შემირჩიეთ ნომერი</button><p className="ep-note">რეკომენდაცია ეფუძნება ნომრის ტიპსა და ტევადობას. ფასი, დამატებითი საწოლი, ბავშვების განთავსება და ხელმისაწვდომობა სასტუმროსთან ზუსტდება.</p>
    </form>
    {matches && <section className="eh-room-results" aria-live="polite"><h2>თქვენი ვიზიტისთვის</h2>
      {matches.missingCatalog ? <p>ამ სასტუმროს ნომრების კატალოგი ჯერ არ არის დამატებული. თქვენს თარიღებსა და სურვილებს სასტუმროს გადავცემთ, რომ შესაბამისი ნომერი შემოგთავაზოთ.</p> : matches.options.length ? <div className="eh-room-grid">{matches.options.map((r, i) => <article className="eh-room-card" key={r.id}>
      <span className="eh-eyebrow">{i === 0 ? 'საუკეთესო შესაბამისობა' : 'ალტერნატივა'}</span><h3>{r.name}</h3><p>{r.bedLabel}</p><p>{r.reason}</p>{r.view && <p>{r.view}</p>}<small>ფასი და ხელმისაწვდომობა დასადასტურებელია</small><button type="button" className={selected === r.id ? '' : 'ep-secondary'} onClick={() => setSelected(r.id)} aria-pressed={selected === r.id}>{selected === r.id ? 'არჩეულია' : 'ამ ნომრის არჩევა'}</button></article>)}</div> : <div className="ep-summary"><p>მითითებული სტუმრების რაოდენობისა და საწოლის ტიპისთვის ამდენ ნომერში შესაბამისი ვარიანტი ვერ მოიძებნა.</p>{matches.suggestedRooms > Number(preferences.roomCount) && matches.suggestedRooms <= 5 && <button type="button" className="ep-secondary" onClick={() => { const next = { ...preferences, roomCount: String(matches.suggestedRooms) }; setPreferences(next); setMatches(recommendRooms(slug, next)); setSelected(null); }}>განვიხილოთ {matches.suggestedRooms} ნომერი</button>}</div>}
      <button type="button" className="ep-secondary" onClick={() => setSelected('assist')}>შერჩევაში სასტუმრო დამეხმაროს</button>
    </section>}
    {selected && <section className="ep-summary" id="hotel-contact"><span className="eh-eyebrow">თქვენი არჩევანი</span><h2>{room?.name || 'ნომრის შერჩევა სასტუმროს დახმარებით'}</h2><p>{checkIn} — {checkOut} · {nights} ღამე · {preferences.roomCount} ნომერი · {Number(preferences.adults) + Number(preferences.children)} სტუმარი</p><form ref={contactForm} onSubmit={send}><div className="ep-fields">
      <label>სახელი და გვარი<input required autoComplete="name" maxLength="120" value={contact.fullName} onChange={e => setContact(c => ({ ...c, fullName: e.target.value }))} /></label><label>ტელეფონი<input required type="tel" autoComplete="tel" pattern="[+0-9 ()-]{7,32}" maxLength="32" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} /></label><label>ელფოსტა (არასავალდებულო)<input type="email" autoComplete="email" maxLength="254" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} /></label><label>შენიშვნა / ბავშვების ასაკი<textarea maxLength="1000" rows="3" value={contact.notes} onChange={e => setContact(c => ({ ...c, notes: e.target.value }))} /></label></div><p className="ep-note">გაიგზავნება მოთხოვნა არჩეული ტიპითა და ვიზიტის დეტალებით. ჯავშანი და ფასი ძალაში შევა სასტუმროს დადასტურების შემდეგ.</p><button type="submit" disabled={busy}>{busy ? 'იგზავნება…' : 'მოთხოვნის გაგზავნა სასტუმროში'}</button></form></section>}
    {error && <p className="ep-error" role="alert">{error}</p>}
    </>}
  </main></div>;
}
export function mountHotelBooking(slug) { document.title = 'ნომრის შერჩევა · ' + hotelFor(slug).name; createRoot(document.getElementById('root')).render(<HotelBooking slug={slug}/>); }
