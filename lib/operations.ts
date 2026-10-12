import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { database,transaction } from './db.ts';
import { bookingSchema } from './contracts.ts';
import { localTimestamp,validateFuture } from './domain.ts';
import { HttpError } from './http.ts';
import { requireManager } from './permissions.ts';
import { audit } from './reservations.ts';
const id=z.string().uuid();
export async function availability(raw:unknown){
  const input=bookingSchema.parse(raw);
  const property=(await database().query('SELECT kind,active FROM properties WHERE id=$1',[input.propertyId])).rows[0];
  if(!property?.active)throw new HttpError(404,'Property unavailable.');
  if(input.kind==='event'){
    const e=(await database().query(`SELECT e.starts_at,e.ends_at,e.capacity-COALESCE((SELECT SUM(guests) FROM reservations WHERE event_id=e.id AND status IN ('confirmed','completed')),0)::int remaining FROM events e WHERE e.id=$1 AND e.property_id=$2 AND e.active=true`,[input.eventId,input.propertyId])).rows[0];
    if(!e)throw new HttpError(404,'Event unavailable.');validateFuture(e.starts_at);
    return {available:e.remaining>=input.guests,remaining:e.remaining,startsAt:e.starts_at,endsAt:e.ends_at};
  }
  if(property.kind!==(input.kind==='room'?'hotel':'restaurant'))throw new HttpError(400,'Booking type does not match the venue.');
  const start=localTimestamp(input.date,input.kind==='room'?'14:00':input.time!),end=new Date(start.getTime()+(input.kind==='room'?input.nights!*86400000-7200000:input.duration!*60000));validateFuture(start);
  const rows=await database().query(`SELECT count(*)::int remaining FROM resources r WHERE r.property_id=$1 AND r.kind=$2 AND r.active=true AND r.capacity >= $3 AND NOT EXISTS(SELECT 1 FROM reservations b WHERE b.resource_id=r.id AND b.status IN ('confirmed','completed') AND tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange($4::timestamptz,$5::timestamptz,'[)'))`,[input.propertyId,input.kind,input.guests,start,end]);
  return {available:rows.rows[0].remaining>0,remaining:rows.rows[0].remaining,startsAt:start,endsAt:end};
}
const reviewSchema=z.object({reservationId:id,rating:z.number().int().min(1).max(5),body:z.string().trim().min(10).max(2000)}).strict();
export async function writeReview(userId:string,raw:unknown){
  const input=reviewSchema.parse(raw);return transaction(async client=>{
    const b=(await client.query('SELECT property_id,status FROM reservations WHERE id=$1 AND user_id=$2 FOR UPDATE',[input.reservationId,userId])).rows[0];
    if(!b)throw new HttpError(404,'Reservation not found.');if(b.status!=='completed')throw new HttpError(409,'Reviews are available after a completed visit.');
    const existing=(await client.query('SELECT * FROM reviews WHERE reservation_id=$1',[input.reservationId])).rows[0];
    if(existing){if(existing.rating!==input.rating||existing.body!==input.body)throw new HttpError(409,'This visit already has a review.');return existing;}
    const row=(await client.query('INSERT INTO reviews(id,user_id,reservation_id,property_id,rating,body) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[randomUUID(),userId,input.reservationId,b.property_id,input.rating,input.body])).rows[0];
    await audit(client,userId,'review.created',row.id);return row;
  });
}
export async function publicReviews(propertyId?:string){
  if(propertyId)id.parse(propertyId);
  return (await database().query(`SELECT r.id,r.rating,r.body,r.created_at,p.name property_name,p.slug property_slug,split_part(u.name,' ',1) guest_name FROM reviews r JOIN properties p ON p.id=r.property_id JOIN "user" u ON u.id=r.user_id WHERE ($1::uuid IS NULL OR r.property_id=$1::uuid) ORDER BY r.created_at DESC LIMIT 100`,[propertyId??null])).rows;
}
async function requireAdmin(client:import('pg').PoolClient,userId:string){if(!(await client.query("SELECT 1 FROM staff_memberships WHERE user_id=$1 AND role='admin'",[userId])).rowCount)throw new HttpError(403,'Administrator access is required.');}
const propertySchema=z.object({id:id.optional(),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60),name:z.string().trim().min(2).max(100),city:z.enum(['Tbilisi','Batumi','Kutaisi','Telavi']),kind:z.enum(['restaurant','hotel']),description:z.string().trim().max(2000),active:z.boolean(),isDemo:z.boolean()}).strict();
const resourceSchema=z.object({id:id.optional(),propertyId:id,kind:z.enum(['table','room']),label:z.string().trim().min(1).max(60),capacity:z.number().int().min(1).max(24),active:z.boolean()}).strict();
const eventSchema=z.object({id:id.optional(),propertyId:id,slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60),title:z.string().trim().min(2).max(100),startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true}),capacity:z.number().int().min(1).max(2000),active:z.boolean()}).strict();
export async function saveProperty(actor:string,raw:unknown){const p=propertySchema.parse(raw);return transaction(async client=>{
  await requireAdmin(client,actor);const key=p.id??randomUUID();
  if(p.id){const old=(await client.query('SELECT kind FROM properties WHERE id=$1 FOR UPDATE',[p.id])).rows[0];if(!old)throw new HttpError(404,'Property not found.');if(old.kind!==p.kind)throw new HttpError(409,'A property type cannot be changed after creation.');}
  const row=(await client.query(`INSERT INTO properties(id,slug,name,city,kind,description,active,is_demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name=excluded.name,city=excluded.city,description=excluded.description,active=excluded.active,is_demo=excluded.is_demo RETURNING *`,[key,p.slug,p.name,p.city,p.kind,p.description,p.active,p.isDemo])).rows[0];await audit(client,actor,'property.saved',key);return row;
});}
export async function saveResource(actor:string,raw:unknown){const r=resourceSchema.parse(raw);return transaction(async client=>{
  await requireManager(client,actor,r.propertyId);
  const p=(await client.query('SELECT kind FROM properties WHERE id=$1 FOR UPDATE',[r.propertyId])).rows[0];if(!p)throw new HttpError(404,'Property not found.');if(r.kind!==(p.kind==='hotel'?'room':'table'))throw new HttpError(400,'Resource type does not match property.');
  const key=r.id??randomUUID();if(r.id){const old=(await client.query('SELECT property_id FROM resources WHERE id=$1',[r.id])).rows[0];if(old?.property_id!==r.propertyId)throw new HttpError(404,'Resource not found.');
    if((await client.query("SELECT 1 FROM reservations WHERE resource_id=$1 AND status='confirmed' AND ends_at>now() AND guests>$2 LIMIT 1",[key,r.capacity])).rowCount)throw new HttpError(409,'Capacity cannot be reduced below a current reservation.');}
  const row=(await client.query(`INSERT INTO resources(id,property_id,kind,label,capacity,active) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET label=excluded.label,capacity=excluded.capacity,active=excluded.active RETURNING *`,[key,r.propertyId,r.kind,r.label,r.capacity,r.active])).rows[0];await audit(client,actor,'resource.saved',key);return row;
});}
export async function saveEvent(actor:string,raw:unknown){const e=eventSchema.parse(raw);const start=new Date(e.startsAt),end=new Date(e.endsAt);if(end<=start)throw new HttpError(400,'End must be after start.');return transaction(async client=>{
  await requireManager(client,actor,e.propertyId);await client.query('SELECT id FROM properties WHERE id=$1 FOR UPDATE',[e.propertyId]);const key=e.id??randomUUID();
  if(e.id){const old=(await client.query('SELECT * FROM events WHERE id=$1 FOR UPDATE',[e.id])).rows[0];if(old?.property_id!==e.propertyId)throw new HttpError(404,'Event not found.');
    const used=Number((await client.query("SELECT COALESCE(SUM(guests),0) guests FROM reservations WHERE event_id=$1 AND status IN ('confirmed','completed')",[key])).rows[0].guests);
    if(e.capacity<used)throw new HttpError(409,'Capacity cannot be lower than reserved places.');
    if(used&&(old.starts_at.getTime()!==start.getTime()||old.ends_at.getTime()!==end.getTime()))throw new HttpError(409,'An event with reservations cannot be rescheduled here.');
  }else validateFuture(start);
  const row=(await client.query(`INSERT INTO events(id,property_id,slug,title,starts_at,ends_at,capacity,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,capacity=excluded.capacity,active=excluded.active RETURNING *`,[key,e.propertyId,e.slug,e.title,start,end,e.capacity,e.active])).rows[0];await audit(client,actor,'event.saved',key);return row;
});}
export async function staffInventory(userId:string){
  const memberships=(await database().query('SELECT role,property_id FROM staff_memberships WHERE user_id=$1',[userId])).rows;if(!memberships.length)throw new HttpError(403,'Staff access is required.');
  const all=memberships.some(m=>m.role==='admin'),ids=memberships.map(m=>m.property_id).filter(Boolean);
  const properties=(await database().query('SELECT * FROM properties WHERE $1 OR id=ANY($2::uuid[]) ORDER BY name',[all,ids])).rows;
  const resources=(await database().query('SELECT * FROM resources WHERE $1 OR property_id=ANY($2::uuid[]) ORDER BY label',[all,ids])).rows;
  const events=(await database().query('SELECT * FROM events WHERE $1 OR property_id=ANY($2::uuid[]) ORDER BY starts_at DESC',[all,ids])).rows;
  return {isAdmin:all,properties,resources,events};
}
const memberSchema=z.object({email:z.string().email(),propertyId:id,remove:z.boolean().default(false)}).strict();
export async function setManager(actor:string,raw:unknown){const input=memberSchema.parse(raw);return transaction(async client=>{
  await requireAdmin(client,actor);const user=(await client.query('SELECT id,"emailVerified" FROM "user" WHERE lower(email)=$1',[input.email.toLowerCase()])).rows[0];
  if(!user?.emailVerified)throw new HttpError(400,'Create and verify that staff account first.');
  if(input.remove)await client.query("DELETE FROM staff_memberships WHERE user_id=$1 AND property_id=$2 AND role='manager'",[user.id,input.propertyId]);
  else await client.query("INSERT INTO staff_memberships(id,user_id,property_id,role) VALUES($1,$2,$3,'manager') ON CONFLICT(user_id,property_id) DO NOTHING",[randomUUID(),user.id,input.propertyId]);
  await audit(client,actor,input.remove?'staff.manager_removed':'staff.manager_granted',user.id,{propertyId:input.propertyId});return {ok:true};
});}
