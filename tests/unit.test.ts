import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localTimestamp,validateFuture,pointsForSpend,tier,birthdayDistance,hashPayload } from '../lib/domain.ts';
import { bookingSchema,completionSchema,profileSchema } from '../lib/contracts.ts';
import { checkOrigin,readBody } from '../lib/http.ts';
import {hasDatabaseConfiguration} from '../lib/db.ts';

test('Georgia local times are converted exactly and invalid calendar dates are rejected',()=>{
  assert.equal(localTimestamp('2028-02-29','14:00').toISOString(),'2028-02-29T10:00:00.000Z');
  for(const [date,time] of [['2027-02-29','14:00'],['2026-04-31','19:00'],['2026-10-07','25:00']])assert.throws(()=>localTimestamp(date,time));
});
test('Booking dates must be future and within the booking horizon',()=>{
  const now=Date.UTC(2026,9,7);assert.throws(()=>validateFuture(new Date(now),now));
  assert.throws(()=>validateFuture(new Date(now+367*86400000),now));validateFuture(new Date(now+86400000),now);
});
test('Money uses integer tetri and tier boundaries use completed spend',()=>{
  assert.equal(pointsForSpend(199),1);assert.equal(pointsForSpend(0),0);
  for(const n of [-1,1.2,NaN,Infinity])assert.throws(()=>pointsForSpend(n));
  assert.equal(tier(99999),'Member');assert.equal(tier(100000),'Silver');assert.equal(tier(300000),'Gold');assert.equal(tier(1000000),'Black');
});
test('Leap-day birthdays use February 28 in non-leap years',()=>{
  assert.equal(birthdayDistance('2000-02-29',new Date('2027-02-27T12:00:00Z')),1);
  assert.equal(birthdayDistance('2000-02-29',new Date('2028-02-28T12:00:00Z')),1);
});
test('Public booking input cannot assign owners, roles, prices, resources or status',()=>{
  const valid={propertyId:randomUUID(),kind:'table',date:'2026-12-01',time:'19:00',duration:120,guests:2,requestKey:randomUUID()};
  assert.ok(bookingSchema.safeParse(valid).success);
  for(const key of ['userId','role','amountTetri','resourceId','status'])assert.equal(bookingSchema.safeParse({...valid,[key]:'admin'}).success,false);
  assert.equal(bookingSchema.safeParse({...valid,guests:0}).success,false);
  assert.equal(bookingSchema.safeParse({...valid,time:undefined}).success,false);
  assert.equal(bookingSchema.safeParse({...valid,kind:'event'}).success,false);
  assert.equal(completionSchema.safeParse({id:randomUUID(),amountTetri:2.5}).success,false);
  assert.equal(profileSchema.safeParse({phone:'',birthday:'',marketingConsent:false,role:'admin'}).success,false);
});
test('Idempotency fingerprint changes when the requested booking changes',()=>{
  assert.equal(hashPayload({guests:2}),hashPayload({guests:2}));assert.notEqual(hashPayload({guests:2}),hashPayload({guests:3}));
});
test('Mutations reject foreign or missing origins',()=>{
  process.env.APP_ORIGIN='http://localhost:3000';
  checkOrigin(new Request('http://localhost:3000/api/profile',{headers:{origin:process.env.APP_ORIGIN}}));
  assert.throws(()=>checkOrigin(new Request('http://localhost:3000/api/profile')));
  assert.throws(()=>checkOrigin(new Request('http://localhost:3000/api/profile',{headers:{origin:'https://other.example'}})));
});
test('JSON body reader enforces size and content type',async()=>{
  await assert.rejects(readBody(new Request('http://localhost',{method:'POST',body:'{}'})));
  await assert.rejects(readBody(new Request('http://localhost',{method:'POST',headers:{'content-type':'application/json'},body:'123456'}),4));
  assert.equal(await readBody(new Request('http://localhost',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})),'{}');
});

test('Cloud Postgres DB_* variables are supported without DATABASE_URL',()=>{
  const names=['DATABASE_URL','DB_CONNECTION','DB_HOST','DB_DATABASE','DB_USERNAME','DB_PASSWORD'];
  const original=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  try{
    delete process.env.DATABASE_URL;
    process.env.DB_CONNECTION='pgsql';
    process.env.DB_HOST='example.internal';
    process.env.DB_DATABASE='episode';
    process.env.DB_USERNAME='episode';
    process.env.DB_PASSWORD='testing-only';
    assert.equal(hasDatabaseConfiguration(),true);
    process.env.DB_CONNECTION='mysql';
    assert.equal(hasDatabaseConfiguration(),false);
    process.env.DB_CONNECTION='pgsql';
    delete process.env.DB_HOST;
    assert.equal(hasDatabaseConfiguration(),false);
    process.env.DATABASE_URL='postgresql://localhost/test';
    assert.equal(hasDatabaseConfiguration(),true);
  }finally{
    for(const name of names){
      if(original[name]===undefined)delete process.env[name];
      else process.env[name]=original[name];
    }
  }
});
