import { seed } from '../lib/seed.ts';
import { database } from '../lib/db.ts';
try{await seed();console.log('Demo properties, resources and events prepared. No guest accounts or passwords were created.');}finally{await database().end();}
