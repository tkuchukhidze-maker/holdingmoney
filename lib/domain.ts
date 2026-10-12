import { createHash } from 'node:crypto';
import { HttpError } from './http.ts';
export const REWARDS={dessert:{name:'Dessert experience',points:120},wine:{name:'A glass of wine',points:300},experience:{name:'Episode experience',points:600}} as const;
export function localTimestamp(date:string,time:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw new HttpError(400,'Choose a valid date and time.');
  const result=new Date(`${date}T${time}:00+04:00`);
  if(!Number.isFinite(result.getTime())||new Date(result.getTime()+14400000).toISOString().slice(0,16)!==`${date}T${time}`)throw new HttpError(400,'Choose a valid date and time.');
  return result;
}
export function validateFuture(start:Date,now=Date.now()){
  if(start.getTime()<=now||start.getTime()>now+366*86400000)throw new HttpError(400,'Choose a future date within one year.');
}
export function hashPayload(input:unknown){return createHash('sha256').update(JSON.stringify(input)).digest('hex');}
export function tier(spendTetri:number){return spendTetri>=1000000?'Black':spendTetri>=300000?'Gold':spendTetri>=100000?'Silver':'Member';}
export function pointsForSpend(amountTetri:number){if(!Number.isSafeInteger(amountTetri)||amountTetri<0)throw new HttpError(400,'Invalid amount.');return Math.floor(amountTetri/100);}
export function birthdayDistance(value:string,now=new Date()){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tbilisi',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const current=localTimestamp(today,'00:00'),month=Number(value.slice(5,7)),day=Number(value.slice(8,10));let year=Number(today.slice(0,4));
  function next(y:number){const last=new Date(Date.UTC(y,month,0)).getUTCDate();return localTimestamp(`${y}-${String(month).padStart(2,'0')}-${String(Math.min(day,last)).padStart(2,'0')}`,'00:00');}
  let birthday=next(year);if(birthday<current)birthday=next(++year);return Math.round((birthday.getTime()-current.getTime())/86400000);
}
