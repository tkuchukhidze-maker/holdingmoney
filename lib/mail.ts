import { randomUUID } from 'node:crypto';
import { database } from './db.ts';
export async function queueEmail(to:string,subject:string,url:string){
  await database().query('INSERT INTO email_outbox(id,recipient,subject,body) VALUES($1,$2,$3,$4)',[randomUUID(),to,subject,`${subject}\n\n${url}\n\nIf you did not request this, you can ignore this email.\nEpisode Holding`]);
}
