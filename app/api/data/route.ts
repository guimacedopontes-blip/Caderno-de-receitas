import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { sql } from '@/lib/db';
import { recipeSchema } from '@/lib/model';
import { z } from 'zod';
import sharp from 'sharp';
export const dynamic='force-dynamic';
const uuid=z.string().uuid();
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function user(){const {data}=await auth.getSession();return data?.user;}
async function visible(id:string,uid:string){const r=await sql`SELECT r.* FROM recipes r WHERE r.id=${id} AND NOT r.archived AND (r.owner_id=${uid} OR r.data->>'visibility'='public') AND NOT EXISTS(SELECT 1 FROM blocks b WHERE (b.owner_id=${uid} AND b.target_id=r.owner_id) OR (b.target_id=${uid} AND b.owner_id=r.owner_id))`;return r[0];}
export async function GET(req:NextRequest){try{
 const u=await user();if(!u)return reply({error:'Entre na sua conta para continuar.'},401);
 await sql`INSERT INTO profiles(id,name) VALUES(${u.id},${u.name}) ON CONFLICT(id) DO NOTHING`;
 const id=req.nextUrl.searchParams.get('id');
 if(id){uuid.parse(id);const r=await visible(id,u.id);if(!r)return reply({error:'Receita não encontrada.'},404);
 const comments=await sql`SELECT c.id,c.body,c.owner_id,c.created_at,p.name AS author FROM comments c JOIN profiles p ON p.id=c.owner_id WHERE c.recipe_id=${id} AND NOT EXISTS(SELECT 1 FROM blocks b WHERE (b.owner_id=${u.id} AND b.target_id=c.owner_id) OR (b.target_id=${u.id} AND b.owner_id=c.owner_id)) ORDER BY c.created_at DESC LIMIT 100`;
 const cooks=r.owner_id===u.id?await sql`SELECT id,version,data,created_at FROM cooks WHERE recipe_id=${id} AND owner_id=${u.id} ORDER BY created_at DESC LIMIT 100`:[];
 const versions=r.owner_id===u.id?await sql`SELECT version,data,created_at FROM recipe_versions WHERE recipe_id=${id} ORDER BY version DESC LIMIT 50`:[];
 return reply({comments,cooks,versions});}
 const view=req.nextUrl.searchParams.get('view')||'mine';
 const recipes=await sql`SELECT r.*,p.name AS author,(SELECT count(*)::int FROM likes l WHERE l.recipe_id=r.id) AS likes,EXISTS(SELECT 1 FROM likes l WHERE l.recipe_id=r.id AND l.owner_id=${u.id}) AS liked,EXISTS(SELECT 1 FROM saves s WHERE s.recipe_id=r.id AND s.owner_id=${u.id}) AS saved FROM recipes r JOIN profiles p ON p.id=r.owner_id WHERE r.archived=(${view}='archive') AND ((${view} IN ('mine','archive') AND r.owner_id=${u.id}) OR (${view}='community' AND r.data->>'visibility'='public') OR (${view}='saved' AND (r.owner_id=${u.id} OR r.data->>'visibility'='public') AND EXISTS(SELECT 1 FROM saves s WHERE s.recipe_id=r.id AND s.owner_id=${u.id}))) AND NOT EXISTS(SELECT 1 FROM blocks b WHERE (b.owner_id=${u.id} AND b.target_id=r.owner_id) OR (b.target_id=${u.id} AND b.owner_id=r.owner_id)) ORDER BY r.updated_at DESC LIMIT 200`;
 const folders=await sql`SELECT id,name FROM folders WHERE owner_id=${u.id} ORDER BY name`;
 const profile=(await sql`SELECT name,bio FROM profiles WHERE id=${u.id}`)[0];
 const follows=await sql`SELECT target_id FROM follows WHERE owner_id=${u.id}`;
 const blocks=await sql`SELECT b.target_id,p.name FROM blocks b JOIN profiles p ON p.id=b.target_id WHERE b.owner_id=${u.id}`;
 return reply({user:{id:u.id,name:profile.name,email:u.email},profile,recipes:recipes.map(r=>r.owner_id===u.id?r:{...r,data:{...r.data,notes:"",folder:""}}),folders,follows:follows.map(f=>f.target_id),blocks});
 }catch(e){console.error('data read failed',e instanceof Error?e.name:'error');return reply({error:'Não foi possível carregar os dados. Tente novamente.'},500);}}
export async function POST(req:NextRequest){try{
 if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Origem inválida.'},403);
 const u=await user();if(!u)return reply({error:'Sua sessão expirou. Entre novamente.'},401);
 if(Number(req.headers.get('content-length')||0)>1_500_000)return reply({error:'Arquivo muito grande.'},413);
 const raw=await req.text();if(raw.length>1_500_000)return reply({error:'Arquivo muito grande.'},413);
 const body=JSON.parse(raw);const action=z.string().parse(body.action);
 await sql`INSERT INTO profiles(id,name) VALUES(${u.id},${u.name}) ON CONFLICT(id) DO NOTHING`;
 const rate=await sql`INSERT INTO rate_limits(key,count,reset_at) VALUES(${u.id},1,now()+interval '1 minute') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.count+1 END,reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+interval '1 minute' ELSE rate_limits.reset_at END RETURNING count`;
 if(rate[0].count>60)return reply({error:'Muitas alterações. Aguarde um minuto.'},429);
 if(action==='recipe'){
 const data=recipeSchema.parse(body.data);const id=body.id?uuid.parse(body.id):crypto.randomUUID();
 if(data.photoId){const p=await sql`SELECT id FROM photos WHERE id=${data.photoId} AND owner_id=${u.id}`;if(!p.length)return reply({error:'Foto inválida.'},400);}
 if(body.id){const expected=z.number().int().positive().parse(body.version);const changed=await sql.transaction([
 sql`UPDATE recipes SET data=${JSON.stringify(data)}::jsonb,version=version+1,updated_at=now() WHERE id=${id} AND owner_id=${u.id} AND version=${expected} RETURNING version`,
 sql`INSERT INTO recipe_versions(recipe_id,version,data) SELECT id,version,data FROM recipes WHERE id=${id} AND owner_id=${u.id} ON CONFLICT DO NOTHING`]);
 if(!changed[0].length)return reply({error:'A receita mudou em outra aba. Recarregue antes de editar.'},409);
 }else{const count=await sql`SELECT count(*)::int n FROM recipes WHERE owner_id=${u.id}`;if(count[0].n>=500)return reply({error:'Limite inicial de 500 receitas atingido.'},400);
 await sql.transaction([sql`INSERT INTO recipes(id,owner_id,data) VALUES(${id},${u.id},${JSON.stringify(data)}::jsonb)`,sql`INSERT INTO recipe_versions(recipe_id,version,data) VALUES(${id},1,${JSON.stringify(data)}::jsonb)`]);}
 return reply({id});}
 if(action==='photo'){
 const data=z.string().max(1_400_000).regex(/^data:image\/(jpeg|png|webp);base64,/).parse(body.data);
 const count=await sql`SELECT count(*)::int n FROM photos WHERE owner_id=${u.id}`;if(count[0].n>=100)return reply({error:'Limite inicial de 100 fotos atingido.'},400);
 const input=Buffer.from(data.split(',')[1],'base64');const bytes=await sharp(input,{limitInputPixels:25_000_000}).rotate().resize(1200,1200,{fit:'inside',withoutEnlargement:true}).webp({quality:75}).toBuffer();
 if(bytes.length>500_000)return reply({error:'Reduza a foto antes de enviar.'},400);
 const id=crypto.randomUUID();await sql`INSERT INTO photos(id,owner_id,bytes,mime) VALUES(${id},${u.id},decode(${bytes.toString('hex')},'hex'),'image/webp')`;return reply({id});}
 if(action==='folder'){const name=z.string().trim().min(1).max(60).parse(body.name);await sql`INSERT INTO folders(id,owner_id,name) VALUES(${crypto.randomUUID()},${u.id},${name}) ON CONFLICT DO NOTHING`;return reply({ok:true});}
 if(action==='profile'){const name=z.string().trim().min(2).max(80).parse(body.name),bio=z.string().max(500).parse(body.bio);await sql`UPDATE profiles SET name=${name},bio=${bio} WHERE id=${u.id}`;return reply({ok:true});}
 if(action==='follow'||action==='block'){
 const target=z.string().min(1).max(100).parse(body.target);if(target===u.id)return reply({error:'Escolha outro perfil.'},400);const p=await sql`SELECT id FROM profiles WHERE id=${target}`;if(!p.length)return reply({error:'Perfil não encontrado.'},404);
 if(action==='follow'){if(body.active)await sql`INSERT INTO follows VALUES(${u.id},${target}) ON CONFLICT DO NOTHING`;else await sql`DELETE FROM follows WHERE owner_id=${u.id} AND target_id=${target}`;}
 else{if(body.active)await sql`INSERT INTO blocks VALUES(${u.id},${target}) ON CONFLICT DO NOTHING`;else await sql`DELETE FROM blocks WHERE owner_id=${u.id} AND target_id=${target}`;}return reply({ok:true});}
 const id=uuid.parse(body.id);
 if(action==='restore'){await sql`UPDATE recipes SET archived=false WHERE id=${id} AND owner_id=${u.id}`;return reply({ok:true});}
 const r=await visible(id,u.id);if(!r)return reply({error:'Receita indisponível.'},404);
 if(action==='archive'){if(r.owner_id!==u.id)return reply({error:'Sem permissão.'},403);await sql`UPDATE recipes SET archived=true WHERE id=${id} AND owner_id=${u.id}`;}
 else if(action==='cook'){if(r.owner_id!==u.id)return reply({error:'Sem permissão.'},403);const data=z.object({date:z.string().date(),notes:z.string().min(1).max(5000),taste:z.number().int().min(1).max(5),texture:z.number().int().min(1).max(5),appearance:z.number().int().min(1).max(5),photoId:z.string().uuid().nullable()}).parse(body.data);if(data.photoId&&!(await sql`SELECT id FROM photos WHERE id=${data.photoId} AND owner_id=${u.id}`).length)return reply({error:'Foto inválida.'},400);await sql`INSERT INTO cooks(id,recipe_id,owner_id,version,data) VALUES(${crypto.randomUUID()},${id},${u.id},${r.version},${JSON.stringify(data)}::jsonb)`;}
 else if(action==='like'){if(body.active)await sql`INSERT INTO likes VALUES(${u.id},${id}) ON CONFLICT DO NOTHING`;else await sql`DELETE FROM likes WHERE owner_id=${u.id} AND recipe_id=${id}`;}
 else if(action==='save'){if(body.active)await sql`INSERT INTO saves VALUES(${u.id},${id}) ON CONFLICT DO NOTHING`;else await sql`DELETE FROM saves WHERE owner_id=${u.id} AND recipe_id=${id}`;}
 else if(action==='comment'){const text=z.string().trim().min(1).max(1500).parse(body.text);await sql`INSERT INTO comments(id,owner_id,recipe_id,body) VALUES(${crypto.randomUUID()},${u.id},${id},${text})`;}
 else if(action==='report'){const reason=z.string().trim().min(3).max(1000).parse(body.reason);await sql`INSERT INTO reports(id,owner_id,recipe_id,reason) VALUES(${crypto.randomUUID()},${u.id},${id},${reason})`;}
 else if(action==='adapt'){const newId=crypto.randomUUID();const data={...r.data,title:r.data.title+' — minha versão',notes:'',visibility:'private',photoId:null,folder:''};await sql.transaction([sql`INSERT INTO recipes(id,owner_id,data,source_id) VALUES(${newId},${u.id},${JSON.stringify(data)}::jsonb,${id})`,sql`INSERT INTO recipe_versions(recipe_id,version,data) VALUES(${newId},1,${JSON.stringify(data)}::jsonb)`]);return reply({id:newId});}
 else return reply({error:'Ação inválida.'},400);
 return reply({ok:true});
 }catch(e){if(e instanceof z.ZodError)return reply({error:'Confira os campos: '+e.issues.map(i=>i.path.join('.')).join(', ')},400);console.error('data write failed',e instanceof Error?e.name:'error');return reply({error:'Não foi possível salvar. Seus dados no formulário foram mantidos.'},500);}}
