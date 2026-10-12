'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useState,type FormEvent} from 'react';
import {ButtonLink,dateOnly,dateTime,Photo,useSite,type EventItem} from './site';
import {VenueDetail} from './catalog-pages';
import styles from './reference-restaurant.module.css';

const venues={
  batumi:{
    city:'Batumi',name:'ბათუმის სახლში',lead:'შექმენი შენი ეპიზოდი',
    intro:'ნამდვილი ქართული სამზარეულო, ცოცხალი მუსიკა ყოველ საღამოს და ბათუმის სული ერთ სივრცეში.',
    logo:'/brand/batumis-sakhlshi.png',photo:'batumi',backdrop:'batumi',
  },
  kutaisi:{
    city:'Kutaisi',name:'ქუთაისის სახლში',lead:'ქართული გემო და სული',
    intro:'თბილი გარემო, ქართული სამზარეულო, ცოცხალი მუსიკა და შეხვედრების ადგილი ქუთაისში.',
    logo:'/brand/kutaisis-sakhlshi.png',photo:'kutaisi',backdrop:'kutaisi',
  },
} as const;

function validDate(value:string,lower:string,upper:string){
  return /^\d{4}-\d{2}-\d{2}$/.test(value)&&value>=lower&&value<=upper;
}
function validTime(value:string){return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);}
function futureLocal(date:string,time:string){
  if(!validDate(date,'2000-01-01','2100-01-01')||!validTime(time))return false;
  const [year,month,day]=date.split('-').map(Number);
  return Date.UTC(year,month-1,day,Number(time.slice(0,2))-4,Number(time.slice(3)))>Date.now();
}

export function VenueWebsiteRouter({slug}:{slug:string}){
  const {properties}=useSite();
  const property=properties.find(p=>p.slug===slug);
  const which=property?.kind==='restaurant'&&property.city==='Batumi'?'batumi':
    property?.kind==='restaurant'&&property.city==='Kutaisi'?'kutaisi':
    slug==='batumi'||slug==='kutaisi'?slug:null;
  if(slug==='tbilisi'&&!property)return <RestaurantPreview/>;
  if(slug==='mere'&&!property)return <HotelPreview/>;
  return which?<RestaurantWebsite slug={slug} which={which}/>:<VenueDetail slug={slug}/>;
}


function RestaurantPreview(){
  return <div className="restaurant-reference" lang="ka" style={{background:'#faf8f4',minHeight:'70vh',color:'#1c3329'}}>
    <section style={{position:'relative',minHeight:530,color:'#fff',overflow:'hidden',display:'flex',alignItems:'center'}}>
      <div style={{position:'absolute',inset:0,filter:'brightness(.35)'}}><Photo name="hero"/></div>
      <div style={{position:'relative',zIndex:1,padding:'80px clamp(25px,8vw,100px)',maxWidth:780}}>
        <Link href="/restaurants" style={{fontSize:13,color:'#e9c99b'}}>← ყველა რესტორანი</Link>
        <p style={{letterSpacing:3,fontSize:12,margin:'45px 0 15px',color:'#e9c99b'}}>EPISODE RESTAURANT · TBILISI</p>
        <h1 style={{fontSize:'clamp(45px,5vw,72px)',marginBottom:20,color:'#fff'}}>თბილისის სახლში</h1>
        <p style={{fontSize:16,lineHeight:1.8}}>რესტორნის დამოუკიდებელი გვერდი მზადდება. სრული ინფორმაცია და დაჯავშნის შესაძლებლობა გამოქვეყნდება ობიექტის გააქტიურების შემდეგ.</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:16,marginTop:35}}><Link href="/restaurants" className="button">სხვა რესტორნების ნახვა →</Link><Link href="/places/tbilisi/menu" className="button secondary" style={{color:'#fff',borderColor:'#e9c99b'}}>მენიუს გვერდი →</Link></div>
      </div>
    </section>
  </div>;
}
function HotelPreview(){
  return <div className="container" style={{paddingTop:75,paddingBottom:110}}>
    <Link href="/hotels" className="back-link">← ყველა სასტუმრო</Link>
    <p className="eyebrow" style={{marginTop:45}}>EPISODE HOTELS · TELAVI</p>
    <h1>Chateau Mere</h1>
    <p className="lead">სასტუმროს დეტალური გვერდი და რეალური ნომრების დაჯავშნის შესაძლებლობა ემატება პლატფორმას. ამ ეტაპზე ჯავშნების მიღება აქედან არ ხდება.</p>
    <ButtonLink href="/places/magnolia">Hotel Magnolia-ს ნახვა</ButtonLink>
  </div>;
}

function RestaurantWebsite({slug,which}:{slug:string;which:'batumi'|'kutaisi'}){
  const venue=venues[which];
  const {properties,events,loading,error}=useSite();
  const property=properties.find(p=>p.slug===slug&&p.kind==='restaurant'&&p.active!==false);
  const [date,setDate]=useState('');
  const [time,setTime]=useState('19:00');
  const [guests,setGuests]=useState(2);
  const [ready,setReady]=useState(false);
  const [message,setMessage]=useState('');
  const [language,setLanguage]=useState<'KA'|'EN'>('KA');
  const today=dateOnly(),maximum=dateOnly(Date.now()+365*86400000);
  useEffect(()=>{
    const query=new URLSearchParams(window.location.search);
    const d=query.get('date')||'',t=query.get('time')||'',n=Number(query.get('guests')||2);
    setDate(validDate(d,dateOnly(),dateOnly(Date.now()+365*86400000))?d:dateOnly(Date.now()+86400000));
    setTime(validTime(t)?t:'19:00');
    setGuests(Number.isInteger(n)&&n>=1&&n<=12?n:2);
    setReady(true);
  },[slug]);
  const venueEvents=events.filter(e=>e.property_id===property?.id&&e.active!==false&&new Date(e.ends_at).getTime()>Date.now()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
  const dayEvent=venueEvents.find(e=>dateOnly(e.starts_at)===date);
  function handleBooking(e:FormEvent){
    e.preventDefault();
    if(!property){setMessage('ჯავშნის სერვისი ამ რესტორნისთვის ჯერ არ არის ხელმისაწვდომი.');return;}
    if(!futureLocal(date,time)){setMessage('აირჩიეთ მომავალი თარიღი და დრო საქართველოს დროით.');return;}
    setMessage('');
    const params=new URLSearchParams({place:property.slug,date,time,guests:String(guests)});
    window.location.assign('/book?'+params.toString());
  }
  const isKutaisi=which==='kutaisi';
  return <div className={'restaurant-reference '+styles.page+(isKutaisi?' '+styles.kutaisi:' '+styles.batumi)} lang={language==='KA'?'ka':'en'}>
    <section className={styles.hero} aria-labelledby="venue-title">
      <div className={styles.heroPicture} aria-hidden="true"><Image src={which==='batumi'?'/venue/batumi-reference.webp':'/venue/kutaisi-reference.webp'} alt="" fill priority unoptimized sizes="100vw" className={styles.heroPhoto}/></div>
      <div className={styles.heroShade} aria-hidden="true"/>
      <header className={styles.header}>
        <Link className={styles.identity} href="/" aria-label="Episode Holding Home">
          <Image src={venue.logo} width={142} height={108} unoptimized alt={venue.name+' ლოგო'}/>
        </Link>
        <nav className={styles.navigation} aria-label="Restaurant navigation">
          <a href="#venue-title">{language==='KA'?'მთავარი':'Home'}</a>
          <Link href={'/places/'+encodeURIComponent(slug)+'/menu'}>{language==='KA'?'მენიუ':'Menu'}</Link>
          <a href="#events">{language==='KA'?'ივენთები':'Events'}</a>
          <a href="#gallery">{language==='KA'?'გალერეა':'Gallery'}</a>
          <a href="#about">{language==='KA'?'ჩვენ შესახებ':'About'}</a>
          <a href="#reservation">{language==='KA'?'კონტაქტი':'Contact'}</a>
        </nav>
        <div className={styles.headerTools}>
          <a href="#reservation" className={styles.navBook}>
            <span aria-hidden="true">▦</span> {language==='KA'?'მაგიდის დაჯავშნა':'Reserve a table'}
          </a>
          <div className={styles.languagePicker} aria-label="Language">
            <button type="button" aria-pressed={language==='KA'} onClick={()=>setLanguage('KA')}>KA</button>
            <span aria-hidden="true">|</span>
            <button type="button" aria-pressed={language==='EN'} onClick={()=>setLanguage('EN')}>EN</button>
          </div>
        </div>
      </header>
      <div className={styles.heroContent}>
        <p className={styles.overline}>MODERN GEORGIAN RESTAURANT</p>
        {isKutaisi?<><h1 id="venue-title" className={styles.kutaisiTitle}>{venue.name}</h1><p className={styles.signature}>{venue.lead}</p></>:
          <h1 id="venue-title" className={styles.batumiTitle}>{language==='KA'?<>შექმენი<br/>შენი ეპიზოდი</>:<>Create<br/>Your Episode</>}</h1>}
        <p className={styles.heroDescription}>{venue.intro}</p>
        <div className={styles.heroActions}>
          <a href="#reservation" className={styles.reserveButton}><span aria-hidden="true">▦</span> {language==='KA'?'მაგიდის დაჯავშნა':'Book a table'} <span aria-hidden="true">→</span></a>
          {isKutaisi&&<Link className={styles.menuButton} href={'/places/'+encodeURIComponent(slug)+'/menu'}>{language==='KA'?'მენიუს ნახვა':'View Menu'} <span aria-hidden="true">→</span></Link>}
        </div>
      </div>
      {!isKutaisi&&<div className={styles.heroFacts}>
        <div><span aria-hidden="true">⌖</span><div><strong>ბათუმი</strong><small>საქართველო</small></div></div>
        <div><span aria-hidden="true">◷</span><div><strong>სამუშაო საათები</strong><small>დაზუსტდება რესტორანთან</small></div></div>
        <div><span aria-hidden="true">♫</span><div><strong>ცოცხალი მუსიკა</strong><small>{dayEvent?(property?.is_demo?'სატესტო: ':'')+dayEvent.title:'შეამოწმეთ პროგრამა'}</small></div></div>
      </div>}
    </section>

    {isKutaisi&&<section className={styles.featureStrip} aria-label="Restaurant highlights">
      <div><span aria-hidden="true">♜</span><span><strong>ქართული სამზარეულო</strong><small>ავთენტური გემოები</small></span></div>
      <div><span aria-hidden="true">♫</span><span><strong>ცოცხალი მუსიკა</strong><small>ღონისძიებების კალენდარი</small></span></div>
      <div><span aria-hidden="true">⌖</span><span><strong>ქუთაისში</strong><small>ისტორიულ უბანში</small></span></div>
    </section>}

    <section id="reservation" className={styles.booking} aria-labelledby="booking-title">
      <div className={styles.bookingHeading}><span className={styles.label}>YOUR NEXT EPISODE</span><h2 id="booking-title">დაჯავშნე მაგიდა</h2>
        <p>არჩეული თარიღი და სტუმრების რაოდენობა შენარჩუნებულია.</p>
      </div>
      <form className={styles.bookingForm} onSubmit={handleBooking}>
        <label>თარიღი <input type="date" min={today} max={maximum} value={date} onChange={e=>{setDate(e.target.value);setMessage('')}} disabled={!ready} required/></label>
        <label>დრო <input type="time" value={time} onChange={e=>{setTime(e.target.value);setMessage('')}} required/></label>
        <label>სტუმრები <select value={guests} onChange={e=>{setGuests(Number(e.target.value));setMessage('')}}>{Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
        <button type="submit" disabled={!ready||loading||!property}>{language==='KA'?'დაჯავშნა':'Reserve'} <span aria-hidden="true">→</span></button>
      </form>
      {message&&<p className={styles.formError} role="alert">{message}</p>}
      {property?.is_demo&&<p className={styles.demoNotice}>სატესტო ობიექტი: აქ შექმნილი ჯავშნები რეალური ჯავშნები არ არის.</p>}
      {error&&!property&&<p className={styles.formError}>ჯავშნის სერვისი ამჟამად მიუწვდომელია.</p>}
    </section>

    {isKutaisi&&<section className={styles.offers} aria-labelledby="offers-title"><div className={styles.sectionHeader}><h2 id="offers-title">აქტუალური შეთავაზებები</h2><span>მეტი გამოცდილება ↗</span></div>
      <div className={styles.tileGrid}>
        <Link className={styles.tile} href={'/places/'+encodeURIComponent(slug)+'/menu'}><Photo name="wine"/><span className={styles.tileShadow}/><span className={styles.tileCopy}><strong>მენიუ</strong><small>ქართული გემოები</small></span><span className={styles.tileArrow}>↗</span></Link>
        <a className={styles.tile} href="#events"><Photo name="folk"/><span className={styles.tileShadow}/><span className={styles.tileCopy}><strong>ცოცხალი მუსიკა</strong><small>საღამოს პროგრამა</small></span><span className={styles.tileArrow}>↗</span></a>
        <a className={styles.tile} href="#reservation"><Photo name="hero"/><span className={styles.tileShadow}/><span className={styles.tileCopy}><strong>ჯგუფური ვიზიტები</strong><small>დაგეგმე სტუმრობა</small></span><span className={styles.tileArrow}>↗</span></a>
      </div>
    </section>}

    {!isKutaisi&&<section className={styles.batumiLinks} aria-label="Explore the restaurant">
      <Link className={styles.tile} href={'/places/'+encodeURIComponent(slug)+'/menu'}><Photo name="wine"/><span className={styles.tileShadow}/><span className={styles.tileCopy}><strong>მენიუ</strong><small>ნამდვილი ქართული გემო</small></span><span className={styles.tileArrow}>↗</span></Link>
      <a className={styles.tile} href="#events"><Photo name="folk"/><span className={styles.tileShadow}/><span className={styles.tileCopy}><strong>ივენთები</strong><small>ყოველდღიური პროგრამა</small></span><span className={styles.tileArrow}>↗</span></a>
      <a className={styles.tile} href="#gallery"><Photo name="hero"/><span className={styles.tileShadow}/><span className={styles.tileCopy}><strong>გალერეა</strong><small>ჩვენი ატმოსფერო</small></span><span className={styles.tileArrow}>↗</span></a>
    </section>}

    <section id="events" className={styles.events}>
      <div className={styles.sectionHeader}><h2>მომავალი ღონისძიებები</h2><Link href="/events">კალენდრის ნახვა ↗</Link></div>
      {venueEvents.length>0?<div className={styles.eventList}>{venueEvents.slice(0,4).map((event:EventItem)=><Link className={styles.event} key={event.id} href={'/events/'+encodeURIComponent(event.slug)}>
        <span className={styles.eventDate}><strong>{dateOnly(event.starts_at).slice(8,10)}</strong><small>{new Date(event.starts_at).toLocaleString('en-US',{timeZone:'Asia/Tbilisi',month:'short'}).toUpperCase()}</small></span>
        <div><strong>{event.title}</strong><small>{dateTime(event.starts_at)}{property?.is_demo?' · TEST EVENT':''}</small></div>
        <span aria-hidden="true">↗</span>
      </Link>)}</div>:<p className={styles.noEvents}>ამჟამად მომავალი ღონისძიებები არ არის გამოქვეყნებული.</p>}
    </section>

    <section id="gallery" className={styles.gallery}>
      <div className={styles.sectionHeader}><h2>გალერეა</h2></div>
      <div className={styles.galleryItems}><Photo name={venue.photo}/><Photo name="hero"/><Photo name="wine"/></div>
      <p>ფოტოები დროებით საილუსტრაციოა; ორიგინალი რესტორნის ფოტოებით ჩანაცვლდება.</p>
    </section>
    <footer id="about" className={styles.footer}>
      <div><strong>{venue.name}</strong><small>{venue.city} · EPISODE HOLDING</small></div>
      <Link href="/restaurants">← ყველა რესტორანი</Link>
    </footer>
  </div>;
}
