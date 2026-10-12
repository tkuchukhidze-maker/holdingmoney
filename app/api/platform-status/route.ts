import {database,hasDatabaseConfiguration} from '../../../lib/db';

// Public, read-only diagnostic. Deliberately never returns connection strings,
// SQL errors, credentials, database names or personally identifiable data.
export const runtime='nodejs';
export const dynamic='force-dynamic';

function reply(state:string,healthy:boolean,extra:Record<string,number|boolean>={}){
  return Response.json(
    {application:'online',booking:healthy?'ready':'unavailable',state,...extra},
    {status:healthy?200:503,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}},
  );
}

export async function GET(){
  if(!hasDatabaseConfiguration())return reply('database_not_configured',false);
  try{
    const result=await database().query<{
      has_properties:boolean;
      has_resources:boolean;
      has_reservations:boolean;
      has_offers:boolean;
    }>(`SELECT
      to_regclass('public.properties') IS NOT NULL AS has_properties,
      to_regclass('public.resources') IS NOT NULL AS has_resources,
      to_regclass('public.reservations') IS NOT NULL AS has_reservations,
      to_regclass('public.hotel_offers') IS NOT NULL AS has_offers`);
    const schema=result.rows[0];
    if(!schema.has_properties||!schema.has_resources||!schema.has_reservations||!schema.has_offers){
      return reply('migrations_required',false);
    }
    const catalog=await database().query<{properties:number;resources:number}>(
      `SELECT
         (SELECT count(*)::integer FROM properties WHERE active=true) AS properties,
         (SELECT count(*)::integer FROM resources WHERE active=true) AS resources`,
    );
    const {properties,resources}=catalog.rows[0];
    if(!properties)return reply('catalog_empty',false);
    if(!resources)return reply('inventory_empty',false);
    return reply('ready',true);
  }catch{
    return reply('database_connection_or_schema_error',false);
  }
}
