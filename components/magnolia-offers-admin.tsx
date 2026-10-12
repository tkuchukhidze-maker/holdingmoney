'use client';
import Link from 'next/link';
import {useEffect,useState,type FormEvent} from 'react';
import {api,dateOnly,useSite} from './site';
type Offer={id:string;property_id:string;slug:string;title:string;summary:string;terms:string;discount_percent:number|null;min_nights:number;starts_at:string;ends_at:string;active:boolean};
const dateTimeLocal=(value:string)=>new Date(value).toISOString().slice(0,16);
const tomorrow=()=>dateTimeLocal(new Date(Date.now()+86400000).toISOString());
const inMonth=()=>dateTimeLocal(new Date(Date.now()+31*86400000).toISOString());
export function MagnoliaOffersAdmin(){
 const {properties,member,loading}=useSite(),property=properties.find(p=>p.slug==='magnolia'&&p.kind==='hotel');
 const [offers,setOffers]=useState<Offer[]>([]),[editing,setEditing]=useState<Offer|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 async function refresh(){if(!property)return;try{const result=await api<{offers:Offer[]}>('staff/hotel-offers?propertyId='+property.id);setOffers(result.offers);setError('');}catch(err){setError((err as Error).message);}}
 useEffect(()=>{void refresh();},[property?.id]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!property)return;setSaving(true);setError('');
  const v=Object.fromEntries(new FormData(e.currentTarget));
  try{
   const payload={...(editing?{id:editing.id}:{}),propertyId:property.id,slug:String(v.slug),title:String(v.title),summary:String(v.summary),terms:String(v.terms||''),
    discountPercent:v.discount?Number(v.discount):null,minNights:Number(v.minNights),startsAt:new Date(String(v.startsAt)).toISOString(),endsAt:new Date(String(v.endsAt)).toISOString(),active:v.active==='on'};
   await api('staff/hotel-offers',payload);setEditing(null);await refresh();(e.target as HTMLFormElement).reset();
  }catch(err){setError((err as Error).message);}finally{setSaving(false);}
 }
 if(loading)return <main className="container"><h1>იტვირთება…</h1></main>;
 if(!member.isStaff)return <main className="container"><h1>წვდომა შეზღუდულია</h1><p>ეს გვერდი ხელმისაწვდომია მხოლოდ Episode-ის თანამშრომლებისთვის.</p><Link href="/auth">შესვლა</Link></main>;
 return <main className="container" lang="ka"><section className="page-heading"><div><p className="eyebrow">MANAGE PROMOTIONS</p><h1>Magnolia · აქციების მართვა</h1><p className="lead">შეთავაზებები საჯაროდ ჩანს მხოლოდ აქტიური თარიღების ფარგლებში.</p></div><Link className="button secondary" href="/places/magnolia/offers">გახსენი სასტუმროს აქციები</Link></section>
 {error&&<p role="alert" className="notice error">{error}</p>}
 <div className="booking-layout"><form className="form-panel" key={editing?.id||'new'} onSubmit={e=>void submit(e)}>
 <h2>{editing?'აქციის რედაქტირება':'ახალი აქცია'}</h2>
 <div className="form-grid">
 <label>Slug<input required name="slug" defaultValue={editing?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="romantic-getaway"/></label>
 <label>სათაური<input name="title" defaultValue={editing?.title} required minLength={2} maxLength={100}/></label>
 <label className="wide">მოკლე აღწერა<input name="summary" defaultValue={editing?.summary} required maxLength={250}/></label>
 <label>ფასდაკლება % (არასავალდებულო)<input name="discount" type="number" min="1" max="80" defaultValue={editing?.discount_percent??''}/></label>
 <label>მინ. ღამეები<input name="minNights" type="number" min="1" max="30" defaultValue={editing?.min_nights||1} required/></label>
 <label>დაწყება<input type="datetime-local" name="startsAt" defaultValue={editing?dateTimeLocal(editing.starts_at):tomorrow()} required/></label>
 <label>დასრულება<input type="datetime-local" name="endsAt" defaultValue={editing?dateTimeLocal(editing.ends_at):inMonth()} required/></label>
 <label className="wide">პირობები<textarea name="terms" maxLength={4000} rows={5} defaultValue={editing?.terms||''}/></label>
 <label className="wide"><span>გამოქვეყნება</span><input name="active" type="checkbox" defaultChecked={editing?.active||false} style={{width:18,minHeight:18}}/>აქტიური შეთავაზება</label>
 </div><div className="form-actions"><button className="button" disabled={saving||!property} type="submit">{saving?'ინახება…':'შენახვა'}</button>{editing&&<button type="button" className="button secondary" onClick={()=>setEditing(null)}>გაუქმება</button>}</div>
 </form>
 <aside className="booking-summary"><p className="eyebrow">შეთავაზებები</p><h3>დამატებული აქციები</h3>{offers.length?offers.map(o=><div key={o.id} style={{borderBottom:'1px solid #ddd',padding:'13px 0'}}><strong>{o.title}</strong><p className="small-copy">{o.active?'გამოქვეყნებისთვის მონიშნული':'გამორთული'} · {o.discount_percent?o.discount_percent+'%':'ფასდაკლების გარეშე'}</p><button className="button secondary" onClick={()=>setEditing(o)}>რედაქტირება</button></div>):<p>ჯერ არ არის დამატებული აქცია.</p>}</aside>
 </div></main>
}
