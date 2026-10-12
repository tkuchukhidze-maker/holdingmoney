'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import styles from './dashboard-demo.module.css';

type View='operations'|'guest';
type Tab='overview'|'reservations'|'inventory'|'events'|'offers';
type Status='all'|'confirmed'|'pending'|'cancelled';

const venues=[
  {id:'batumi',name:'ბათუმის სახლში',type:'რესტორანი',city:'ბათუმი'},
  {id:'kutaisi',name:'ქუთაისის სახლში',type:'რესტორანი',city:'ქუთაისი'},
  {id:'magnolia',name:'Hotel Magnolia',type:'სასტუმრო',city:'თბილისი'},
  {id:'mere',name:'Chateau Mere',type:'სასტუმრო',city:'თელავი'},
] as const;
const bookings=[
 {id:'EP-1042',venue:'batumi',guest:'სატესტო სტუმარი 01',date:'12 ოქტ, 19:00',guests:4,status:'confirmed' as const},
 {id:'EP-1041',venue:'magnolia',guest:'სატესტო სტუმარი 02',date:'13–15 ოქტ',guests:2,status:'pending' as const},
 {id:'EP-1040',venue:'kutaisi',guest:'სატესტო სტუმარი 03',date:'14 ოქტ, 20:00',guests:6,status:'confirmed' as const},
 {id:'EP-1039',venue:'batumi',guest:'სატესტო სტუმარი 04',date:'11 ოქტ, 18:30',guests:2,status:'cancelled' as const},
 {id:'EP-1038',venue:'mere',guest:'სატესტო სტუმარი 05',date:'18–20 ოქტ',guests:2,status:'pending' as const},
];
const events=[
 {name:'ქართული ცოცხალი მუსიკა',venue:'ბათუმის სახლში',date:'12 ოქტომბერი · 20:00',status:'გამოსაქვეყნებელი'},
 {name:'ქართული საღამო',venue:'ქუთაისის სახლში',date:'13 ოქტომბერი · 20:00',status:'სატესტო'},
 {name:'სპეციალური საღამო',venue:'ბათუმის სახლში',date:'18 ოქტომბერი · 21:00',status:'სატესტო'},
];
const offers=[
 {name:'Romantic Getaway',venue:'Hotel Magnolia',detail:'სასტუმროს პაკეტის მაგალითი',status:'დრაფტი'},
 {name:'Longer Stay',venue:'Hotel Magnolia',detail:'რამდენიმე ღამით დარჩენის შეთავაზება',status:'დრაფტი'},
 {name:'Group Dinner',venue:'ბათუმის სახლში',detail:'ჯგუფური ვიზიტის შეთავაზება',status:'დრაფტი'},
];

const labelStatus:Record<Exclude<Status,'all'>,string>={confirmed:'დადასტურებული',pending:'მოლოდინში',cancelled:'გაუქმებული'};
const statusClass:Record<Exclude<Status,'all'>,string>={confirmed:'success',pending:'pending',cancelled:'muted'};
const venueName=(id:string)=>venues.find(p=>p.id===id)?.name||id;

function Header({view,setView}:{view:View;setView:(v:View)=>void}){
 return <header className={styles.header}>
   <div className={styles.identity}><span className={styles.logoMark}>E.</span><span><strong>EPISODE</strong><small>HOLDING · DASHBOARD PREVIEW</small></span></div>
   <div className={styles.topActions}><div className={styles.switcher} aria-label="აირჩიე დეშბორდი"><button aria-pressed={view==='operations'} className={view==='operations'?styles.selected:''} onClick={()=>setView('operations')}>მართვა</button><button aria-pressed={view==='guest'} className={view==='guest'?styles.selected:''} onClick={()=>setView('guest')}>სტუმარი</button></div><Link href="/" className={styles.exit}>საიტზე დაბრუნება ↗</Link></div>
 </header>
}

export function DashboardDemo(){
 const [view,setView]=useState<View>('operations');
 const [tab,setTab]=useState<Tab>('overview');
 const [venue,setVenue]=useState('all');
 const [status,setStatus]=useState<Status>('all');
 const [search,setSearch]=useState('');
 const [showInfo,setShowInfo]=useState(true);
 const filtered=useMemo(()=>bookings.filter(b=>(venue==='all'||b.venue===venue)&&(status==='all'||b.status===status)&&[b.guest,b.id,venueName(b.venue)].join(' ').toLowerCase().includes(search.toLowerCase())),[venue,status,search]);
 const nav:[Tab,string,string][]=[['overview','მიმოხილვა','◫'],['reservations','ჯავშნები','▦'],['inventory','მაგიდები / ნომრები','▤'],['events','ღონისძიებები','♫'],['offers','აქციები','✧']];
 const navigate=(t:Tab)=>{setTab(t);setSearch('');setStatus('all');};
 return <div className={styles.shell} lang="ka"><Header view={view} setView={v=>{setView(v);navigate('overview');}}/>
 <div className={styles.layout}>
  <aside className={styles.sidebar}>
    <p className={styles.sideTitle}>WORKSPACE</p>
    {view==='operations'?<nav className={styles.nav} aria-label="დეშბორდის სექციები">
     {nav.map(([t,name,icon])=><button type="button" key={t} className={t===tab?styles.navActive:''} aria-current={t===tab?'page':undefined} onClick={()=>navigate(t)}><span aria-hidden="true">{icon}</span>{name}</button>)}
    </nav>:<nav className={styles.nav}><button className={styles.navActive}>◫ &nbsp; ჩემი ანგარიში</button><button onClick={()=>setView('operations')}>▦ &nbsp; ადმინისტრაციის დემო</button></nav>}
    <div className={styles.sidebarBottom}><span>EPISODE GROUP</span><small>მხოლოდ ვიზუალური სატესტო რეჟიმი</small><Link href="/auth">რეგისტრაციის გვერდი ↗</Link></div>
  </aside>
  <main className={styles.main}>
   <div className={styles.breadcrumb}>EPISODE / {view==='guest'?'MY ACCOUNT':nav.find(n=>n[0]===tab)?.[1]}</div>
   {showInfo&&<section className={styles.demoNotice} role="status"><span className={styles.noticeDot}>●</span><div><strong>DEMO MODE — მონაცემები გამოგონილია</strong><p>ეს არის მართვის სისტემის ინტერაქტიული ვიზუალური პრევიუ. აქ ცვლილებები არ ინახება და რეალურ ჯავშნებს არ ეხება.</p></div><button onClick={()=>setShowInfo(false)} aria-label="შეტყობინების დახურვა">×</button></section>}
   {view==='guest'?<GuestView/>:<>
    <div className={styles.pageHead}><div><p className={styles.kicker}>EPISODE HOLDING / CONTROL CENTER</p><h1>{tab==='overview'?'გამარჯობა, ადმინისტრატორო':nav.find(n=>n[0]===tab)?.[1]}</h1><p>ობიექტები, სტუმრები და გამოცდილებები — ერთ სივრცეში.</p></div><div className={styles.headButtons}><span className={styles.dateTag}>◷ &nbsp; სატესტო პერიოდი</span><Link href="/auth" className={styles.cta}>რეალურ ანგარიშზე გადასვლა ↗</Link></div></div>
    {tab==='overview'&&<Overview onNavigate={navigate}/>}
    {tab==='reservations'&&<section className={styles.panel}>
      <div className={styles.panelHeading}><div><h2>ჯავშნების მართვა</h2><p>გაფილტრე ობიექტის, სტატუსისა და სტუმრის მიხედვით.</p></div><span className={styles.count}>{filtered.length} შედეგი</span></div>
      <div className={styles.filters}><label>ობიექტი<select value={venue} onChange={e=>setVenue(e.target.value)}><option value="all">ყველა ობიექტი</option>{venues.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <label>სტატუსი<select value={status} onChange={e=>setStatus(e.target.value as Status)}><option value="all">ყველა სტატუსი</option>{(['confirmed','pending','cancelled'] as const).map(s=><option value={s} key={s}>{labelStatus[s]}</option>)}</select></label>
        <label>ძიება<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="სტუმარი, ობიექტი ან ID"/></label>
      </div><BookingTable items={filtered}/></section>}
    {tab==='inventory'&&<section className={styles.panel}><div className={styles.panelHeading}><div><h2>ინვენტარის მართვა</h2><p>მაგიდებისა და ნომრების სექციის მაგალითი.</p></div></div><div className={styles.inventoryGrid}>{venues.map((v,i)=><div key={v.id} className={styles.inventoryCard}><span className={styles.kicker}>{v.city} · {v.type}</span><h3>{v.name}</h3><div className={styles.resourceVisual}><span>{v.type==='რესტორანი'?'▦':'▤'}</span></div><p>{v.type==='რესტორანი'?'მაგიდების დატვირთულობა':'ნომრების ხელმისაწვდომობა'}</p><div className={styles.track}><span style={{width:[67,42,55,31][i]+'%'}}/></div><small>დატვირთულობა: {[67,42,55,31][i]}% — სატესტო</small></div>)}</div></section>}
    {tab==='events'&&<section className={styles.panel}><div className={styles.panelHeading}><div><h2>ღონისძიებების კალენდარი</h2><p>გამოქვეყნება და რედაქტირება რეალურ ადმინისტრაციულ სივრცეში შესრულდება.</p></div></div><div className={styles.stack}>{events.map((e,i)=><div key={i} className={styles.listRow}><span className={styles.eventSymbol}>♫</span><div><h3>{e.name}</h3><p>{e.venue} · {e.date}</p></div><span className={styles.tag}>{e.status}</span></div>)}</div></section>}
    {tab==='offers'&&<section className={styles.panel}><div className={styles.panelHeading}><div><h2>შეთავაზებები და აქციები</h2><p>აქციების დასაგეგმად და მართვის ფუნქციების გასაცნობად.</p></div></div><div className={styles.offersGrid}>{offers.map((o,i)=><article key={o.name} className={styles.offerCard}><div className={styles.offerCover} data-tone={i}><span>EXCLUSIVE OFFERS</span><strong>✧</strong></div><div><span className={styles.kicker}>{o.venue}</span><h3>{o.name}</h3><p>{o.detail}</p><span className={styles.tag}>{o.status} · დემო</span></div></article>)}</div></section>}
   </>}
  </main>
 </div></div>;
}
function BookingTable({items}:{items:typeof bookings}){
 return <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>ID</th><th>სტუმარი</th><th>ობიექტი</th><th>თარიღი</th><th>სტუმრები</th><th>სტატუსი</th></tr></thead><tbody>
  {items.map(b=><tr key={b.id}><td><strong>{b.id}</strong></td><td>{b.guest}</td><td>{venueName(b.venue)}</td><td>{b.date}</td><td>{b.guests}</td><td><span className={styles[statusClass[b.status]]}>{labelStatus[b.status]}</span></td></tr>)}
  {!items.length&&<tr><td colSpan={6} className={styles.empty}>ამ ფილტრებით სატესტო ჯავშანი ვერ მოიძებნა.</td></tr>}
 </tbody></table></div>
}
function Overview({onNavigate}:{onNavigate:(t:Tab)=>void}){
 const metrics=[['სულ ჯავშნები','128','↗ +12%'],['დადასტურებული','94','73%'],['აქტიური ობიექტები','4','2 რესტორანი / 2 სასტუმრო'],['ღონისძიებები','8','სატესტო კალენდარი']];
 return <><div className={styles.metrics}>{metrics.map(([label,value,info],i)=><div className={styles.metric} key={label}><div><span>{label}</span><span className={styles.metricIcon}>{['▦','✓','⌖','♫'][i]}</span></div><strong>{value}</strong><small>{info}</small></div>)}</div>
  <div className={styles.overviewGrid}><section className={styles.panel}><div className={styles.panelHeading}><div><h2>ბოლო ჯავშნები</h2><p>ბოლო აქტივობები — ნიმუშის სახით</p></div><button className={styles.textAction} onClick={()=>onNavigate('reservations')}>ყველა ჯავშანი ↗</button></div><BookingTable items={bookings.slice(0,4)}/></section>
   <section className={styles.panel}><div className={styles.panelHeading}><div><h2>ობიექტები</h2><p>ჰოლდინგის საერთო ხედი</p></div></div>{venues.map((v,i)=><div className={styles.venueRow} key={v.id}><span className={styles.venueInitial}>{v.name[0]}</span><span><strong>{v.name}</strong><small>{v.city} · {v.type}</small></span><strong>{[67,42,55,31][i]}%</strong></div>)}</section></div>
  <section className={styles.quickActions}><div><span className={styles.kicker}>QUICK ACCESS</span><h2>რას ვმართავთ დღეს?</h2></div><div>{([['reservations','ჯავშნების ნახვა'],['events','ღონისძიებები'],['offers','აქციების მართვა']] as const).map(([t,label])=><button key={t} onClick={()=>onNavigate(t)}>{label} ↗</button>)}</div></section>
 </>;
}
function GuestView(){
 const [section,setSection]=useState<'bookings'|'profile'|'loyalty'>('bookings');
 return <><div className={styles.pageHead}><div><p className={styles.kicker}>MY EPISODE</p><h1>გამარჯობა, სტუმარო</h1><p>შენი ვიზიტები, პროფილი და ლოიალობის გამოცდილება.</p></div><Link href="/auth" className={styles.cta}>შექმენი რეალური ანგარიში ↗</Link></div>
   <div className={styles.guestGrid}><section className={styles.memberCard}><span>EPISODE MEMBER</span><h2>My Episode</h2><p>სატესტო სტუმარი</p><strong>240</strong><small>დემო ქულა</small><div>MEMBER · SILVER · GOLD · BLACK</div></section>
   <section className={styles.panel}><div className={styles.guestTabs}>{([['bookings','ჯავშნები'],['profile','პროფილი'],['loyalty','ლოიალობა']] as const).map(([id,label])=><button onClick={()=>setSection(id)} className={section===id?styles.active:''} key={id}>{label}</button>)}</div>
    {section==='bookings'?<div className={styles.stack}><div className={styles.listRow}><span className={styles.eventSymbol}>▦</span><div><h3>ბათუმის სახლში</h3><p>12 ოქტომბერი · 19:00 · 4 სტუმარი</p></div><span className={styles.tag}>დემო</span></div><div className={styles.listRow}><span className={styles.eventSymbol}>▤</span><div><h3>Hotel Magnolia</h3><p>13–15 ოქტომბერი · 2 სტუმარი</p></div><span className={styles.tag}>დემო</span></div></div>:section==='profile'?<div className={styles.guestDetails}><h3>პროფილი და პარამეტრები</h3><p>სახელი: სატესტო სტუმარი</p><p>ელფოსტა: demo@example.invalid</p><p>დაბადების დღე და კომუნიკაციის პარამეტრები მხოლოდ რეალურ ანგარიშში ინახება.</p></div>:<div className={styles.guestDetails}><h3>შენი ქულები და სტატუსი</h3><p>240 სატესტო ქულა · Member დონე</p><p>რეალურ სისტემაში ქულები დადასტურებული ვიზიტების შემდეგ ირიცხება.</p></div>}
   </section></div></>;
}
