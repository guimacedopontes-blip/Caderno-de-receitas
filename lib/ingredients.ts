import taco from './foods.json';
import type {Ingredient,Nutrients} from './model';

export const measureSource='https://www.kingarthurbaking.com/learn/ingredient-weight-chart';
export const milkSource='https://www.tbca.net.br/base-dados/int_composicao_estatistica.php?n0REd3kv7e86D%2BViXWYUnQ%3D%3D=urAaBhupTgQN9fiickq%2BKw%3D%3D';
export const oilSource='https://tabnut.dis.epm.br/alimento/04044/oleo-soja-mesa-ou-cozinha';
export const densitySource='https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/criacoes/gado_de_leite/pre-producao/qualidade-e-seguranca/qualidade/testes-de-qualidade/densidade-relativa';
export const saltSource='https://tabnut.dis.epm.br/alimento/02047/sal-cozinha';
export const tacoSource='https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf';
export type Food={id:number;name:string;nutrients:Nutrients|null;source:string;note?:string};
export const foods:Food[]=[...taco,
 {id:10003,name:'Sal de cozinha (comum)',nutrients:{kcal:0,protein:0,carbs:0,fat:0},source:'TABNUT / UNIFESP / USDA — 02047',note:'Referência para sal comum. Zero calorias e macros não significa ausência de sódio; o aplicativo ainda não calcula sódio.'},
 {id:10001,name:'Leite, vaca, integral, pasteurizado',nutrients:{kcal:62,protein:3.19,carbs:4.8,fat:3.39},source:'TBCA / USP — BRC0043G'},
 {id:10002,name:'Óleo de soja',nutrients:{kcal:884,protein:0,carbs:0,fat:100},source:'TABNUT / UNIFESP / USDA — 04044'},
];
export const units={g:'g',kg:'kg',ml:'ml',l:'litro(s)',un:'unidade(s)',cup:'xícara(s)',tbsp:'colher(es) de sopa',tsp:'colher(es) de chá',other:'outra / a gosto'};
export type Unit=keyof typeof units;
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[,()]/g,' ').replace(/\s+/g,' ').trim();
const aliases:Record<string,number>={
 'sal':10003,'sal comum':10003,'sal de cozinha':10003,'sal refinado':10003,'sal refinado iodado':10003,'sal de mesa':10003,
 'sal grosso':517,'sal dietetico':516,
 'farinha de trigo':35,'farinha de trigo sem fermento':35,'amido de milho':42,'maisena':42,
 'aveia em flocos':7,'acucar':494,'acucar refinado':494,'acucar cristal':492,'acucar mascavo':493,
 'ovo':489,'ovos':489,'ovo cru':489,'ovos crus':489,'ovo de galinha':489,
 'manteiga com sal':261,'manteiga sem sal':262,'mel':507,'mel de abelha':507,
 'leite':10001,'leite integral':10001,'leite integral pasteurizado':10001,
 'oleo':272,'oleo de soja':272,'fermento em po':513,'fermento quimico':513,'fermento quimico em po':513,
 'azeite':260,'azeite de oliva':260,'azeite extra virgem':260,'azeite de oliva extravirgem':260,
 'oleo de girassol':269,'oleo de milho':270,'oleo de canola':268,'azeite de dende':259,
 'cebola':107,'alho':82,'cenoura':110,'tomate':157,'batata':92,'batata inglesa':92,
 'batata doce':89,'batata baroa':87,'mandioquinha':87,'mandioca':130,'aipim':130,'macaxeira':130,
 'abobrinha italiana':71,'berinjela':96,'beterraba':98,'brocolis':101,'chuchu':113,
 'couve flor':117,'couve manteiga':115,'pepino':142,'cebolinha':108,'salsa':153,'salsinha':153,
 'manjericao':133,'rucula':152,'agriao':75,'alface crespa':78,'alface americana':77,
 'pimentao verde':144,'pimentao vermelho':145,'pimentao amarelo':143,
 'arroz branco cru':4,'arroz branco cozido':3,'arroz cozido':3,'arroz cru':4,
 'arroz integral cru':2,'arroz integral cozido':1,
 'feijao carioca cru':562,'feijao carioca cozido':561,'feijao preto cru':568,'feijao preto cozido':567,
 'lentilha':578,'lentilha crua':578,'lentilha cozida':577,'grao de bico':575,
 'aveia':7,'fuba':43,'fuba de milho':43,'farinha de milho':33,'farinha de mandioca':121,
 'farinha de rosca':34,'farinha de arroz':31,'polvilho doce':146,'fecula de mandioca':124,
 'peito de frango':409,'peito de frango cru':409,'peito de frango sem pele':409,
 'peito de frango cozido':408,'peito de frango grelhado':410,
 'ovo cozido':488,'ovo inteiro cozido':488,'ovo frito':490,'ovo de codorna':485,
 'mussarela':463,'mucarela':463,'mozarela':463,'queijo mussarela':463,'queijo mucarela':463,
 'parmesao':464,'queijo parmesao ralado':464,'ricota':469,'requeijao':468,
 'creme de leite':447,'leite condensado':453,'leite de coco':523,'iogurte natural':448,
 'leite em po':459,'leite em po integral':459,'leite em po desnatado':456,
 'leite desnatado':457,'leite desnatado uht':457,
 'chocolate ao leite':495,'chocolate meio amargo':498,'achocolatado':491,'achocolatado em po':491,
 'extrato de tomate':158,'molho de tomate':159,'pure de tomate':160,'maionese':524,
 'castanha do para':589,'castanha do brasil':589,'castanha de caju torrada salgada':588,
 'nozes':597,'noz':597,'gergelim':593,'linhaca':594,'tofu':584,'coco':590,'coco fresco ralado':590,
 'amendoim cru':557,'amendoim torrado salgado':558,'pacoca':579,
 'abacaxi':164,'abacate':163,'morango':239,'melancia':235,'melao':236,
 'banana prata':182,'banana nanica':179,'banana da terra':175,'mamao formosa':225,'mamao papaia':226,
 'maca fuji':222,'maca argentina':221,'limao tahiti':220,'maracuja':232,
 'melado de cana':508,'agua de coco':478,'caldo de cana':473,
};
const byId=new Map(foods.map(f=>[f.id,f]));
// Preparation modifiers that don't change nutrient composition. Never strip fried,
// dried, cooked, skimmed, with/without skin, brands or other meaningful qualifiers.
function cleanName(name:string){return normalize(name).replace(/[-/]/g,' ').replace(/\b(?:bem |finamente )?(?:picad[oa]s?|ralad[oa]s?|cortad[oa]s?)\b/g,' ').replace(/\bem (?:cubos|pedacos|rodelas|tiras)\b/g,' ').replace(/\ba gosto\b/g,' ').replace(/\s+/g,' ').trim();}
const plurals:Record<string,string>={ovos:'ovo',cebolas:'cebola',cenouras:'cenoura',tomates:'tomate',batatas:'batata',bananas:'banana',macas:'maca',morangos:'morango',castanhas:'castanha',nozes:'noz',amendoas:'amendoa',sementes:'semente',flocos:'floco',folhas:'folha',graos:'grao',cozida:'cozido',cozidas:'cozido',cozidos:'cozido',crua:'cru',cruas:'cru',crus:'cru',assada:'assado',assadas:'assado',grelhada:'grelhado',frita:'frito',inteira:'inteiro'};
function tokens(name:string){return cleanName(name).split(' ').filter(t=>t&&!['de','do','da','dos','das','e'].includes(t)).map(t=>plurals[t]||t);}
const key=(name:string)=>tokens(name).sort().join(' ');
const aliasKeys=new Map(Object.entries(aliases).map(([name,id])=>[key(name),id]));
const index=foods.map(food=>({food,terms:tokens(food.name),names:[food.name,...Object.keys(aliases).filter(a=>aliases[a]===food.id)].map(tokens)}));
export function matchFood(name:string):Food|undefined{
 const k=key(name);if(!k)return undefined;
 const alias=aliasKeys.get(k);if(alias)return byId.get(alias);
 const exact=index.filter(f=>f.terms.slice().sort().join(' ')===k);
 return exact.length===1?exact[0].food:undefined;
}
function near(a:string,b:string){
 if(a.length<4||Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,edits=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
 return edits+(a.length-i)+(b.length-j)<=1;
}
export function searchFoods(query:string,limit=30):Food[]{
 const terms=tokens(query),direct=matchFood(query);
 const rank=(candidate:string[])=>{
  if(!terms.length)return 1;
  let score=0;for(const term of terms){if(candidate.includes(term))score+=10;else if(candidate.some(t=>t.startsWith(term)))score+=6;else if(candidate.some(t=>near(term,t)))score+=2;else return 0;}
  return score+1/(candidate.length+1);
 };
 return index.map(f=>({food:f.food,score:f.food.id===direct?.id?10000:Math.max(...f.names.map(rank))}))
  .filter(f=>f.score>0).sort((a,b)=>b.score-a.score||Number(!!b.food.nutrients)-Number(!!a.food.nutrients)||a.food.id-b.food.id).slice(0,limit).map(f=>f.food);
}

// Measured ingredient-specific cup weights, not a universal grams-per-cup factor.
// King Arthur: flour 120g/cup, sugar 198g/cup, brown sugar packed 213g/cup,
// oats 89g/cup, cornstarch 28g/quarter-cup, butter 113g/8 tbsp, large egg 50g.
const cupWeights:Record<number,number>={35:120,494:198,492:198,493:213,7:89,42:112,261:226,262:226};
export function convertWeight(quantity:number|null|undefined,unit:Unit,foodId?:number|null):{grams:number|null;conversion:string}{
 if(!quantity||!Number.isFinite(quantity)||quantity<=0)return {grams:null,conversion:'Informe a quantidade.'};
 let factor:number|undefined;let conversion='';
 if(unit==='g'||unit==='kg'){factor=unit==='g'?1:1000;conversion='Peso informado';}
 else if(foodId===10003&&['cup','tbsp','tsp'].includes(unit)){factor=({cup:233.6,tbsp:18,tsp:6} as Record<string,number>)[unit];conversion='Sal comum: chá 6 g, sopa 18 g, xícara 233,6 g (TABNUT)';}
 else if(unit==='un'&&foodId===489){factor=50;conversion='Ovo grande: 50 g comestíveis/unidade (King Arthur)';}
 else if(foodId===10001&&['ml','l','cup','tbsp','tsp'].includes(unit)){
  factor=1.032*({ml:1,l:1000,cup:240,tbsp:15,tsp:5}[unit as 'ml']??0);conversion='Leite: 1,032 g/ml (Embrapa); xícara 240 ml, sopa 15 ml, chá 5 ml';
 }else if((foodId===10002||foodId===272)&&['ml','l','cup','tbsp','tsp'].includes(unit)){
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
