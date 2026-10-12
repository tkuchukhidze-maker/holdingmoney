import {publicHotelOffers,publicHotelRooms,staffHotelOffers,saveHotelOffer} from './hotel-offers.ts';
import {availability,publicReviews,writeReview,staffInventory,saveProperty,saveResource,saveEvent,setManager} from './operations.ts';
import { database, transaction } from './db.ts';
import { auth, requireUser } from './auth.ts';
import { checkOrigin,failure,HttpError,json,readJson } from './http.ts';
import { completionSchema,profileSchema,reservationIdSchema,rewardSchema } from './contracts.ts';
import { audit,cancelReservation,completeReservation,createReservation,listReservations } from './reservations.ts';
import { localTimestamp } from './domain.ts';
import { redeem,wallet } from './loyalty.ts';
import { consumeLimit } from './rate-limit.ts';
export async function handle(request:Request,path:string){try{
  if(request.method==='GET'&&path==='catalog'){
    const properties=await database().query('SELECT id,slug,name,city,kind,description,is_demo FROM properties WHERE active=true ORDER BY slug');
    const events=await database().query(`SELECT e.id,e.slug,e.property_id,e.title,e.starts_at,e.ends_at,e.capacity,p.name property_name,p.city,
      COALESCE((SELECT SUM(b.guests) FROM reservations b WHERE b.event_id=e.id AND b.status IN ('confirmed','completed')),0)::integer reserved
      FROM events e JOIN properties p ON p.id=e.property_id WHERE e.active=true AND p.active=true AND e.starts_at>now() ORDER BY e.starts_at LIMIT 50`);
    return json({properties:properties.rows,events:events.rows,demo:properties.rows.some(p=>p.is_demo)});
  }
  if(request.method==='GET'&&path==='hotel/offers')return json({offers:await publicHotelOffers(new URL(request.url).searchParams.get('property')||'magnolia')});
  if(request.method==='GET'&&path==='hotel/rooms')return json({rooms:await publicHotelRooms(new URL(request.url).searchParams.get('property')||'magnolia')});
  if(request.method==='GET'&&path==='reviews')return json({reviews:await publicReviews(new URL(request.url).searchParams.get('propertyId')??undefined)});
  if(request.method==='POST'&&path==='availability'){checkOrigin(request);await consumeLimit('availability:global',300);return json(await availability(await readJson(request)));}
  if(request.method==='GET'&&path==='me'){
    const session=await auth().api.getSession({headers:request.headers});
    if(!session)return json({user:null});
    const profile=await database().query('SELECT phone,birthday::text,marketing_consent FROM guest_profiles WHERE user_id=$1',[session.user.id]);
    const staff=await database().query('SELECT role,property_id FROM staff_memberships WHERE user_id=$1',[session.user.id]);
    return json({user:{id:session.user.id,name:session.user.name,email:session.user.email,emailVerified:session.user.emailVerified},profile:profile.rows[0]??{phone:'',birthday:'',marketing_consent:false},isStaff:!!staff.rowCount,wallet:await wallet(session.user.id)});
  }
  if(request.method==='POST')checkOrigin(request);
  const user=await requireUser(request);
  if(request.method==='GET'&&path==='staff/hotel-offers')return json({offers:await staffHotelOffers(user.id,new URL(request.url).searchParams.get('propertyId')||'')});
  if(request.method==='GET'&&path==='staff/inventory')return json(await staffInventory(user.id));
  if(request.method==='GET'&&path==='reservations')return json({reservations:await listReservations(user.id)});
  if(request.method==='GET'&&path==='staff/reservations'){
    const staff=await database().query('SELECT 1 FROM staff_memberships WHERE user_id=$1 LIMIT 1',[user.id]);if(!staff.rowCount)throw new HttpError(403,'Staff access is required.');
    return json({reservations:await listReservations(user.id,true)});
  }
  if(request.method!=='POST')throw new HttpError(404,'Endpoint not found.');
  await consumeLimit('mutations:'+user.id,30);
  const body=await readJson(request);
  if(path==='reviews')return json({review:await writeReview(user.id,body)},201);
  if(path==='staff/properties')return json({property:await saveProperty(user.id,body)});
  if(path==='staff/resources')return json({resource:await saveResource(user.id,body)});
  if(path==='staff/events')return json({event:await saveEvent(user.id,body)});
  if(path==='staff/hotel-offers')return json({offer:await saveHotelOffer(user.id,body)});
  if(path==='staff/members')return json(await setManager(user.id,body));
  if(path==='reservations')return json({reservation:await createReservation(user.id,body)},201);
  if(path==='reservations/cancel'){const {id}=reservationIdSchema.parse(body);return json({reservation:await cancelReservation(user.id,id)});}
  if(path==='staff/complete'){const {id,amountTetri}=completionSchema.parse(body);return json({reservation:await completeReservation(user.id,id,amountTetri)});}
  if(path==='loyalty/redeem'){const {rewardId,requestKey}=rewardSchema.parse(body);return json(await redeem(user.id,rewardId,requestKey));}
  if(path==='profile'){
    const input=profileSchema.parse(body),phone=input.phone.replace(/[\s()-]/g,'');
    if(phone&&!/^\+[1-9]\d{8,14}$/.test(phone))throw new HttpError(400,'Use an international phone number, for example +995599000000.');
    if(input.birthday&&localTimestamp(input.birthday,'00:00').getTime()>Date.now())throw new HttpError(400,'Birthday cannot be in the future.');
    await transaction(async client=>{await client.query(`INSERT INTO guest_profiles(user_id,phone,birthday,marketing_consent) VALUES($1,$2,$3,$4)
      ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,birthday=excluded.birthday,marketing_consent=excluded.marketing_consent,consent_updated_at=now()`,[user.id,phone,input.birthday||null,input.marketingConsent]);
      await audit(client,user.id,'profile.updated',user.id,{marketingConsent:input.marketingConsent});});
    return json({ok:true});
  }
  throw new HttpError(404,'Endpoint not found.');
}catch(error){return failure(error);}}
