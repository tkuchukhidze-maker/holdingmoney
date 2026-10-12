import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { transaction, database } from './db.ts';
import { bookingSchema, type BookingInput } from './contracts.ts';
import { hashPayload, localTimestamp, pointsForSpend, validateFuture } from './domain.ts';
import { HttpError } from './http.ts';
import { canManage, requireManager } from './permissions.ts';
export type Reservation={id:string;user_id:string;property_id:string;resource_id:string|null;event_id:string|null;kind:'table'|'room'|'event';starts_at:Date;ends_at:Date;guests:number;status:'confirmed'|'cancelled'|'completed';amount_tetri:number;request_hash:string;notes:string};
export async function audit(client:PoolClient,actor:string,action:string,id:string,details:object={}){await client.query('INSERT INTO audit_log(id,actor_id,action,entity_id,details) VALUES($1,$2,$3,$4,$5)',[randomUUID(),actor,action,id,JSON.stringify(details)]);}
function interval(input:BookingInput){
  const start=localTimestamp(input.date,input.kind==='room'?'14:00':input.time??'00:00');
  const end=input.kind==='room'?new Date(start.getTime()+input.nights!*86400000-2*3600000):new Date(start.getTime()+(input.duration??120)*60000);
  return {start,end};
}
export async function createReservation(userId:string,raw:unknown){
  const input=bookingSchema.parse(raw);
  const hash=hashPayload(input);
  return transaction(async client=>{
    // Same-key requests serialize, including requests for different properties.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`booking:${userId}:${input.requestKey}`]);
    const previous=await client.query<Reservation>('SELECT * FROM reservations WHERE user_id=$1 AND request_key=$2',[userId,input.requestKey]);
    if(previous.rows[0]){if(previous.rows[0].request_hash!==hash)throw new HttpError(409,'This request key was used for a different booking.');return previous.rows[0];}
    // Every booking for a venue takes this lock before evaluating inventory.
    const property=await client.query<{kind:string;active:boolean}>('SELECT kind,active FROM properties WHERE id=$1 FOR UPDATE',[input.propertyId]);
    if(!property.rows[0]?.active)throw new HttpError(404,'This property is unavailable.');
    if(input.kind!=='event'&&property.rows[0].kind!==(input.kind==='room'?'hotel':'restaurant'))throw new HttpError(400,'This booking type does not match the property.');
    let {start,end}=interval(input);let resourceId:string|null=null;
    if(input.kind==='event'){
      const event=await client.query<{starts_at:Date;ends_at:Date;capacity:number}>('SELECT starts_at,ends_at,capacity FROM events WHERE id=$1 AND property_id=$2 AND active=true FOR UPDATE',[input.eventId,input.propertyId]);
      if(!event.rows[0])throw new HttpError(404,'This event is unavailable.');
      start=event.rows[0].starts_at;end=event.rows[0].ends_at;
      const occupied=await client.query<{guests:string}>('SELECT COALESCE(SUM(guests),0) guests FROM reservations WHERE event_id=$1 AND status IN (\'confirmed\',\'completed\')',[input.eventId]);
      if(Number(occupied.rows[0].guests)+input.guests>event.rows[0].capacity)throw new HttpError(409,'This event does not have enough places left.');
    }else{
      const resources=await client.query<{id:string}>(`
        SELECT r.id FROM resources r WHERE r.property_id=$1 AND r.kind=$2 AND r.active=true AND r.capacity >= $3
        AND NOT EXISTS(SELECT 1 FROM reservations b WHERE b.resource_id=r.id AND b.status IN ('confirmed','completed')
          AND tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange($4::timestamptz,$5::timestamptz,'[)'))
        ORDER BY r.capacity,r.label,r.id LIMIT 1 FOR UPDATE OF r`,[input.propertyId,input.kind,input.guests,start,end]);
      resourceId=resources.rows[0]?.id??null;
      if(!resourceId)throw new HttpError(409,'No suitable '+(input.kind==='room'?'room':'table')+' is available. Choose another date, time or guest count.');
    }
    validateFuture(start);
    const result=await client.query<Reservation>(`INSERT INTO reservations(id,user_id,property_id,resource_id,event_id,kind,starts_at,ends_at,guests,notes,request_key,request_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[randomUUID(),userId,input.propertyId,resourceId,input.eventId??null,input.kind,start,end,input.guests,input.notes,input.requestKey,hash]);
    await audit(client,userId,'reservation.created',result.rows[0].id,{propertyId:input.propertyId,kind:input.kind});
    return result.rows[0];
  });
}
export async function cancelReservation(actor:string,id:string){return transaction(async client=>{
  const result=await client.query<Reservation>('SELECT * FROM reservations WHERE id=$1 FOR UPDATE',[id]);const booking=result.rows[0];
  if(!booking||(booking.user_id!==actor&&!await canManage(client,actor,booking.property_id)))throw new HttpError(404,'Reservation not found.');
  if(booking.status==='cancelled')return booking;
  if(booking.status!=='confirmed')throw new HttpError(409,'This reservation cannot be cancelled.');
  if(booking.user_id===actor&&booking.starts_at.getTime()<=Date.now())throw new HttpError(409,'Contact the venue to change a visit that has started.');
  const update=await client.query<Reservation>('UPDATE reservations SET status=\'cancelled\' WHERE id=$1 RETURNING *',[id]);
  await audit(client,actor,'reservation.cancelled',id);return update.rows[0];
});}
export async function completeReservation(actor:string,id:string,amountTetri:number){return transaction(async client=>{
  const result=await client.query<Reservation>('SELECT * FROM reservations WHERE id=$1 FOR UPDATE',[id]);const booking=result.rows[0];
  if(!booking)throw new HttpError(404,'Reservation not found.');
  await requireManager(client,actor,booking.property_id);
  if(booking.status==='completed'){if(booking.amount_tetri!==amountTetri)throw new HttpError(409,'The completed amount cannot be changed.');return booking;}
  if(booking.status!=='confirmed'||booking.starts_at.getTime()>Date.now())throw new HttpError(409,'Only a started, confirmed visit can be completed.');
  const points=pointsForSpend(amountTetri);
  await client.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE',[booking.user_id]);
  const update=await client.query<Reservation>('UPDATE reservations SET status=\'completed\',amount_tetri=$2 WHERE id=$1 RETURNING *',[id,amountTetri]);
  await client.query('INSERT INTO points_ledger(id,user_id,reservation_id,source,points,label) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),booking.user_id,id,`visit:${id}`,points,'Completed visit']);
  await audit(client,actor,'reservation.completed',id,{amountTetri,points});return update.rows[0];
});}
export async function listReservations(userId:string,staff=false){
  const where=staff?'EXISTS(SELECT 1 FROM staff_memberships m WHERE m.user_id=$1 AND (m.role=\'admin\' OR m.property_id=b.property_id))':'b.user_id=$1';
  return (await database().query(`SELECT b.id,b.property_id,b.kind,b.starts_at,b.ends_at,b.guests,b.status,b.amount_tetri,b.notes,
    p.name property_name,p.city,r.label resource_label,e.title event_title,u.name guest_name,EXISTS(SELECT 1 FROM reviews rv WHERE rv.reservation_id=b.id) reviewed
    FROM reservations b JOIN properties p ON p.id=b.property_id JOIN "user" u ON u.id=b.user_id
    LEFT JOIN resources r ON r.id=b.resource_id LEFT JOIN events e ON e.id=b.event_id
    WHERE ${where} ORDER BY b.starts_at DESC LIMIT 100`,[userId])).rows;
}
