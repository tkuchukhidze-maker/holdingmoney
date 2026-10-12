import { randomUUID } from 'node:crypto';
import { transaction, database } from './db.ts';
import { HttpError } from './http.ts';
import { REWARDS, tier } from './domain.ts';
import { audit } from './reservations.ts';
export async function wallet(userId:string){
  const totals=await database().query<{points:string;spend:string}>(`SELECT
    (SELECT COALESCE(SUM(points),0) FROM points_ledger WHERE user_id=$1) points,
    (SELECT COALESCE(SUM(amount_tetri),0) FROM reservations WHERE user_id=$1 AND status='completed') spend`,[userId]);
  const {points,spend}=totals.rows[0];return {points:Number(points),spendTetri:Number(spend),tier:tier(Number(spend)),rewards:REWARDS};
}
export async function redeem(userId:string,rewardId:keyof typeof REWARDS,requestKey:string){return transaction(async client=>{
  await client.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE',[userId]);
  const source=`redeem:${userId}:${requestKey}`,reward=REWARDS[rewardId];
  const previous=await client.query<{points:number;label:string}>('SELECT points,label FROM points_ledger WHERE source=$1',[source]);
  if(previous.rows[0]){if(previous.rows[0].points!==-reward.points||previous.rows[0].label!==reward.name)throw new HttpError(409,'This request key was used for another reward.');return {ok:true};}
  const total=await client.query<{points:string}>('SELECT COALESCE(SUM(points),0) points FROM points_ledger WHERE user_id=$1',[userId]);
  if(Number(total.rows[0].points)<reward.points)throw new HttpError(409,'You do not have enough points for this reward.');
  const id=randomUUID();await client.query('INSERT INTO points_ledger(id,user_id,source,points,label) VALUES($1,$2,$3,$4,$5)',[id,userId,source,-reward.points,reward.name]);
  await audit(client,userId,'loyalty.redeemed',id,{rewardId,points:reward.points});return {ok:true};
});}
