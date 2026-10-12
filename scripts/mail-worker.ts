import { database,transaction } from '../lib/db.ts';
import { mkdir,writeFile } from 'node:fs/promises';
const preview=process.argv.includes('--preview');
if(preview&&process.env.NODE_ENV==='production')throw new Error('Mail preview is development-only.');
if(!preview&&(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM))throw new Error('Configure RESEND_API_KEY and EMAIL_FROM first.');
type Mail={id:string;recipient:string;subject:string;body:string;attempts:number};
async function deliver(){
  const messages=await transaction(async client=>(await client.query<Mail>(`UPDATE email_outbox SET attempts=attempts+1,available_at=now()+interval '5 minutes'
    WHERE id IN(SELECT id FROM email_outbox WHERE sent_at IS NULL AND attempts<5 AND available_at<=now() ORDER BY created_at LIMIT 20 FOR UPDATE SKIP LOCKED) RETURNING *`)).rows);
  if(preview)await mkdir('.local/mail',{recursive:true,mode:0o700});
  for(const mail of messages){try{
    if(preview)await writeFile(`.local/mail/${mail.id}.txt`,`${mail.subject}\nTo: ${mail.recipient}\n\n${mail.body}`,{mode:0o600});
    else{
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':mail.id},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[mail.recipient],subject:mail.subject,text:mail.body}),signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Email provider status '+response.status);
    }
    await database().query('UPDATE email_outbox SET sent_at=now(),body=$2,last_error=NULL WHERE id=$1',[mail.id,preview?mail.body:'[delivered]']);
  }catch(error){await database().query('UPDATE email_outbox SET last_error=$2,available_at=now()+($3 * interval \'1 minute\') WHERE id=$1',[mail.id,error instanceof Error?error.message:'Delivery failed',Math.min(60,2**mail.attempts)]);}}
  console.log(preview?'Development mail files written to .local/mail.':`Processed ${messages.length} queued email(s).`);
}
try{await deliver();}finally{await database().end();}
