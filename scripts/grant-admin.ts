import { randomUUID } from 'node:crypto';
import { transaction, database } from '../lib/db.ts';
const email=process.argv[2]?.trim().toLowerCase();
if(!email)throw new Error('Usage: npm run admin:grant -- verified-email@example.com');
try{await transaction(async client=>{
  const result=await client.query<{id:string;emailVerified:boolean}>('SELECT id,"emailVerified" FROM "user" WHERE lower(email)=$1',[email]);
  const user=result.rows[0];if(!user?.emailVerified)throw new Error('Create and verify the account first.');
  await client.query('INSERT INTO staff_memberships(id,user_id,role) VALUES($1,$2,\'admin\') ON CONFLICT(user_id,property_id) DO NOTHING',[randomUUID(),user.id]);
  await client.query('INSERT INTO audit_log(id,actor_id,action,entity_id,details) VALUES($1,$2,$3,$2,$4)',[randomUUID(),user.id,'staff.admin_granted',JSON.stringify({via:'database-administrator-cli'})]);
});console.log('Administrator membership granted.');}finally{await database().end();}
