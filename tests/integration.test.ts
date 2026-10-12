import { test,before,after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { database } from '../lib/db.ts';
import { migrate } from '../lib/migrate.ts';
import { seed,DEMO_PROPERTIES } from '../lib/seed.ts';
import { createReservation,cancelReservation,completeReservation,listReservations } from '../lib/reservations.ts';
import { wallet,redeem } from '../lib/loyalty.ts';
import { auth } from '../lib/auth.ts';
import { handle } from '../lib/api.ts';
import { POST as authPost } from '../app/api/auth/[...all]/route.ts';
if(process.env.EPISODE_TEST_DATABASE!=='1'||!new URL(process.env.DATABASE_URL||'http://invalid').pathname.endsWith('_test'))throw new Error('Use an isolated database ending in _test and EPISODE_TEST_DATABASE=1. Integration tests reset this database.');
const a=randomUUID(),b=randomUUID(),admin=randomUUID(),manager=randomUUID(),p=DEMO_PROPERTIES[0].id,p2=DEMO_PROPERTIES[1].id;
const date=new Date(Date.now()+20*86400000).toISOString().slice(0,10);
const booking=(extra:Record<string,unknown>={})=>({propertyId:p,kind:'table',date,time:'19:00',duration:120,guests:8,requestKey:randomUUID(),...extra});
before(async()=>{
  await migrate();await migrate();
  await database().query('TRUNCATE "user",properties,rate_buckets,email_outbox CASCADE');
  await seed();await seed();
  for(const [id,name] of [[a,'Guest A'],[b,'Guest B'],[admin,'Admin'],[manager,'Manager']])await database().query('INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES($1,$2,$3,true,now(),now())',[id,name,id+'@example.test']);
  await database().query("INSERT INTO staff_memberships(id,user_id,role) VALUES($1,$2,'admin')",[randomUUID(),admin]);
  await database().query("INSERT INTO staff_memberships(id,user_id,property_id,role) VALUES($1,$2,$3,'manager')",[randomUUID(),manager,p2]);
});
after(async()=>{await database().end();});
test('Concurrent requests for the last suitable table produce one reservation',async()=>{
  const results=await Promise.allSettled([createReservation(a,booking()),createReservation(b,booking())]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
  const winner=results.find(r=>r.status==='fulfilled');assert.ok(winner&&winner.status==='fulfilled');
  await cancelReservation(winner.value.user_id,winner.value.id);
});
test('Same-key retries are idempotent; changed payload with same key is rejected',async()=>{
  const input=booking({time:'12:00'});const results=await Promise.all([createReservation(a,input),createReservation(a,input)]);
  assert.equal(results[0].id,results[1].id);await assert.rejects(createReservation(a,{...input,guests:6}),{status:409});await cancelReservation(a,results[0].id);
});
test('Users cannot access or cancel another user reservation; managers are scoped to assigned properties',async()=>{
  const row=await createReservation(a,booking({time:'14:00'}));
  assert.ok(!(await listReservations(b)).some(v=>v.id===row.id));
  assert.ok(!(await listReservations(manager,true)).some(v=>v.id===row.id));
  await assert.rejects(cancelReservation(b,row.id),{status:404});await assert.rejects(cancelReservation(manager,row.id),{status:404});
  await assert.rejects(completeReservation(manager,row.id,1000),{status:403});await cancelReservation(admin,row.id);
});
test('Event capacity remains safe under concurrent reservations',async()=>{
  const e=(await database().query('SELECT id FROM events WHERE property_id=$1',[p])).rows[0];
  await database().query('UPDATE events SET capacity=3 WHERE id=$1',[e.id]);
  const input={propertyId:p,kind:'event',eventId:e.id,date,guests:2};
  const rows=await Promise.allSettled([createReservation(a,{...input,requestKey:randomUUID()}),createReservation(b,{...input,requestKey:randomUUID()})]);
  assert.equal(rows.filter(r=>r.status==='fulfilled').length,1);
});
test('Database exclusion constraint blocks overlapping resource allocations',async()=>{
  const row=await createReservation(a,booking({time:'10:00'}));
  await assert.rejects(database().query(`INSERT INTO reservations(id,user_id,property_id,resource_id,kind,starts_at,ends_at,guests,request_key,request_hash) VALUES($1,$2,$3,$4,'table',$5,$6,1,$7,'test')`,[randomUUID(),b,p,row.resource_id,row.starts_at,row.ends_at,randomUUID()]),{code:'23P01'});
  await cancelReservation(a,row.id);
});
test('Completion credits once and concurrent reward requests cannot overspend',async()=>{
  const row=await createReservation(a,booking({time:'09:00'}));
  await database().query("UPDATE reservations SET starts_at=now()-interval '3 hours',ends_at=now()-interval '1 hour' WHERE id=$1",[row.id]);
  await Promise.all([completeReservation(admin,row.id,20000),completeReservation(admin,row.id,20000)]);
  assert.equal((await wallet(a)).points,200);await assert.rejects(completeReservation(admin,row.id,21000),{status:409});
  const requests=[randomUUID(),randomUUID()];const r=await Promise.allSettled(requests.map(key=>redeem(a,'dessert',key)));
  assert.equal(r.filter(v=>v.status==='fulfilled').length,1);assert.equal((await wallet(a)).points,80);
  const key=requests[r.findIndex(v=>v.status==='fulfilled')];await redeem(a,'dessert',key);assert.equal((await wallet(a)).points,80);
});
test('Room inventory allows a new stay after checkout and blocks overlapping dates',async()=>{
  const input={propertyId:DEMO_PROPERTIES[2].id,kind:'room',date,nights:2,guests:4,requestKey:randomUUID()};
  await createReservation(a,input);await assert.rejects(createReservation(b,{...input,requestKey:randomUUID()}),{status:409});
  const later=new Date(Date.parse(date+'T00:00:00Z')+2*86400000).toISOString().slice(0,10);
  await createReservation(b,{...input,date:later,requestKey:randomUUID()});
});
const origin=()=>process.env.APP_ORIGIN!;
async function authRequest(path:string,body:object,cookie=''){
  return authPost(new Request(origin()+'/api/auth/'+path,{method:'POST',headers:{origin:origin(),'content-type':'application/json',cookie},body:JSON.stringify(body)}));
}
test('Registration, verification, secure session, password reset and logout work end to end',async()=>{
  const email='registration-'+randomUUID()+'@example.test',password='Synthetic-password-'+randomUUID();
  const signup=await authRequest('sign-up/email',{name:'Test Guest',email,password,callbackURL:origin()+'/?verified=1'});assert.equal(signup.status,200);
  const account=(await database().query('SELECT a.password FROM account a JOIN "user" u ON u.id=a."userId" WHERE u.email=$1',[email])).rows[0];
  assert.ok(account.password);assert.notEqual(account.password,password);
  assert.equal((await authRequest('sign-in/email',{email,password})).status,403);
  const mail=(await database().query('SELECT body FROM email_outbox WHERE recipient=$1 ORDER BY created_at DESC LIMIT 1',[email])).rows[0].body;
  const url=mail.match(/https?:\/\/\S+/)[0];const verify=await auth().handler(new Request(url));assert.ok([200,302].includes(verify.status));
  const login=await authRequest('sign-in/email',{email,password});assert.equal(login.status,200);
  const cookies=login.headers.getSetCookie();assert.ok(cookies.some(v=>/httponly/i.test(v)&&/samesite=lax/i.test(v)));
  const cookie=cookies.map(v=>v.split(';')[0]).join('; ');
  const session=await handle(new Request(origin()+'/api/me',{headers:{cookie}}),'me');const current=await session.json();assert.equal(current.user.email,email);assert.equal(current.isStaff,false);
  const denied=await handle(new Request(origin()+'/api/staff/reservations',{headers:{cookie}}),'staff/reservations');assert.equal(denied.status,403);
  const cross=await handle(new Request(origin()+'/api/profile',{method:'POST',headers:{cookie,origin:'https://other.example','content-type':'application/json'},body:'{}'}),'profile');assert.equal(cross.status,403);
  const reset=await authRequest('request-password-reset',{email,redirectTo:origin()+'/?reset=1'});assert.equal(reset.status,200);
  const resetBody=(await database().query("SELECT body FROM email_outbox WHERE recipient=$1 AND subject LIKE 'Reset%' ORDER BY created_at DESC LIMIT 1",[email])).rows[0].body;
  const resetLink=resetBody.match(/https?:\/\/\S+/)[0];const redirect=await auth().handler(new Request(resetLink));
  const destination=new URL(redirect.headers.get('location')!);const token=destination.searchParams.get('token');assert.ok(token);
  const newPassword='Replacement-password-'+randomUUID();assert.equal((await authRequest('reset-password',{token,newPassword})).status,200);
  assert.equal((await handle(new Request(origin()+'/api/me',{headers:{cookie}}),'me')).status,200);
  assert.equal((await (await handle(new Request(origin()+'/api/me',{headers:{cookie}}),'me')).json()).user,null);
  assert.equal((await authRequest('sign-in/email',{email,password})).status,401);
  assert.equal((await authRequest('sign-in/email',{email,password:newPassword})).status,429);
  await database().query('UPDATE "rateLimit" SET "lastRequest"=0');
  const fresh=await authRequest('sign-in/email',{email,password:newPassword});assert.equal(fresh.status,200);
  const freshCookie=fresh.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
  assert.equal((await authRequest('sign-out',{},freshCookie)).status,200);
  assert.equal((await (await handle(new Request(origin()+'/api/me',{headers:{cookie:freshCookie}}),'me')).json()).user,null);
});

test('Availability preview respects existing stays and does not consume inventory',async()=>{
  const {availability}=await import('../lib/operations.ts');
  const input=booking({time:'21:00'});const first=await availability(input),again=await availability(input);
  assert.equal(first.remaining,again.remaining);assert.equal(first.available,true);
  const row=await createReservation(a,input);assert.equal((await availability(input)).available,false);await cancelReservation(a,row.id);
});
test('Only completed, owned visits can be reviewed and every rating is public',async()=>{
  const {writeReview,publicReviews}=await import('../lib/operations.ts');
  const completed=(await database().query("SELECT id FROM reservations WHERE user_id=$1 AND status='completed' LIMIT 1",[a])).rows[0];
  const input={reservationId:completed.id,rating:1,body:'A disappointing visit. Honest feedback should still appear.'};
  await assert.rejects(writeReview(b,input),{status:404});
  const review=await writeReview(a,input);assert.equal((await writeReview(a,input)).id,review.id);
  assert.ok((await publicReviews(p)).some(r=>r.id===review.id&&r.rating===1));
  await assert.rejects(writeReview(a,{...input,rating:5}),{status:409});
  const row=await createReservation(a,booking({time:'22:00'}));await assert.rejects(writeReview(a,{...input,reservationId:row.id}),{status:409});await cancelReservation(a,row.id);
});
test('Catalog management is scoped, inventory edits preserve booked capacity, and admins assign managers',async()=>{
  const {saveProperty,saveResource,saveEvent,staffInventory,setManager}=await import('../lib/operations.ts');
  const input={slug:'test-new-venue',name:'Integration Venue',city:'Batumi',kind:'restaurant',description:'Synthetic test venue',active:true,isDemo:true};
  await assert.rejects(saveProperty(a,input),{status:403});
  const venue=await saveProperty(admin,input);
  await assert.rejects(saveResource(manager,{propertyId:venue.id,kind:'table',label:'Table X',capacity:4,active:true}),{status:403});
  await setManager(admin,{email:b+'@example.test',propertyId:venue.id});
  const resource=await saveResource(b,{propertyId:venue.id,kind:'table',label:'Table X',capacity:4,active:true});
  const row=await createReservation(a,booking({propertyId:venue.id,guests:4}));
  await assert.rejects(saveResource(b,{id:resource.id,propertyId:venue.id,kind:'table',label:'Table X',capacity:2,active:true}),{status:409});
  await saveResource(b,{id:resource.id,propertyId:venue.id,kind:'table',label:'Table X',capacity:4,active:false});
  assert.ok(!(await staffInventory(manager)).properties.some(v=>v.id===venue.id));
  const event=(await database().query('SELECT * FROM events WHERE property_id=$1',[p])).rows[0];
  const eventInput={id:event.id,propertyId:p,slug:event.slug,title:event.title,startsAt:event.starts_at.toISOString(),endsAt:event.ends_at.toISOString(),capacity:1,active:true};
  await assert.rejects(saveEvent(admin,eventInput),{status:409});
  await assert.rejects(saveEvent(admin,{...eventInput,capacity:3,startsAt:new Date(event.starts_at.getTime()+3600000).toISOString()}),{status:409});
  await setManager(admin,{email:b+'@example.test',propertyId:venue.id,remove:true});
  await assert.rejects(staffInventory(b),{status:403});await cancelReservation(admin,row.id);
});
