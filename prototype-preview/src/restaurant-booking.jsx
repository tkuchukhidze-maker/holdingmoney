import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { menuFor } from './menu-data.js';
import { readPlan, savePlan, draftLines, draftTotal, readDraft, saveDraft, MAX_QUANTITY } from './menu-cart.js';
import { MenuPlanner } from './menu-planner.jsx';
import { OCCASIONS } from './menu-planner.js';

export function initialBookingDetails(slug, search = '') {
  const plan = readPlan(slug);
  const params = new URLSearchParams(search);
  const guests = Number(params.get('guests'));
  const time = params.get('time') || '';
  const date = params.get('date') || '';
  return { fullName: '', phone: '', email: '', notes: '', ...plan,
    guests: String(Number.isInteger(guests) && guests >= 1 && guests <= 100 ? guests : plan.guests),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    time: /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '' };
}
export function RestaurantBooking({ slug }) {
  const menu = menuFor(slug);
  const [quantities, setQuantities] = useState(() => readDraft(slug));
  const [details, setDetails] = useState(() => initialBookingDetails(slug, window.location.search));
  const [stage, setStage] = useState('details');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const form = useRef(null); const dialog = useRef(null); const request = useRef(null); const submitting = useRef(false);
  const lines = draftLines(slug, quantities); const total = draftTotal(lines);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tbilisi' }).format(new Date());
  useEffect(() => { if (stage === 'choice') dialog.current?.showModal(); else dialog.current?.close(); }, [stage]);
  useEffect(() => { if (stage === 'planner') document.getElementById('menu-planner')?.scrollIntoView({ block: 'start' }); }, [stage]);
  const update = key => e => { setDetails(d => ({ ...d, [key]: e.target.value })); setError(''); };
  const send = async (withMenu) => {
    if (submitting.current) return;
    if (!form.current.reportValidity()) { setStage('details'); return; }
    if (withMenu && !lines.length) { setStage('choice'); return; }
    const payload = { venue: slug, ...details, guests: Number(details.guests), budget: details.budget || null, menu: withMenu ? lines.map(l => ({ itemId: l.itemId, quantity: l.quantity })) : [] };
    const fingerprint = JSON.stringify(payload);
    if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: crypto.randomUUID() };
    submitting.current = true; setBusy(true); setStage('details'); setError('');
    try {
      const response = await fetch('/api/booking-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...payload, requestId: request.current.id }), signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok || !data.reference) throw new Error(data.message || 'გაგზავნა ვერ მოხერხდა. სცადეთ ხელახლა.');
      setReceipt(data);
      if (withMenu) saveDraft(slug, {});
    } catch (e) {
      setError(e.name === 'TimeoutError' ? 'პასუხი დაგვიანდა. მონაცემები შენარჩუნებულია — სცადეთ ხელახლა; იგივე მოთხოვნა არ გაორმაგდება.' : e.message === 'Failed to fetch' ? 'კავშირი ვერ დამყარდა. მონაცემები შენარჩუნებულია — სცადეთ ხელახლა.' : e.message);
    } finally { submitting.current = false; setBusy(false); }
  };
  const next = () => { if (form.current.reportValidity()) lines.length ? send(true) : setStage('choice'); };
  const changeQuantity = (id, delta) => setQuantities(q => saveDraft(slug, { ...q, [id]: Math.max(0, Math.min(MAX_QUANTITY, (q[id] || 0) + delta)) }));
  return <div className="ec-menu"><header className="ecm-header"><a className="ecm-wordmark" href="/">EPISODE <small>HOLDING</small></a><a href={'/restaurants/' + slug}>← {menu.name}</a></header>
    <main className="ecm-body ep-booking"><div className="ecm-kicker">{menu.city} · {menu.name}</div><h1>ჯავშნის მოთხოვნა</h1>
    {receipt ? <section className="ep-receipt" role="status"><h2>მოთხოვნა მიღებულია</h2><p>ნომერი: <strong>{receipt.reference}</strong></p><p>მენიუ: {receipt.menuIncluded ? 'თან ერთვის' : 'მენიუს გარეშე'}</p><p>ჯავშანი საბოლოოდ დადასტურდება რესტორნის პასუხის შემდეგ.</p><a href={'/restaurants/' + slug}>რესტორნის გვერდზე დაბრუნება</a></section> : <>
    <p>შეავსეთ მონაცემები. შერჩეული მენიუ ჯავშნის მოთხოვნას ავტომატურად დაერთვება.</p>
    <form ref={form} className="ep-fields" onSubmit={e => { e.preventDefault(); next(); }}>
      <label>სახელი და გვარი<input required autoComplete="name" maxLength="120" value={details.fullName} onChange={update('fullName')} /></label>
      <label>ტელეფონი<input required type="tel" autoComplete="tel" pattern="[+0-9 ()-]{7,32}" maxLength="32" value={details.phone} onChange={update('phone')} /></label>
      <label>ელფოსტა (არასავალდებულო)<input type="email" autoComplete="email" maxLength="254" value={details.email} onChange={update('email')} /></label>
      <label>თარიღი<input required type="date" min={today} value={details.date} onChange={update('date')} /></label>
      <label>დრო<input required type="time" value={details.time} onChange={update('time')} /></label>
      <label>სტუმრების რაოდენობა<input required type="number" min="1" max="100" step="1" value={details.guests} onChange={update('guests')} /></label>
      <label>სუფრის ტიპი<select value={details.occasion} onChange={update('occasion')}>{Object.entries(OCCASIONS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>შენიშვნა / ალერგიები<textarea rows="3" maxLength="1000" value={details.notes} onChange={update('notes')} /></label>
    </form>
    <section className="ep-summary"><h2>თქვენი მენიუ</h2>{lines.length ? <><p>{lines.length} დასახელება · <strong>{total.toFixed(2)} ₾</strong> · {Number(details.guests) > 0 ? (total / Number(details.guests)).toFixed(2) : '—'} ₾ / ადამიანი</p><p className="ep-note">სტუმრების რაოდენობის შეცვლა კერძების რაოდენობას ავტომატურად არ ცვლის. სურვილის შემთხვევაში ხელახლა შეადგინეთ მენიუ.</p><ul>{lines.map(l => <li key={l.itemId}><span>{l.name}<small>{l.unitPrice} ₾ / ერთეული</small></span><div className="ecm-quantity"><button type="button" aria-label={l.name + ' შემცირება'} onClick={() => changeQuantity(l.itemId, -1)}>−</button><output>{l.quantity}</output><button type="button" aria-label={l.name + ' დამატება'} onClick={() => changeQuantity(l.itemId, 1)}>+</button></div><b>{l.lineTotal.toFixed(2)} ₾</b></li>)}</ul><button type="button" className="ep-secondary" onClick={() => setQuantities(saveDraft(slug, {}))}>მენიუს მოხსნა</button></> : <p>მენიუ ჯერ არ შეგიდგენიათ.</p>}
      <button type="button" className="ep-secondary" onClick={() => setStage(stage === 'planner' ? 'details' : 'planner')}>მენიუს შედგენა / შეცვლა</button>
    </section>
    {stage === 'planner' && <MenuPlanner slug={slug} guests={details.guests} occasion={details.occasion} onSelect={plan => { savePlan(slug, plan); setQuantities(saveDraft(slug, plan.quantities)); setDetails(d => ({ ...d, guests: String(plan.guests), occasion: plan.occasion, budget: plan.budget })); setStage('details'); setError(''); }} />}
    <p className="ep-note">თანხა საორიენტაციოა. გაგზავნა გადახდას ან საბოლოო ჯავშნის დადასტურებას არ ნიშნავს. საკონტაქტო ინფორმაცია გამოიყენება ამ მოთხოვნაზე პასუხისთვის.</p>
    {error && <p className="ep-error" role="alert">{error}</p>}
    <button type="button" className="ep-submit" disabled={busy} onClick={next}>{busy ? 'იგზავნება…' : lines.length ? 'ჯავშნის გაგზავნა მენიუსთან ერთად' : 'ჯავშნის მოთხოვნის გაგზავნა'}</button>
    <dialog ref={dialog} className="ep-dialog" onCancel={() => setStage('details')}><h2>გსურთ წინასწარ მენიუს შედგენა?</h2><p>შეგიძლიათ აირჩიოთ შეთავაზებული ვარიანტი ან გაგზავნოთ ჯავშნის მოთხოვნა მენიუს გარეშე.</p><button type="button" onClick={() => setStage('planner')}>კი, შევადგინოთ მენიუ</button><button type="button" className="ep-secondary" disabled={busy} onClick={() => send(false)}>არა, გაგზავნა მენიუს გარეშე</button><button type="button" className="ep-secondary" onClick={() => setStage('details')}>უკან დაბრუნება</button></dialog>
    </>}
    </main></div>;
}
export function mountRestaurantBooking(slug) { document.title = 'ჯავშნის მოთხოვნა · ' + menuFor(slug).name; createRoot(document.getElementById('root')).render(<RestaurantBooking slug={slug}/>); }
