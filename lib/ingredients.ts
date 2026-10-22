import taco from './foods.json';
import type {Ingredient} from './model';

export const measureSource='https://www.kingarthurbaking.com/learn/ingredient-weight-chart';
export const milkSource='https://www.tbca.net.br/base-dados/int_composicao_estatistica.php?n0REd3kv7e86D%2BViXWYUnQ%3D%3D=urAaBhupTgQN9fiickq%2BKw%3D%3D';
export const oilSource='https://tabnut.dis.epm.br/alimento/04044/oleo-soja-mesa-ou-cozinha';
export const densitySource='https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/criacoes/gado_de_leite/pre-producao/qualidade-e-seguranca/qualidade/testes-de-qualidade/densidade-relativa';
export const foods=[...taco,
 {id:10001,name:'Leite, vaca, integral, pasteurizado',nutrients:{kcal:62,protein:3.19,carbs:4.8,fat:3.39},source:'TBCA / USP — BRC0043G'},
 {id:10002,name:'Óleo de soja',nutrients:{kcal:884,protein:0,carbs:0,fat:100},source:'TABNUT / UNIFESP / USDA — 04044'},
];
export const units={g:'g',kg:'kg',ml:'ml',l:'litro(s)',un:'unidade(s)',cup:'xícara(s)',tbsp:'colher(es) de sopa',tsp:'colher(es) de chá',other:'outra / a gosto'};
export type Unit=keyof typeof units;
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[,()]/g,' ').replace(/\s+/g,' ').trim();
const aliases:Record<string,number>={
 'farinha de trigo':35,'farinha de trigo sem fermento':35,'amido de milho':42,'maisena':42,
 'aveia em flocos':7,'acucar':494,'acucar refinado':494,'acucar cristal':492,'acucar mascavo':493,
 'ovo':489,'ovos':489,'ovo cru':489,'ovos crus':489,'ovo de galinha':489,
 'manteiga com sal':261,'manteiga sem sal':262,'mel':507,'mel de abelha':507,
 'leite':10001,'leite integral':10001,'leite integral pasteurizado':10001,
 'oleo':10002,'oleo de soja':10002,'fermento em po':513,'fermento quimico':513,'fermento quimico em po':513,
};
const byId=new Map(foods.map(f=>[f.id,f]));
export function matchFood(name:string){const n=normalize(name);return byId.get(aliases[n])??foods.find(f=>normalize(f.name)===n);}
export function searchFoods(query:string){const n=normalize(query),direct=matchFood(query);const terms=n.split(' ').filter(t=>!['de','do','da','e'].includes(t));return [...(direct?[direct]:[]),...foods.filter(f=>f.id!==direct?.id&&terms.every(t=>normalize(f.name).includes(t)))].slice(0,30);}

// Measured ingredient-specific cup weights, not a universal grams-per-cup factor.
// King Arthur: flour 120g/cup, sugar 198g/cup, brown sugar packed 213g/cup,
// oats 89g/cup, cornstarch 28g/quarter-cup, butter 113g/8 tbsp, large egg 50g.
const cupWeights:Record<number,number>={35:120,494:198,492:198,493:213,7:89,42:112,261:226,262:226};
export function convertWeight(quantity:number|null|undefined,unit:Unit,foodId?:number|null):{grams:number|null;conversion:string}{
 if(!quantity||!Number.isFinite(quantity)||quantity<=0)return {grams:null,conversion:'Informe a quantidade.'};
 let factor:number|undefined;let conversion='';
 if(unit==='g'||unit==='kg'){factor=unit==='g'?1:1000;conversion='Peso informado';}
 else if(unit==='un'&&foodId===489){factor=50;conversion='Ovo grande: 50 g comestíveis/unidade (King Arthur)';}
 else if(foodId===10001&&['ml','l','cup','tbsp','tsp'].includes(unit)){
  factor=1.032*({ml:1,l:1000,cup:240,tbsp:15,tsp:5}[unit as 'ml']??0);conversion='Leite: 1,032 g/ml (Embrapa); xícara 240 ml, sopa 15 ml, chá 5 ml';
 }else if(foodId===10002&&['ml','l','cup','tbsp','tsp'].includes(unit)){
  factor=({ml:13.6/15,l:13.6/15*1000,cup:13.6*16,tbsp:13.6,tsp:13.6/3}[unit as 'ml']);conversion='Óleo: 13,6 g/sopa (TABNUT); volumes estimados com sopa 15 ml, xícara 240 ml';
 }else if(foodId&&cupWeights[foodId]&&['cup','tbsp','tsp'].includes(unit)){
  factor=cupWeights[foodId]/(unit==='cup'?1:unit==='tbsp'?16:48);conversion=`${cupWeights[foodId]} g/xícara de referência (King Arthur); medidas rasas${foodId===493?', açúcar compactado':''}`;
 }
 const grams=factor===undefined?null:Math.round(quantity*factor*1000)/1000;
 return grams&&grams<=100000?{grams,conversion}:{grams:null,conversion:grams?'Peso acima do limite de 100 kg.':'Sem equivalência segura: informe o peso total em gramas.'};
}
export function resolveIngredient(i:Ingredient):Ingredient{
 // Legacy recipes and manually supplied labels keep their historical values.
 const food=i.foodId?byId.get(i.foodId):undefined;
 const converted=i.unit?convertWeight(i.quantity,i.unit,i.foodId):{grams:i.grams,conversion:i.conversion};
 return {...i,...converted,...(food?{nutrients:food.nutrients,source:food.source}:i.foodId?{nutrients:null,source:''}:{}),...(i.manualWeight?{grams:i.manualWeight,conversion:'Peso total conferido pelo usuário'}:{})};
}
export function identifyIngredient(i:Ingredient):Ingredient{const food=matchFood(i.name);return resolveIngredient({...i,foodId:food?.id??null,nutrients:food?.nutrients??null,source:food?.source??''});}
export function formatQuantity(i:Ingredient){return i.unit&&i.quantity?`${i.quantity.toLocaleString('pt-BR')} ${units[i.unit]}`:i.grams?`${i.grams.toLocaleString('pt-BR')} g`:i.originalText||'Quantidade a conferir';}
export function parseQuantity(raw:string):number|null{
 const s=raw.trim().replace(',','.');
 const mixed=s.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
 const n=mixed?Number(mixed[1]||0)+Number(mixed[2])/Number(mixed[3]):Number(s);
 return s&&Number.isFinite(n)&&n>0&&n<=100000?n:null;
}
const unicode:Record<string,string>={'½':'1/2','¼':'1/4','¾':'3/4','⅓':'1/3','⅔':'2/3','⅛':'1/8'};
const unitPatterns:[RegExp,Unit][]=[
 [/^(?:colheres?|colher)\s*(?:\(\s*)?(?:de\s+)?sopa\s*\)?\.?\s*/,'tbsp'],
 [/^(?:colheres?|colher)\s*(?:\(\s*)?(?:de\s+)?cha\s*\)?\.?\s*/,'tsp'],
 [/^(?:xicaras?|xic\.?)(?:\s*\(?(?:de\s+)?cha\)?)?\s*/,'cup'],
 [/^(?:quilogramas?|quilos?|kg)\b\s*/,'kg'],[/^(?:gramas?|gr|g)\b\s*/,'g'],
 [/^(?:mililitros?|ml)\b\s*/,'ml'],[/^(?:litros?|l)\b\s*/,'l'],[/^(?:unidades?|und|un)\b\.?\s*/,'un'],
];
export function parseIngredientLine(raw:string):Ingredient{
 let text=raw.trim().replace(/^(?:[-•*]\s*|\d+[.)]\s+)/,'').replace(/[½¼¾⅓⅔⅛]/g,(s,offset,whole)=>`${offset&&/\d/.test(whole[offset-1])?' ':''}${unicode[s]}`);
 text=text.replace(/^(uma|um)\s+/i,'1 ').replace(/^(meia|meio)\s+/i,'1/2 ');
 const quantityMatch=text.match(/^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*/);
 const quantity=quantityMatch?parseQuantity(quantityMatch[1]):null;
 let name=quantityMatch?text.slice(quantityMatch[0].length):text;let unit:Unit='other';
 // Match the normalized prefix, retaining the user's accents in the food name.
 const folded=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 for(const [pattern,candidate] of unitPatterns){const match=folded.match(pattern);if(match){unit=candidate;name=name.slice(match[0].length);break;}}
 name=name.replace(/^de\s+/i,'').trim();
 if(unit==='other'&&quantity&&/^(ovos?|cenouras?|bananas?|cebolas?|tomates?|batatas?)\b/i.test(name))unit='un';
 return identifyIngredient({name:name||raw.trim(),quantity,unit,grams:null,nutrients:null,source:'',originalText:raw.trim()});
}
export function parseIngredientList(raw:string):Ingredient[]{
 const lines=raw.split(/\r?\n|;/).map(s=>s.trim()).filter(Boolean);
 const start=lines.findIndex(s=>/^ingredientes\s*:?$/i.test(s));
 const relevant=start>=0?lines.slice(start+1):lines;
 const end=relevant.findIndex(s=>/^(modo de preparo|preparo|instruções)\s*:?$/i.test(s));
 return (end>=0?relevant.slice(0,end):relevant).map(parseIngredientLine);
}
