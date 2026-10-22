'use client';
import {useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import type {Ingredient,Nutrients} from '@/lib/model';
import {foods,units,identifyIngredient,resolveIngredient,parseIngredientList,searchFoods,measureSource,milkSource,oilSource,densitySource,type Unit} from '@/lib/ingredients';

function LabelValues({value,change}:{value:Nutrients|null;change:(value:Nutrients|null)=>void}){
 const keys=['kcal','protein','carbs','fat'] as const;
 const [draft,setDraft]=useState(()=>Object.fromEntries(keys.map(k=>[k,value?String(value[k]):''])));
 return <details><summary>Usar valores de um rótulo (opcional)</summary><p className="tiny">Somente para alimentos especiais ou de marca. Informe os quatro valores por 100 g; zero só quando constar no rótulo.</p><div className="form-grid">{keys.map((k,index)=><label key={k}>{['Calorias (kcal)','Proteínas (g)','Carboidratos (g)','Gorduras (g)'][index]}<input type="number" min="0" max={k==='kcal'?1000:100} step="any" value={draft[k]} onChange={e=>{const next={...draft,[k]:e.target.value};setDraft(next);change(keys.every(key=>next[key]!==''&&Number.isFinite(Number(next[key]))&&Number(next[key])>=0&&Number(next[key])<=(key==='kcal'?1000:100))?Object.fromEntries(keys.map(key=>[key,Number(next[key])])) as Nutrients:null)}}/></label>)}</div></details>;
}
export function IngredientEditor({ingredients,onChange}:{ingredients:Ingredient[];onChange:(items:Ingredient[])=>void}){
 const [text,setText]=useState('');const [message,setMessage]=useState('');const [searchIndex,setSearchIndex]=useState<number|null>(null);const [query,setQuery]=useState('');
 function update(index:number,change:Partial<Ingredient>,identify=false){
  const old=ingredients[index];
  const next={...old,quantity:old.quantity===undefined?old.grams:old.quantity,unit:old.unit||'g',...change};
  onChange(ingredients.map((i,n)=>n===index?(identify?identifyIngredient(next):resolveIngredient(next)):i));
 }
 function addList(){
  const parsed=parseIngredientList(text);const kept=ingredients.filter(i=>i.name.trim());
  if(!parsed.length){setMessage('Cole pelo menos um ingrediente, em uma linha.');return;}
  if(kept.length+parsed.length>100){setMessage('Limite de 100 ingredientes. Divida a lista antes de adicionar. Nenhuma linha foi importada.');return;}
  if(parsed.some(i=>i.name.length>120||(i.originalText?.length||0)>300)){setMessage('Há uma linha muito longa. Cole somente os ingredientes, uma linha por ingrediente. Nenhuma linha foi importada.');return;}
  onChange([...kept,...parsed]);setText('');setMessage(`${parsed.length} ingrediente(s) adicionado(s). Confira as referências e as pendências abaixo.`);
 }
 const pending=ingredients.filter(i=>!i.nutrients||!i.grams).length;
 return <section className="panel ingredient-section"><h2>Ingredientes <small>do seu jeito</small></h2><p className="muted">Cole a lista inteira ou adicione um por vez. Os alimentos reconhecidos calculam calorias e macros automaticamente.</p>
  <div className="bulk-ingredients"><label>Colar vários ingredientes<textarea rows={5} maxLength={30000} value={text} onChange={e=>setText(e.target.value)} placeholder={'2 xícaras de farinha de trigo\n1/2 xícara de açúcar\n3 ovos\n250 ml de leite'}/></label><p className="tiny muted">Uma linha por ingrediente. Aceita frações, vírgula decimal, g, kg, ml, litros, unidades, xícaras e colheres de sopa ou chá.</p><button type="button" className="secondary" disabled={!text.trim()} onClick={addList}><Plus size={16}/> Adicionar lista</button><p role="status" className="tiny">{message}</p></div>
  <p className={pending?'warning':'success'} role="status">{pending?`${pending} ingrediente(s) com dados ou peso a conferir.`:'Todos os ingredientes entraram na estimativa.'}</p>
  {ingredients.map((i,index)=>{const reference=foods.find(f=>f.id===i.foodId);return <div className="ingredient-editor" key={index}>
   <div className="row"><strong>Ingrediente {index+1}</strong><button type="button" className="icon" aria-label={`Remover ingrediente ${index+1}`} disabled={ingredients.length===1} onClick={()=>{onChange(ingredients.filter((_,n)=>n!==index));setSearchIndex(null)}}><Trash2 size={16}/></button></div>
   <div className="ingredient-fields"><label>Alimento<input aria-label={`Alimento ${index+1}`} value={i.name} maxLength={120} required placeholder="Ex.: farinha de trigo" onChange={e=>update(index,{name:e.target.value,manualWeight:null},true)}/></label><label>Quantidade<input aria-label={`Quantidade ${index+1}`} type="number" min="0.001" max="100000" step="any" value={i.quantity===undefined?i.grams??'':i.quantity??''} onChange={e=>update(index,{quantity:e.target.value?Number(e.target.value):null,manualWeight:null})}/></label><label>Medida<select aria-label={`Medida ${index+1}`} value={i.unit||'g'} onChange={e=>update(index,{unit:e.target.value as Unit,manualWeight:null})}>{Object.entries(units).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label></div>
   {i.originalText&&<p className="tiny muted">Texto original: {i.originalText}</p>}
   <p className={i.nutrients?'tiny muted':'tiny warning'}>{reference?`Referência usada: ${reference.name}. ${i.source}`:i.nutrients?i.source:'Alimento não identificado. Escolha uma referência para calcular.'}</p>
   <button type="button" className="textbtn" onClick={()=>{setSearchIndex(searchIndex===index?null:index);setQuery(i.name)}}>{reference?'Trocar alimento de referência':'Escolher alimento da base'}</button>
   {searchIndex===index&&<div className="ingredient-search"><label>Buscar alimento<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ex.: arroz, cozido"/></label><div className="food-results">{searchFoods(query).map(f=><button type="button" key={f.id} onClick={()=>{update(index,{foodId:f.id,nutrients:f.nutrients,source:f.source,manualWeight:null});setSearchIndex(null)}}><span>{f.name}</span><small>{f.nutrients.kcal} kcal / 100 g</small></button>)}</div>{!searchFoods(query).length&&<p className="tiny">Nenhum resultado. Tente um nome mais simples ou use o rótulo abaixo.</p>}</div>}
   <p className={i.grams?'tiny muted':'tiny warning'}>{i.grams?`Peso usado: ≈ ${i.grams.toLocaleString('pt-BR',{maximumFractionDigits:1})} g. `:'Peso pendente. '}{i.conversion}</p>
   <details open={!i.grams&&!!i.name}><summary>Conferir ou ajustar peso equivalente</summary><p className="tiny">Opcional. Para medidas sem equivalência, tamanhos diferentes ou embalagens, informe o peso total comestível deste ingrediente. Não é necessário informar nutrientes.</p><label>Peso total conferido (g)<input aria-label={`Peso total conferido ${index+1}`} type="number" min="0.001" max="100000" step="any" value={i.manualWeight??''} placeholder="Ex.: 150" onChange={e=>update(index,{manualWeight:e.target.value?Number(e.target.value):null})}/></label></details>
   <LabelValues key={`${index}:${i.foodId}:${i.source}`} value={i.nutrients} change={nutrients=>update(index,{foodId:null,nutrients,source:nutrients?'Rótulo informado pelo usuário':''})}/>
  </div>})}
  <button type="button" className="secondary" disabled={ingredients.length>=100} onClick={()=>onChange([...ingredients,{name:'',quantity:null,unit:'g',grams:null,nutrients:null,source:''}])}><Plus size={16}/> Adicionar ingrediente</button>
  <details className="ingredient-sources"><summary>Como a estimativa funciona</summary><p className="tiny">Confira o alimento de referência, inclusive cru/cozido e integral/desnatado. Nomes genéricos como “açúcar”, “ovo”, “leite” e “óleo” usam, respectivamente, açúcar refinado, ovo inteiro cru grande, leite integral pasteurizado e óleo de soja. Você pode trocar a referência.</p><p className="tiny">Medidas caseiras são aproximadas e variam por alimento. Líquidos: xícara de 240 ml, sopa de 15 ml, chá de 5 ml. Sólidos: peso da xícara de referência, com colheres rasas equivalentes a 1/16 e 1/48 de xícara. Ingredientes desconhecidos ou sem peso não entram na soma; a receita fica marcada como parcial. O rendimento em porções é informado por você; o aplicativo divide automaticamente os nutrientes.</p><p className="tiny">Fontes: TACO/NEPA–Unicamp; <a href={milkSource} target="_blank" rel="noreferrer">TBCA (leite)</a>; <a href={oilSource} target="_blank" rel="noreferrer">TABNUT (óleo)</a>; <a href={measureSource} target="_blank" rel="noreferrer">King Arthur (medidas)</a>; <a href={densitySource} target="_blank" rel="noreferrer">Embrapa (densidade do leite)</a>. Estimativa culinária, não laudo ou tabela para rotulagem comercial.</p></details>
 </section>;
}
