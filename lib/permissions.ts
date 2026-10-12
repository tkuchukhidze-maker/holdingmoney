import type { PoolClient } from 'pg';
import { HttpError } from './http.ts';
export async function canManage(client:PoolClient,userId:string,propertyId:string){
  const result=await client.query('SELECT 1 FROM staff_memberships WHERE user_id=$1 AND (role=\'admin\' OR property_id=$2)',[userId,propertyId]);return result.rowCount!==0;
}
export async function requireManager(client:PoolClient,userId:string,propertyId:string){if(!await canManage(client,userId,propertyId))throw new HttpError(403,'You do not have access to this property.');}
