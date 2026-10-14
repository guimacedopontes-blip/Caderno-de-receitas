import {sql} from '@/lib/db';
import {auth} from '@/lib/auth-server';
import {z} from 'zod';
export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.string().uuid().safeParse(id).success)return new Response(null,{status:404});
 const {data:s}=await auth.getSession();const uid=s?.user.id||'';
 const rows=await sql`SELECT encode(p.bytes,'base64') AS bytes,p.mime FROM photos p WHERE p.id=${id} AND (p.owner_id=${uid} OR EXISTS(SELECT 1 FROM recipes r WHERE r.data->>'photoId'=p.id::text AND r.data->>'visibility'='public' AND NOT r.archived))`;
 if(!rows.length)return new Response(null,{status:404});return new Response(Buffer.from(rows[0].bytes,'base64'),{headers:{'Content-Type':rows[0].mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
