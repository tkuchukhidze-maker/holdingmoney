import { createHash } from 'node:crypto';
import { auth } from '../../../../lib/auth.ts';
import { checkOrigin,failure,readBody } from '../../../../lib/http.ts';
import { consumeLimit } from '../../../../lib/rate-limit.ts';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return await auth().handler(request);}catch(error){return failure(error);}}
export async function POST(request:Request){try{
  checkOrigin(request);
  const text=await readBody(request,32768);const body=JSON.parse(text) as {email?:unknown};
  const path=new URL(request.url).pathname;
  await consumeLimit('auth:global',200);
  if(body&&typeof body.email==='string'){
    const key=createHash('sha256').update(body.email.trim().toLowerCase()).digest('hex');
    await consumeLimit('auth:'+path+':'+key,path.includes('sign-in')?10:5);
  }
  return await auth().handler(new Request(request.url,{method:'POST',headers:request.headers,body:text}));
}catch(error){return failure(error);}}
