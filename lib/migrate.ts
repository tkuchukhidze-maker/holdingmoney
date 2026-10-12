import { readdir,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getMigrations } from 'better-auth/db/migration';
import { database } from './db.ts';
import { auth } from './auth.ts';
export async function migrate(){
  const client=await database().connect();
  try{
    await client.query("SELECT pg_advisory_lock(hashtextextended('episode:migrations',0))");
    const authentication=await getMigrations(auth().options);await authentication.runMigrations();
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
    const folder=new URL('../db/migrations/',import.meta.url);
    for(const file of (await readdir(folder)).filter(f=>f.endsWith('.sql')).sort()){
      const sql=await readFile(new URL(file,folder),'utf8');const checksum=createHash('sha256').update(sql).digest('hex');
      const existing=await client.query<{checksum:string}>('SELECT checksum FROM schema_migrations WHERE version=$1',[file]);
      if(existing.rows[0]){if(existing.rows[0].checksum!==checksum)throw new Error('Applied migration changed: '+file);continue;}
      await client.query('BEGIN');
      try{await client.query(sql);await client.query('INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)',[file,checksum]);await client.query('COMMIT');}
      catch(error){await client.query('ROLLBACK');throw error;}
    }
  }finally{await client.query("SELECT pg_advisory_unlock(hashtextextended('episode:migrations',0))");client.release();}
}
