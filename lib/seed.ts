import { randomUUID } from 'node:crypto';
import { transaction } from './db.ts';
export const DEMO_PROPERTIES=[
  {id:'10000000-0000-4000-8000-000000000001',slug:'batumi',name:'Batumis Sakhlshi',city:'Batumi',kind:'restaurant'},
  {id:'10000000-0000-4000-8000-000000000002',slug:'kutaisi',name:'Kutaisis Sakhlshi',city:'Kutaisi',kind:'restaurant'},
  {id:'10000000-0000-4000-8000-000000000003',slug:'magnolia',name:'Magnolia',city:'Tbilisi',kind:'hotel'},
  {id:'10000000-0000-4000-8000-000000000004',slug:'mere',name:'Chateau Mere',city:'Telavi',kind:'hotel'},
] as const;
export async function seed(){return transaction(async client=>{
  for(const property of DEMO_PROPERTIES){
    await client.query('INSERT INTO properties(id,slug,name,city,kind,description,is_demo) VALUES($1,$2,$3,$4,$5,$6,true) ON CONFLICT(id) DO NOTHING',[property.id,property.slug,property.name,property.city,property.kind,'Demo inventory. Replace with verified venue data before launch.']);
    const capacities=property.kind==='restaurant'?[2,2,4,4,6,8]:[2,2,3,4];
    for(const [index,capacity] of capacities.entries())await client.query('INSERT INTO resources(id,property_id,kind,label,capacity) VALUES($1,$2,$3,$4,$5) ON CONFLICT(property_id,label) DO NOTHING',[randomUUID(),property.id,property.kind==='hotel'?'room':'table',(property.kind==='hotel'?'Room ':'Table ')+(index+1),capacity]);
  }
  const titles=['Live Jazz Night','DJ Set','Wine Dinner','Georgian Folk Evening'];const slugs=['jazz','dj','wine','folk'];
  for(const [index,property] of DEMO_PROPERTIES.entries()){
    const start=new Date(Date.now()+(index+2)*86400000);start.setUTCHours(index===1?18:16,0,0,0);
    await client.query('INSERT INTO events(id,property_id,slug,title,starts_at,ends_at,capacity) VALUES($1,$2,$3,$4,$5,$6,30) ON CONFLICT(slug) DO NOTHING',[randomUUID(),property.id,slugs[index],titles[index],start,new Date(start.getTime()+2*3600000)]);
  }
});}
