import type {Metadata} from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {notFound} from 'next/navigation';

const names:Record<string,{name:string;logo?:string}>={
  batumi:{name:'ბათუმის სახლში',logo:'/brand/batumis-sakhlshi.png'},
  kutaisi:{name:'ქუთაისის სახლში',logo:'/brand/kutaisis-sakhlshi.png'},
  tbilisi:{name:'თბილისის სახლში'},
};
export const metadata:Metadata={
  title:'Restaurant Menu — Episode Holding',
  description:'Discover the dining experiences and menus of Episode Holding restaurants.',
};
export default async function MenuPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const venue=names[slug];
  if(!venue)notFound();
  return <div lang="ka" style={{minHeight:'70vh',background:'#faf8f3',color:'#20342c',padding:'60px clamp(22px,6vw,100px)'}}>
    <Link href={'/places/'+encodeURIComponent(slug)} style={{fontSize:12,color:'#9b754b'}}>← რესტორნის გვერდზე დაბრუნება</Link>
    {venue.logo&&<div style={{marginTop:32}}><Image src={venue.logo} alt={venue.name+' ლოგო'} width={95} height={95} unoptimized/></div>}
    <p style={{letterSpacing:3,color:'#98734b',fontSize:11,margin:'32px 0 12px'}}>EPISODE FOOD · MENU</p>
    <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(38px,5vw,65px)',margin:'0 0 18px'}}>მენიუ · {venue.name}</h1>
    <p style={{fontSize:15,color:'#687267',lineHeight:1.9,maxWidth:580}}>სრული მენიუ და ფასები აქ გამოჩნდება, როგორც კი რესტორნის მიერ დადასტურებულ მასალებს დავამატებთ.</p>
    <div style={{display:'flex',gap:13,flexWrap:'wrap',marginTop:35}}>
      <Link href={'/places/'+encodeURIComponent(slug)+'#reservation'} style={{display:'inline-block',padding:'15px 22px',background:'#caa46e',color:'#1b2d25',borderRadius:7}}>მაგიდის დაჯავშნა →</Link>
      <Link href={'/places/'+encodeURIComponent(slug)} style={{display:'inline-block',padding:'15px 22px',border:'1px solid #d2c2ae',borderRadius:7}}>რესტორნის ნახვა</Link>
    </div>
  </div>;
}
