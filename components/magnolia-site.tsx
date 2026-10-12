'use client';

import Link from 'next/link';
import {useEffect,useState,type FormEvent,type ReactNode} from 'react';
import {api,dateOnly,Icon,useSite,type Property} from './site';
import styles from './magnolia-site.module.css';

type Offer={id:string;slug:string;title:string;summary:string;terms:string;discount_percent:number|null;min_nights:number;starts_at:string;ends_at:string;is_demo:boolean};
type Room={label:string;capacity:number};
const root='/places/magnolia';
const suggestions=[{title:'Romantic Getaway',summary:'განსაკუთრებული დღეები ორ ადამიანზე — შეთავაზების დეტალები მალე.'},{title:'Longer Stay',summary:'დაგეგმე ხანგრძლივი სტუმრობა თბილისში.'},{title:'Bed & Breakfast',summary:'საუზმის პაკეტი — პირობები გამოქვეყნების შემდეგ.'}];
const localDate=(add:number)=>dateOnly(Date.now()+add*86400000);
const nightsBetween=(a:string,b:string)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
const displayDate=(value:string)=>new Intl.DateTimeFormat('ka-GE',{timeZone:'Asia/Tbilisi',dateStyle:'medium'}).format(new Date(value));
function useHotel(){
 const {properties,member,loading,error}=useSite();
 const property=properties.find(p=>p.slug==='magnolia'&&p.kind==='hotel');
 const [offers,setOffers]=useState<Offer[]>([]);
 const [rooms,setRooms]=useState<Room[]>([]);
 const [offerError,setOfferError]=useState(false);
 useEffect(()=>{let alive=true;Promise.allSettled([api<{offers:Offer[]}>('hotel/offers?property=magnolia'),api<{rooms:Room[]}>('hotel/rooms?property=magnolia')]).then(([o,r])=>{if(!alive)return;
   if(o.status==='fulfilled')setOffers(o.value.offers);else setOfferError(true);
   if(r.status==='fulfilled')setRooms(r.value.rooms);
 });return()=>{alive=false};},[]);
 return {property,offers,rooms,member,loading,error,offerError};
}
function MagnoliaMark(){return <svg className={styles.flower} viewBox="0 0 80 90" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M40 58C15 47 23 21 31 17c8 1 9 17 9 41Zm0 0c25-11 17-37 9-41-8 1-9 17-9 41Z"/><path d="M40 58C25 46 28 10 40 3c12 7 15 43 0 55ZM33 56C10 55 5 39 13 31c9-6 16 8 20 25Zm14 0c23-1 28-17 20-25-9-6-16 8-20 25Z"/><path d="M40 58v13m0-1c-9-11-22-12-24-5 6 11 17 11 24 6Zm0 1c8-11 21-12 24-5-6 11-17 11-24 6Z"/></svg>;}
function Header(){
 const {member}=useSite();
 const [open,setOpen]=useState(false);
 const links=[['','მთავარი'],['/rooms','ნომრები'],['/offers','შეთავაზებები'],['#experience','სასტუმროს შესახებ']];
 return <header className={styles.header}>
   <Link href={root} className={styles.brand} aria-label="Magnolia Hotel Tbilisi მთავარი">
     <MagnoliaMark/><span><strong>MAGNOLIA</strong><small>HOTEL · TBILISI</small><i>by Calora Group</i></span>
   </Link>
   <button type="button" className={styles.mobileToggle} aria-expanded={open} aria-controls="magnolia-nav" onClick={()=>setOpen(!open)}>☰ <span>მენიუ</span></button>
   <nav className={open?styles.navOpen:styles.nav} id="magnolia-nav" aria-label="სასტუმროს ნავიგაცია">
     {links.map(([path,label])=><Link key={label} onClick={()=>setOpen(false)} href={path==='#experience'?root+'#experience':root+path}>{label}</Link>)}
     <Link href="/hotels" onClick={()=>setOpen(false)}>EPISODE</Link>
   </nav>
   <div className={styles.headerRight}><Link className={styles.account} href={member.user?'/account':'/auth?next=%2Faccount'}>My Episode</Link><Link className={styles.goldButton} href={root+'/book'}>დაჯავშნა <span aria-hidden="true">↗</span></Link></div>
 </header>;
}
function Footer(){return <footer className={styles.footer}><div className={styles.footerBrand}><MagnoliaMark/><strong>MAGNOLIA</strong><small>HOTEL · TBILISI</small><i>by Calora Group</i></div><p>მთაწმინდა, თბილისი<br/>ბუტიკური სასტუმრო ისტორიული ქალაქის ატმოსფეროში.</p><div><Link href={root+'/rooms'}>ნომრები</Link><Link href={root+'/offers'}>შეთავაზებები</Link><Link href={root+'/book'}>დაჯავშნა</Link><Link href="/account">My Episode</Link></div><div><small>One account. Every Episode.</small><Link href="/">Episode Holding ↗</Link></div></footer>}
function Frame({children}:{children:ReactNode}){return <div lang="ka" className={styles.page}><Header/>{children}<Footer/></div>}
function MiniFeatures(){return <div className={styles.features}><span>⌖ <b>მთაწმინდა, თბილისი</b></span><span>✿ <b>ბუტიკური გამოცდილება</b></span><span>♡ <b>რომანტიკული ატმოსფერო</b></span><span>↗ <b>Episode-ის ერთიანი ანგარიში</b></span></div>}
function DateSearch({compact=false}:{compact?:boolean}){
 const [checkIn,setCheckIn]=useState(''),[checkOut,setCheckOut]=useState(''),[guests,setGuests]=useState(2),[error,setError]=useState('');
 useEffect(()=>{const params=new URLSearchParams(location.search);const a=params.get('date'),n=Number(params.get('nights'));const start=a&&/^\d{4}-\d{2}-\d{2}$/.test(a)&&a>=dateOnly()?a:localDate(1);
 const nights=Number.isInteger(n)&&n>=1&&n<=30?n:2;
 const d=new Date(start+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+nights);
 setCheckIn(start);setCheckOut(d.toISOString().slice(0,10));
 const people=Number(params.get('guests'));setGuests(Number.isInteger(people)&&people>=1&&people<=12?people:2);},[]);
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const nights=nightsBetween(checkIn,checkOut);
  if(!checkIn||!checkOut||checkIn<dateOnly()||nights<1||nights>30){setError('აირჩიეთ სწორი თარიღები (1–30 ღამე).');return;}
  const params=new URLSearchParams({date:checkIn,nights:String(nights),guests:String(guests)});window.location.assign(root+'/book?'+params);
 }
 return <form className={compact?styles.searchCompact:styles.searchBar} onSubmit={submit} aria-label="ნომრის მოძებნა">
   <label><span>შესვლა</span><input aria-label="შესვლის თარიღი" type="date" min={dateOnly()} max={localDate(365)} value={checkIn} onChange={e=>{setCheckIn(e.target.value);setError('')}} required/></label>
   <label><span>გასვლა</span><input aria-label="გასვლის თარიღი" type="date" min={checkIn||dateOnly()} max={localDate(395)} value={checkOut} onChange={e=>{setCheckOut(e.target.value);setError('')}} required/></label>
   <label><span>სტუმრები</span><select aria-label="სტუმრების რაოდენობა" value={guests} onChange={e=>setGuests(Number(e.target.value))}>{Array.from({length:12},(_,i)=>i+1).map(n=><option value={n} key={n}>{n} სტუმარი</option>)}</select></label>
   <button type="submit">შეამოწმე ხელმისაწვდომობა <span aria-hidden="true">→</span></button>
   {error&&<p className={styles.fieldError} role="alert">{error}</p>}
 </form>;
}
function OfferCards({offers,limit=3}:{offers:Offer[];limit?:number}){
 const show=offers.slice(0,limit);
 return <div className={styles.cards}>
   {show.length?show.map((offer,index)=><Link key={offer.id} href={root+'/offers/'+offer.slug} className={styles.offerCard}>
     <div className={styles.offerImage} data-style={index%3===0?'romantic':index%3===1?'extended':'morning'}><span>{offer.discount_percent?offer.discount_percent+'%':'SPECIAL OFFER'}</span></div>
     <div className={styles.offerBody}><h3>{offer.title}</h3><p>{offer.summary}</p><span>პირობების ნახვა ↗</span></div>
   </Link>):suggestions.map((item,index)=><article key={item.title} className={styles.offerCard}>
      <div className={styles.offerImage} data-style={index===0?'romantic':index===1?'extended':'morning'}><span>მალე</span></div>
      <div className={styles.offerBody}><h3>{item.title}</h3><p>{item.summary}</p><span>შეთავაზება ჯერ არ არის აქტიური</span></div>
   </article>)}
 </div>;
}
function RoomCards({rooms}:{rooms:Room[]}){
 return <div className={styles.cards}>{rooms.length?rooms.slice(0,3).map((room,i)=><article className={styles.roomCard} key={room.label}>
   <div className={styles.roomVisual} data-tone={i%3}><span>MAGNOLIA · TBILISI</span></div>
   <div className={styles.roomBody}><h3>{room.label}</h3><p>მაქსიმუმ {room.capacity} სტუმარი · ნომრის კატეგორია და ტარიფი დასაზუსტებელია.</p><Link href={root+'/book'}>შეამოწმე ნომერი ↗</Link></div>
 </article>):<div className={styles.emptyWide}><h3>ჩვენი ნომრები</h3><p>ნომრების აღწერილობა და ხელმისაწვდომობა გამოჩნდება, როდესაც სასტუმროს ადმინისტრაცია ინვენტარს დაამატებს.</p><Link href={root+'/book'}>დაჯავშნის გვერდი ↗</Link></div>}</div>;
}
export function MagnoliaHome(){
 const {offers,rooms,property,error,offerError}=useHotel();
 return <Frame><section className={styles.hero}><div className={styles.heroImage} aria-hidden="true"/><div className={styles.heroShade}/>
    <div className={styles.heroCopy}><p className={styles.overline}>A BOUTIQUE HOTEL IN TBILISI</p><h1>MAGNOLIA<br/><em>HOTEL · TBILISI</em></h1><p className={styles.heroTagline}>თბილისის ისტორიული ხიბლი.<br/>თანამედროვე კომფორტი.</p><p className={styles.heroIntro}>აღმოაჩინე მთაწმინდაზე მდებარე ბუტიკური სასტუმრო — ადგილი, სადაც ქალაქის ხასიათი და მყუდრო გარემო ერთმანეთს ხვდება.</p><Link className={styles.heroLink} href={root+'/rooms'}>აღმოაჩინე სასტუმრო <span>→</span></Link></div>
    <div className={styles.heroCaption}>THE MAGNOLIA EXPERIENCE · TBILISI</div>
  </section>
  <div className={styles.searchOverlap}><DateSearch/>{property?.is_demo&&<p className={styles.demo}>სატესტო ინვენტარი — ჯავშნები რეალურ განთავსებას არ ადასტურებს.</p>}{error&&<p className={styles.demo}>ჯავშნის სერვისი ამჟამად მიუწვდომელია.</p>}</div>
  <MiniFeatures/>
  <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.kicker}>THE COLLECTION</span><h2>შენი ადგილი თბილისში</h2><p>მყუდრო გარემო, ინდივიდუალური გამოცდილება და ქალაქის სიახლოვე.</p></div><Link href={root+'/rooms'}>ყველა ნომერი ↗</Link></div><RoomCards rooms={rooms}/></section>
  <section className={styles.offersSection}><div className={styles.sectionHead}><div><span className={styles.kicker}>SPECIAL OFFERS</span><h2>განსაკუთრებული შეთავაზებები</h2><p>აქ გამოჩნდება სასტუმროს მოქმედი, ადმინისტრაციის მიერ გამოქვეყნებული აქციები.</p></div><Link href={root+'/offers'}>ყველა შეთავაზება ↗</Link></div><OfferCards offers={offers}/>{offerError&&<p className={styles.note}>აქციების ჩატვირთვა ამჟამად ვერ მოხერხდა.</p>}</section>
  <section className={styles.story} id="experience"><div className={styles.storyImage}><span>MORE THAN A STAY</span></div><div><span className={styles.kicker}>THE MAGNOLIA EXPERIENCE</span><h2>თბილისი, რომელსაც<br/>გრძნობ.</h2><p>სასტუმროს ატმოსფერო შთაგონებულია ძველი თბილისის არქიტექტურით, ისტორიითა და მთაწმინდის განსაკუთრებული ხასიათით.</p><p>იდეალური სივრცე მათთვის, ვისაც ქალაქის აღმოჩენა და მშვიდი დასვენება ერთდროულად სურს.</p><Link href={root+'/book'} className={styles.outlineButton}>დაგეგმე სტუმრობა ↗</Link></div></section>
  <section className={styles.episodeStrip}><div><span className={styles.kicker}>MY EPISODE</span><h2>ერთი ანგარიში. მეტი გამოცდილება.</h2><p>დაჯავშნე სასტუმრო, ნახე შენი ჯავშნები და გამოიყენე Episode-ის ერთიანი პროფილი.</p></div><Link href="/account" className={styles.goldButton}>My Episode ↗</Link></section>
 </Frame>;
}
export function MagnoliaRooms(){const {rooms,property}=useHotel();return <Frame><div className={styles.innerHero}><span className={styles.kicker}>OUR ROOMS</span><h1>ოთახები და კომფორტი</h1><p>აირჩიე სტუმრების რაოდენობა და შეამოწმე რეალური ხელმისაწვდომობა.</p></div><section className={styles.section}><RoomCards rooms={rooms}/>{property?.is_demo&&<p className={styles.note}>ნომრები ამჟამად სატესტო რესურსებია. რეალური ნომრების ფოტოები, კატეგორიები და ფასები ადმინისტრაციამ უნდა დაამატოს.</p>}<div className={styles.roomsSearch}><h2>შეამოწმე სასურველი თარიღები</h2><DateSearch compact/></div></section></Frame>}
export function MagnoliaOffers(){const {offers,offerError}=useHotel();return <Frame><div className={styles.innerHero}><span className={styles.kicker}>SPECIAL OFFERS</span><h1>აქციები და პაკეტები</h1><p>შეთავაზებები ქვეყნდება მხოლოდ მოქმედების ვადებისა და პირობების დადასტურების შემდეგ.</p></div><section className={styles.section}><OfferCards offers={offers} limit={30}/>{offerError&&<p role="status">შეთავაზებების ჩატვირთვა ვერ მოხერხდა.</p>}</section></Frame>}
export function MagnoliaOffer({slug}:{slug:string}){const {offers,loading}=useHotel();const offer=offers.find(o=>o.slug===slug);return <Frame><section className={styles.section}><Link href={root+'/offers'} className={styles.backLink}>← ყველა შეთავაზება</Link>{offer?<div className={styles.offerDetail}><span className={styles.kicker}>MAGNOLIA · SPECIAL OFFER</span><h1>{offer.title}</h1><p className={styles.lead}>{offer.summary}</p>{offer.discount_percent&&<span className={styles.discount}>-{offer.discount_percent}%</span>}<dl><div><dt>მინიმალური ხანგრძლივობა</dt><dd>{offer.min_nights} ღამე</dd></div><div><dt>მოქმედების დასრულება</dt><dd>{displayDate(offer.ends_at)}</dd></div></dl><h2>შეთავაზების პირობები</h2><p className={styles.terms}>{offer.terms||'პირობები დასაზუსტებელია სასტუმროსთან.'}</p><p className={styles.note}>მოქმედი შეთავაზების პირობებს საბოლოოდ ადასტურებს სასტუმრო. ონლაინ დაჯავშნა ავტომატურად არ ითვლის ფასდაკლებას და გადახდას არ იღებს.</p><Link className={styles.goldButton} href={root+'/book?offer='+encodeURIComponent(offer.slug)+'&nights='+offer.min_nights}>შეამოწმე ხელმისაწვდომობა ↗</Link></div>:<div className={styles.emptyWide}><h2>{loading?'იტვირთება…':'შეთავაზება მიუწვდომელია'}</h2><p>შესაძლოა აქცია დასრულდა ან ჯერ არ გამოქვეყნებულა.</p><Link href={root+'/offers'}>ყველა შეთავაზება ↗</Link></div>}</section></Frame>}
export function MagnoliaBook(){
 const {property,member,loading,offers}=useHotel();
 const [checkIn,setCheckIn]=useState(''),[nights,setNights]=useState(2),[guests,setGuests]=useState(2),[offerSlug,setOfferSlug]=useState(''),[notes,setNotes]=useState('');
 const [requestKey,setRequestKey]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[availability,setAvailability]=useState<{available:boolean;remaining:number}|null>(null),[confirmation,setConfirmation]=useState<string|null>(null);
 useEffect(()=>{const p=new URLSearchParams(window.location.search);const d=p.get('date')||'',n=Number(p.get('nights')),g=Number(p.get('guests'));
 setCheckIn(/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>=dateOnly()?d:localDate(1));setNights(Number.isInteger(n)&&n>=1&&n<=30?n:2);setGuests(Number.isInteger(g)&&g>=1&&g<=12?g:2);
 setOfferSlug(p.get('offer')||'');setRequestKey(crypto.randomUUID());},[]);
 const offer=offers.find(o=>o.slug===offerSlug);const params=new URLSearchParams({date:checkIn,nights:String(nights),guests:String(guests),...(offerSlug?{offer:offerSlug}:{})});
 const stayValid=checkIn>=dateOnly()&&checkIn<=localDate(365)&&Number.isInteger(nights)&&nights>=1&&nights<=30&&(!offer||nights>=offer.min_nights);
 function change(){setAvailability(null);setError('');setRequestKey(crypto.randomUUID());}
 async function submit(e:FormEvent<HTMLFormElement>,mode:'check'|'confirm'){e.preventDefault();if(!property){setError('სასტუმრო ჯერ არ არის დაკავშირებული ჯავშნების სისტემასთან.');return;}
  if(!stayValid){setError('შეამოწმეთ თარიღი და ღამეების რაოდენობა.');return;}
  if(mode==='confirm'&&!member.user){window.location.assign('/auth?next='+encodeURIComponent(root+'/book?'+params));return;}
  const body={propertyId:property.id,kind:'room',date:checkIn,nights,guests,notes:[offer?'Requested promotion: '+offer.title:'',notes.trim()].filter(Boolean).join(' | ').slice(0,1000),requestKey};
  setBusy(true);setError('');
  try{if(mode==='check'){const result=await api<{available:boolean;remaining:number}>('availability',body);setAvailability(result);}
    else{const data=await api<{reservation:{id:string}}>('reservations',body);setConfirmation(data.reservation.id);}}
  catch(err){setError((err as Error).message);}finally{setBusy(false);}
 }
 return <Frame><div className={styles.innerHero}><span className={styles.kicker}>BOOK DIRECT</span><h1>დაჯავშნე შენი სტუმრობა</h1><p>სისტემა ამოწმებს ნამდვილ თავისუფალ ნომრებს. დადასტურება ხდება Episode ანგარიშით.</p></div>
 <section className={styles.bookingArea}>{confirmation?<div className={styles.confirmation}><span>✓</span><h2>ჯავშანი შეიქმნა</h2><p>ჯავშნის ნომერი: {confirmation}</p>{property?.is_demo&&<p className={styles.note}>ეს არის სატესტო ჯავშანი და არ ადასტურებს სასტუმროში განთავსებას.</p>}<Link className={styles.goldButton} href="/account">ჩემი ჯავშნები ↗</Link></div>:
 <form className={styles.bookForm} onSubmit={e=>void submit(e,'confirm')}><h2>სტუმრობის დეტალები</h2>
 <div className={styles.bookFields}><label>შესვლა<input type="date" required min={dateOnly()} max={localDate(365)} value={checkIn} onChange={e=>{setCheckIn(e.target.value);change()}}/></label><label>ღამეები<select value={nights} onChange={e=>{setNights(Number(e.target.value));change()}}>{Array.from({length:30},(_,i)=>i+1).map(n=><option value={n} key={n}>{n} ღამე</option>)}</select></label><label>სტუმრები<select value={guests} onChange={e=>{setGuests(Number(e.target.value));change()}}>{Array.from({length:12},(_,i)=>i+1).map(n=><option value={n} key={n}>{n} სტუმარი</option>)}</select></label></div>
 {checkIn&&<p className={styles.note}>გასვლა: {displayDate(new Date(Date.parse(checkIn+'T00:00:00Z')+nights*86400000).toISOString())}</p>}
 {offer&&<div className={styles.promoSelection}><strong>არჩეული აქცია: {offer.title}</strong><p>მინიმუმ {offer.min_nights} ღამე. პირობებს საბოლოოდ ადასტურებს სასტუმრო; ფასდაკლება ავტომატურად არ ითვლება.</p></div>}
 <label>დამატებითი მოთხოვნა (არასავალდებულო)<textarea rows={3} maxLength={850} value={notes} onChange={e=>{setNotes(e.target.value);change()}} placeholder="მოგვწერეთ სურვილის შესახებ"/></label>
 {availability&&<p className={availability.available?styles.success:styles.fieldError} role="status">{availability.available?'შესაფერისი თავისუფალი ნომრები: '+availability.remaining:'ამ თარიღებზე თავისუფალი ნომერი ვერ მოიძებნა.'}</p>}
 {error&&<p role="alert" className={styles.fieldError}>{error}</p>}
 <div className={styles.bookActions}><button type="button" disabled={busy||!stayValid||loading||!property} className={styles.outlineButton} onClick={e=>void submit(e as unknown as FormEvent<HTMLFormElement>,'check')}>ხელმისაწვდომობის შემოწმება</button><button type="submit" disabled={busy||!stayValid||loading||!property||availability?.available===false} className={styles.goldButton}>{busy?'იტვირთება…':member.user?'ჯავშნის დადასტურება':'შესვლა და დაჯავშნა'} ↗</button></div>
 <p className={styles.note}>გადახდა არ ხდება. ფასები და ნომრის საბოლოო კატეგორია დასადასტურებელია სასტუმროსთან.</p>{property?.is_demo&&<p className={styles.demo}>სატესტო ინვენტარი — რეალური დაჯავშნა არ არის.</p>}
 </form>}
 <aside className={styles.bookAside}><span className={styles.kicker}>HOTEL MAGNOLIA</span><h2>More than a stay.</h2><p>ერთი Episode პროფილით აკონტროლებ სასტუმროსა და რესტორნის ჯავშნებს, შეფასებებს და ქულებს.</p><Link href="/account">My Episode ↗</Link></aside></section></Frame>;
}
