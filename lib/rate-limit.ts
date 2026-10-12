import { database } from './db.ts';
import { HttpError } from './http.ts';
export async function consumeLimit(key:string,max:number,seconds=60){
  const result=await database().query<{count:number}>(`
    INSERT INTO rate_buckets(key,window_start,count)
    VALUES($1,to_timestamp(floor(extract(epoch FROM now())/$2)*$2),1)
    ON CONFLICT(key) DO UPDATE SET
      count=CASE WHEN rate_buckets.window_start=excluded.window_start THEN rate_buckets.count+1 ELSE 1 END,
      window_start=excluded.window_start RETURNING count`,[key,seconds]);
  if(result.rows[0].count>max)throw new HttpError(429,'Too many attempts. Please wait a minute and try again.');
}
