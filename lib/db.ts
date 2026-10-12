import pg from 'pg';
import type {PoolClient} from 'pg';

const globalDatabase=globalThis as unknown as {episodePool?:pg.Pool};
const postgresKinds=new Set(['pgsql','postgres','postgresql']);

export function hasDatabaseConfiguration(){
  if(process.env.DATABASE_URL?.trim())return true;
  const kind=process.env.DB_CONNECTION;
  return (!kind||postgresKinds.has(kind.toLowerCase()))&&
    Boolean(process.env.DB_HOST&&process.env.DB_DATABASE&&process.env.DB_USERNAME);
}

function poolConfiguration():pg.PoolConfig{
  const common={max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000};
  const connectionString=process.env.DATABASE_URL?.trim();
  if(connectionString)return {connectionString,...common};

  // Laravel Cloud's managed Postgres attachment can expose DB_* variables
  // instead of DATABASE_URL. A MySQL attachment must never be used for pg.
  if(!hasDatabaseConfiguration())throw new Error('PostgreSQL connection is not configured.');
  const port=Number(process.env.DB_PORT||'5432');
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid database port.');
  const mode=(process.env.DB_SSLMODE||process.env.PGSSLMODE||'').toLowerCase();
  const ssl=['require','verify-ca','verify-full'].includes(mode)?{rejectUnauthorized:true}:undefined;
  return {
    ...common,
    host:process.env.DB_HOST,
    port,
    database:process.env.DB_DATABASE,
    user:process.env.DB_USERNAME,
    password:process.env.DB_PASSWORD,
    ...(ssl?{ssl}:{}),
  };
}

export function database(){
  return globalDatabase.episodePool??=new pg.Pool(poolConfiguration());
}
export async function transaction<T>(action:(client:PoolClient)=>Promise<T>):Promise<T>{
  const client=await database().connect();
  try{await client.query('BEGIN');const result=await action(client);await client.query('COMMIT');return result;}
  catch(error){await client.query('ROLLBACK');throw error;}
  finally{client.release();}
}
