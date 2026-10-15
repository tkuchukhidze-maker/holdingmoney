import React, { useState } from 'react';
import { OCCASIONS, proposeMenu } from './menu-planner.js';
import { menuFor } from './menu-data.js';

export function MenuPlanner({ slug, guests: initialGuests = 2, occasion: initialOccasion = 'traditional', onSelect }) {
  const [guests, setGuests] = useState(String(initialGuests));
  const [occasion, setOccasion] = useState(initialOccasion);
  const [custom, setCustom] = useState('150');
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const generate = (budgets) => {
    try { setPlans(budgets.map(budget => proposeMenu(slug, { guests, budget, occasion })).filter(Boolean)); setError(''); }
    catch (e) { setPlans([]); setError(e.message); }
  };
  const change = (setter) => e => { setter(e.target.value); setPlans([]); };
  if (!menuFor(slug)?.sections.length) return <section className="ep-planner"><h2>მენიუ მალე დაემატება</h2><p>ამ ფილიალის კატალოგისა და ფასების დამატებამდე ავტომატური შეთავაზებები მიუწვდომელია. შეგიძლიათ გააგზავნოთ ჯავშნის მოთხოვნა მენიუს გარეშე და სურვილები შენიშვნაში მიუთითოთ.</p></section>;
  return <section className="ep-planner" id="menu-planner" aria-label="მენიუს შემდგენელი">
    <div className="ecm-kicker">თქვენი სუფრა · თქვენი ბიუჯეტი</div><h2>შევადგინოთ მენიუ</h2>
    <p>აირჩიეთ სუფრის ტიპი და ადამიანების რაოდენობა — შეადარეთ 80, 100 და 120 ₾-იანი ბიუჯეტის ვარიანტები.</p>
    <div className="ep-fields">
      <label>სუფრის ტიპი<select value={occasion} onChange={change(setOccasion)}>{Object.entries(OCCASIONS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>რამდენ ადამიანზე?<input type="number" min="1" max="100" step="1" value={guests} onChange={change(setGuests)} /></label>
    </div>
    <button type="button" onClick={() => generate([80, 100, 120])}>შემომთავაზეთ 3 მენიუ</button>
    <div className="ep-custom"><label>სხვა ბიუჯეტი ერთ ადამიანზე (₾)<input type="number" min="80" max="1000" step="1" value={custom} onChange={change(setCustom)} /></label><button type="button" className="ep-secondary" onClick={() => generate([Number(custom)])}>ამ ბიუჯეტით შედგენა</button></div>
    <p className="ep-note">თანხები საორიენტაციოა. რაოდენობა აღნიშნავს მენიუში მითითებულ ერთეულებს; სუფრაზე განაწილება და პორციები რესტორანთან ზუსტდება. ალკოჰოლი არ შედის. ალერგიები და კვებითი შეზღუდვები მიუთითეთ შენიშვნაში.</p>
    {error && <p role="alert">{error}</p>}
    <div className="ep-plans" aria-live="polite">{plans.map(plan => <article key={plan.budget} className="ep-plan">
      <div className="ecm-kicker">ბიუჯეტი {plan.budget} ₾ / ადამიანი</div><h3>{plan.perPerson.toFixed(2)} ₾ <small>/ ადამიანი</small></h3>
      <p>{plan.guests} სტუმარი · სულ <strong>{plan.total.toFixed(2)} ₾</strong></p>
      <ul>{plan.lines.map(line => <li key={line.itemId}><span>{line.name} × {line.quantity}</span><b>{line.lineTotal.toFixed(2)} ₾</b></li>)}</ul>
      <button type="button" onClick={() => onSelect(plan)}>ამ მენიუს არჩევა</button>
    </article>)}</div>
  </section>;
}
