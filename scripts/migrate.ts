import { migrate } from '../lib/migrate.ts';
import { database } from '../lib/db.ts';
try{await migrate();console.log('Authentication and platform migrations applied.');}finally{await database().end();}
