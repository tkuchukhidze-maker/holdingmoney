import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { database, transaction } from './db.ts';
import { HttpError } from './http.ts';
import { requireManager } from './permissions.ts';
import { audit } from './reservations.ts';
const uuid=z.string().uuid();
const slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60);
const offerSchema=z.object({
  id:uuid.optional(),propertyId:uuid,slug,title:z.string().trim().min(2).max(100),
  summary:z.string().trim().min(1).max(250),terms:z.string().trim().max(4000),
  discountPercent:z.number().int().min(1).max(80).nullable(),minNights:z.number().int().min(1).max(30),
  startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true}),active:z.boolean()
}).strict();
export async function publicHotelOffers(propertySlug:string){
  const venue=slug.parse(propertySlug);
  const rows=await database().query(`SELECT o.id,o.slug,o.title,o.summary,o.terms,o.discount_percent,o.min_nights,
      o.starts_at,o.ends_at,p.is_demo
    FROM hotel_offers o JOIN properties p ON p.id=o.property_id
    WHERE p.slug=$1 AND p.kind='hotel' AND p.active=true AND o.active=true
      AND o.starts_at<=now() AND o.ends_at>now()
    ORDER BY o.ends_at,o.title LIMIT 30`,[venue]);
  return rows.rows;
}
export async function publicHotelRooms(propertySlug:string){
  const venue=slug.parse(propertySlug);
  const rows=await database().query(`SELECT r.label,r.capacity
    FROM resources r JOIN properties p ON p.id=r.property_id
    WHERE p.slug=$1 AND p.kind='hotel' AND p.active=true AND r.kind='room' AND r.active=true
    ORDER BY r.capacity,r.label LIMIT 30`,[venue]);
  return rows.rows;
}
export async function staffHotelOffers(actor:string,propertyId:string){
  const id=uuid.parse(propertyId);const client=await database().connect();
  try{
    await requireManager(client,actor,id);
    const property=await client.query("SELECT kind FROM properties WHERE id=$1",[id]);
    if(property.rows[0]?.kind!=='hotel')throw new HttpError(404,'Hotel not found.');
    const rows=await client.query('SELECT * FROM hotel_offers WHERE property_id=$1 ORDER BY created_at DESC LIMIT 100',[id]);
    return rows.rows;
  }finally{client.release();}
}
export async function saveHotelOffer(actor:string,raw:unknown){
  const input=offerSchema.parse(raw),start=new Date(input.startsAt),end=new Date(input.endsAt);
  if(end<=start)throw new HttpError(400,'Offer end must be later than its start.');
  if(input.active&&end.getTime()<=Date.now())throw new HttpError(400,'An expired offer cannot be published.');
  return transaction(async client=>{
    await requireManager(client,actor,input.propertyId);
    const p=await client.query("SELECT kind FROM properties WHERE id=$1 FOR UPDATE",[input.propertyId]);
    if(p.rows[0]?.kind!=='hotel')throw new HttpError(400,'Offers are available only for hotels.');
    const id=input.id??randomUUID();
    if(input.id){
      const old=await client.query('SELECT property_id FROM hotel_offers WHERE id=$1 FOR UPDATE',[input.id]);
      if(old.rows[0]?.property_id!==input.propertyId)throw new HttpError(404,'Offer not found.');
    }
    const result=await client.query(`INSERT INTO hotel_offers
      (id,property_id,slug,title,summary,terms,discount_percent,min_nights,starts_at,ends_at,active)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,summary=excluded.summary,
      terms=excluded.terms,discount_percent=excluded.discount_percent,min_nights=excluded.min_nights,
      starts_at=excluded.starts_at,ends_at=excluded.ends_at,active=excluded.active
      RETURNING *`,[id,input.propertyId,input.slug,input.title,input.summary,input.terms,input.discountPercent,input.minNights,start,end,input.active]);
    await audit(client,actor,'hotel.offer_saved',id,{active:input.active});
    return result.rows[0];
  });
}
