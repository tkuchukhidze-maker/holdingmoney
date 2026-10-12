import { z } from 'zod';
export class HttpError extends Error{status:number;constructor(status:number,message:string){super(message);this.status=status;}}
export function appOrigin(){
  const value=process.env.APP_ORIGIN;
  if(!value)throw new Error('APP_ORIGIN is required.');
  const url=new URL(value);
  if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error('Production APP_ORIGIN must use HTTPS.');
  return url.origin;
}
export function checkOrigin(request:Request){
  if(request.headers.get('origin')!==appOrigin())throw new HttpError(403,'The request origin is not allowed.');
  const site=request.headers.get('sec-fetch-site');
  if(site==='cross-site')throw new HttpError(403,'Cross-site requests are not allowed.');
}
export async function readBody(request:Request,limit=16384){
  if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new HttpError(415,'Use application/json.');
  if(Number(request.headers.get('content-length'))>limit)throw new HttpError(413,'Request is too large.');
  if(!request.body)throw new HttpError(400,'JSON is required.');
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let total=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>limit){await reader.cancel();throw new HttpError(413,'Request is too large.');}chunks.push(value);}}
  finally{reader.releaseLock();}
  return Buffer.concat(chunks).toString('utf8');
}
export async function readJson(request:Request){return JSON.parse(await readBody(request)) as unknown;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
export function failure(error:unknown){
  if(error instanceof HttpError)return json({error:error.message},error.status);
  if(error instanceof z.ZodError)return json({error:'Check the required fields and their values.'},400);
  if(error instanceof SyntaxError)return json({error:'Invalid JSON.'},400);
  const code=(error as {code?:string})?.code;
  if(code==='23P01')return json({error:'That resource has just been booked. Please choose another time.'},409);
  if(code==='23505')return json({error:'That record already exists.'},409);
  console.error('Episode request failed:',error instanceof Error?error.name:'UnknownError');
  return json({error:'The service is temporarily unavailable. Please try again.'},503);
}
