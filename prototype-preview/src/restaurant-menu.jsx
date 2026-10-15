import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { menuFor } from './menu-data.js';
import { giftPreview, offerForVenue } from './daily-offers.js';
import { draftLines, draftTotal, makeRequestText, readDraft, saveDraft } from './menu-cart.js';
import { fetchCustomerProfile, contactFromProfile } from './customer-profile.js';

const GROUPS = [
  { key: 'food', name: 'კერძები' },
  { key: 'bar', name: 'ბარი და კოქტეილები' },
  { key: 'wine', name: 'ღვინო' },
];
const fmt = (price) => Number(price).toLocaleString('ka-GE', { minimumFractionDigits: price % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' ₾';

export function RestaurantMenu({ slug }) {
  const menu = menuFor(slug);
  const [quantities, setQuantities] = useState(() => readDraft(slug));
  const [group, setGroup] = useState('food');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState({ fullName: '', phone: '', email: '' });
  const [accountProfile, setAccountProfile] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchCustomerProfile(fetch, { signal: controller.signal }).then((profile) => {
      if (controller.signal.aborted) return;
      setAccountProfile(profile);
      if (profile) setContact((current) => contactFromProfile(profile, current));
    });
    return () => controller.abort();
  }, []);
  const [feedback, setFeedback] = useState('');
  const detailsForm = useRef(null);
  const [clearedDraft, setClearedDraft] = useState(null);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tbilisi' });

  const lines = useMemo(() => draftLines(slug, quantities), [slug, quantities]);
  const offer = offerForVenue(slug);
  const khinkaliCount = lines.filter((line) => line.itemId.startsWith('khinkali-')).reduce((n, line) => n + line.quantity, 0);
  const illustrativeGifts = giftPreview(khinkaliCount, offer);
  const sum = draftTotal(lines);
  const totalCount = lines.reduce((n, item) => n + item.quantity, 0);
  const sections = useMemo(() => {
    if (!menu) return [];
    return menu.sections.filter(s => s.group === group && (category === 'all' || s.id === category))
      .map(s => ({ ...s, items: s.items.filter(i => i.name.toLocaleLowerCase('ka-GE').includes(query.trim().toLocaleLowerCase('ka-GE'))) }))
      .filter(s => s.items.length);
  }, [menu, group, category, query]);
  const categories = (menu?.sections || []).filter(s => s.group === group);

  const change = (id, delta) => {
    setQuantities(prev => {
      const count = prev[id] || 0;
      const next = { ...prev };
      const updated = Math.min(30, Math.max(0, count + delta));
      if (updated) next[id] = updated;
      else delete next[id];
      return saveDraft(slug, next);
    });
    setFeedback('');
    setClearedDraft(null);
  };
  const clear = () => { setClearedDraft(quantities); setQuantities(saveDraft(slug, {})); setFeedback('მენიუს მონახაზი გასუფთავებულია.'); };
  const undoClear = () => { setQuantities(saveDraft(slug, clearedDraft)); setClearedDraft(null); setFeedback('მენიუს არჩევანი აღდგენილია.'); };
  const details = { date, time, guests, notes, ...contact };
  const compose = () => {
    if (!lines.length) { setFeedback('აირჩიეთ მინიმუმ ერთი კერძი.'); return null; }
    if (!detailsForm.current?.reportValidity()) return null;
    return makeRequestText(slug, quantities, details);
  };
  const copy = async () => {
    const text = compose();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setFeedback('მოთხოვნის ტექსტი დაკოპირებულია. ეს ჯავშნის გაგზავნას არ ნიშნავს.');
    } catch {
      setFeedback('კოპირება ვერ მოხერხდა. გამოიყენეთ „ტექსტის ჩვენება“.');
      setShowText(true);
    }
  };
  const [showText, setShowText] = useState(false);
  const share = async () => {
    const text = compose();
    if (!text) return;
    if (!navigator.share) {
      setShowText(true);
      setFeedback('ამ ბრაუზერში გაზიარება მიუწვდომელია; მოთხოვნის ტექსტი იხილეთ ქვემოთ.');
      return;
    }
    try {
      await navigator.share({ title: menu.name + ' — მენიუს მონახაზი', text });
      setFeedback('გაზიარების ფანჯარა დაიხურა. ეს რესტორნის მიერ ჯავშნის მიღებას არ ადასტურებს.');
    } catch (error) {
      if (error?.name !== 'AbortError') setFeedback('გაზიარება ვერ შესრულდა; შეგიძლიათ ტექსტი დააკოპიროთ.');
    }
  };

  return <div className="ec-menu" lang="ka">
    <header className="ecm-header">
      <a className="ecm-wordmark" href="/" aria-label="Episode Holding — მთავარი">EPISODE <small>HOLDING</small></a>
      <nav aria-label="მენიუს ნავიგაცია">
        <a href="/restaurants">რესტორნები</a>
        <a href={'/restaurants/' + slug}>რესტორნის გვერდი</a>
        <a href={'/restaurants/' + slug + '#booking'}>ჯავშნის ფორმა</a>
      </nav>
    </header>
    <main className="ecm-body">
      <div className="ecm-crumb"><a href="/">მთავარი</a> / <a href="/restaurants">რესტორნები</a> / <a href={'/restaurants/' + slug}>{menu.name}</a> / მენიუ</div>
      <div className="ecm-intro">
        <div><div className="ecm-kicker">EPISODE RESTAURANT MENU</div><h1>{menu.name}</h1><p>სრული მენიუ · {menu.city}</p></div>
        <a className="ecm-outline" href={'/restaurants/' + slug + '#booking'}>ჯავშნის ფორმაზე დაბრუნება <span aria-hidden="true">↗</span></a>
      </div>
      <div className="ecm-photo-hero">
        <img src={slug === 'batumi' ? '/photos/batumi.webp' : slug === 'kutaisi' ? '/photos/kutaisi.webp' : '/photos/holding-interiors.webp'} alt={'საილუსტრაციო ფოტო — ' + menu.name} loading="eager" fetchPriority="high"/>
        <span>Episode Holding · {menu.city} · საილუსტრაციო ფოტო</span>
      </div>
      {offer && <section className="ecm-offer-preview" id="daily-offer" aria-label="დღის შეთავაზების პროექტი">
        <img src="/photos/holding-interiors.webp" alt="საილუსტრაციო ფოტო — რესტორნის გარემო" loading="lazy" />
        <div>
          <span className="ecm-not-live">შეთავაზების პროექტი — ჯერ არ მოქმედებს</span>
          <strong>{offer.title}</strong>
          <p>{offer.startTime}–{offer.endTime} · {offer.subtitle}</p>
          {khinkaliCount > 0 && <p>არჩეული ხინკალი: {khinkaliCount} · პირობითი საჩუქარი: {illustrativeGifts} ლუდი (მხოლოდ მაგალითი)</p>}
          <small>თარიღები, ფილიალის მონაწილეობა, პორცია და პირობები დასადასტურებელია. ალკოჰოლი მხოლოდ სრულწლოვნებისთვის. საჩუქარი კალათას არ ემატება და ფასს არ ცვლის.</small>
        </div>
      </section>}
      {!menu.sections.length ? <section className="ecm-empty">
        <h2>ამ ფილიალის სრული მენიუ ჯერ არ არის ატვირთული</h2>
        <p>კერძებსა და ფასებს არ ვაკოპირებთ სხვა რესტორნიდან. მენიუ გამოჩნდება მხოლოდ ამ ფილიალისთვის დამტკიცებული მონაცემების დამატების შემდეგ.</p>
        <a href={'/restaurants/' + slug}>რესტორნის გვერდზე დაბრუნება →</a>
      </section> : <>
        <div className="ecm-source">მენიუ მომზადებულია არსებული დოკუმენტების მიხედვით. ფასები მოცემულია ლარში და შეიცავს მომსახურების ღირებულებას. საბოლოო ფასები და ხელმისაწვდომობა გადაამოწმეთ რესტორანთან.</div>
        <div className="ecm-columns">
          <div className="ecm-list">
            <div className="ecm-tabs" role="group" aria-label="მენიუს განყოფილება">{GROUPS.map(g => <button type="button" key={g.key} aria-pressed={group === g.key} onClick={() => { setGroup(g.key); setCategory('all'); setQuery(''); }}>{g.name}</button>)}</div>
            <div className="ecm-controls">
              <label className="ecm-search">მენიუში ძებნა<input type="search" placeholder="მოძებნეთ კერძი ან სასმელი" value={query} onChange={e => setQuery(e.target.value)}/></label>
              <label className="ecm-category">კატეგორია<select value={category} onChange={e => setCategory(e.target.value)}><option value="all">ყველა კატეგორია</option>{categories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
            </div>
            {sections.length ? sections.map(s => <section className="ecm-section" key={s.id} aria-label={s.title}>
              <h2>{s.title}</h2>
              <div className="ecm-rows">{s.items.map(item => <div key={item.id} className="ecm-item">
                <div><h3>{item.name}</h3><span>{fmt(item.price)}</span></div>
                <div className="ecm-quantity">
                  <button aria-label={item.name + ' — რაოდენობის შემცირება'} type="button" disabled={!quantities[item.id]} onClick={() => change(item.id, -1)}>−</button>
                  <output aria-label={item.name + ' რაოდენობა'}>{quantities[item.id] || 0}</output>
                  <button aria-label={item.name + ' — რაოდენობის გაზრდა'} type="button" disabled={(quantities[item.id] || 0) >= 30} onClick={() => change(item.id, 1)}>+</button>
                </div>
              </div>)}</div>
            </section>) : <div className="ecm-noresults">ამ კატეგორიაში ამ სახელით კერძი ვერ მოიძებნა.</div>}
          </div>
          <aside id="menu-basket" className="ecm-basket" aria-label="მენიუს არჩევანი">
            <div className="ecm-basket-head"><h2>მენიუს მონახაზი</h2><span>{totalCount} ერთეული</span></div>
            <div className="ecm-selected"><strong>არჩეული ფილიალი</strong><p>{menu.name} · {menu.city}</p></div>
            {lines.length ? <ul className="ecm-lines">{lines.map(l => <li key={l.itemId}><span>{l.name} × {l.quantity}</span><b>{fmt(l.lineTotal)}</b></li>)}</ul> : <p className="ecm-placeholder">კერძების ან სასმელების დასამატებლად დააჭირეთ „+“-ს.</p>}
            <div className="ecm-total"><span>მენიუს საორიენტაციო ჯამი</span><strong>{fmt(sum)}</strong></div>
            <form ref={detailsForm} className="ecm-draftfields" onSubmit={e => e.preventDefault()}>
              <h3>ჯავშნის მონაცემები</h3>
              {accountProfile ? <p className="ecm-profile-note" role="status">შესული ხართ როგორც <strong>{accountProfile.fullName}</strong> — პროფილის საკონტაქტო მონაცემები ავტომატურად ჩაიწერა. საჭიროების შემთხვევაში შეგიძლიათ შეცვალოთ.</p> : <p className="ecm-profile-note">თუ Episode ანგარიშში შესული ხართ, თქვენი სახელი, გვარი და დადასტურებული კონტაქტები ავტომატურად შეივსება. სხვა შემთხვევაში შეავსეთ საკონტაქტო მონაცემები.</p>}
              <label>სახელი და გვარი<input type="text" autoComplete="name" value={contact.fullName} onChange={e => setContact(c => ({ ...c, fullName: e.target.value }))} maxLength={240} placeholder="სახელი და გვარი" /></label>
              <label>ტელეფონი<input type="tel" autoComplete="tel" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} maxLength={32} placeholder="+995 ..." /></label>
              <label>ელფოსტა<input type="email" autoComplete="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} maxLength={254} placeholder="example@email.com" /></label>
              <label>თარიღი<input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} /></label>
              <label>დრო<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
              <label>სტუმრების რაოდენობა<input type="number" required step="1" inputMode="numeric" min="1" max="100" value={guests} onChange={e => setGuests(e.target.value)} /></label>
              <label>შენიშვნა<textarea rows="2" maxLength="240" placeholder="მაგ., ალერგენები, კერძების მირთმევის დრო" value={notes} onChange={e => setNotes(e.target.value)}/></label>
            </form>
            <p className="ecm-disclaimer">ეს არის ჯავშანთან გასაგზავნი მენიუს <strong>მონახაზი</strong>. მოთხოვნა რესტორანში ავტომატურად არ იგზავნება და ჯავშანს არ ქმნის.</p>
            <div className="ecm-actions">
              <button type="button" onClick={copy} disabled={!lines.length}>მოთხოვნის კოპირება</button>
              <button type="button" className="ecm-secondary" onClick={share} disabled={!lines.length}>მოთხოვნის გაზიარება</button>
              <button type="button" className="ecm-textbutton" onClick={() => { if (showText || compose()) setShowText(v => !v); }} disabled={!lines.length}>{showText ? 'ტექსტის დამალვა' : 'ტექსტის ჩვენება'}</button>
              {clearedDraft && <button type="button" className="ecm-secondary" onClick={undoClear}>გასუფთავების გაუქმება</button>}
              <button type="button" className="ecm-textbutton ecm-clear" onClick={clear} disabled={!lines.length}>არჩევანის გასუფთავება</button>
            </div>
            {feedback && <p className="ecm-feedback" role="status">{feedback}</p>}
            {showText && !!lines.length && <textarea className="ecm-export" readOnly rows="12" value={makeRequestText(slug, quantities, details)} aria-label="სრული მოთხოვნის ტექსტი" />}
            <a className="ecm-back" href={'/restaurants/' + slug + '#booking'}>რესტორნის ჯავშნის გვერდზე გადასვლა →</a>
          </aside>
        </div>
      </>}
      {!!menu.sections.length && <a href="#menu-basket" className="ecm-mobile-cart" aria-label="არჩეული მენიუს კალათის ნახვა">
        <span>კალათა · {totalCount} ერთეული</span><strong>{fmt(sum)} ↑</strong>
      </a>}
    </main>
    <footer className="ecm-footer">© Episode Holding · <a href="/restaurants">ყველა რესტორანი</a></footer>
  </div>;
}

export function mountRestaurantMenu(slug) {
  const menu = menuFor(slug);
  if (!menu) throw new Error('Unknown restaurant menu: ' + slug);
  document.title = 'მენიუ — ' + menu.name + ' · Episode Holding';
  createRoot(document.getElementById('root')).render(<RestaurantMenu slug={slug}/>);
}
