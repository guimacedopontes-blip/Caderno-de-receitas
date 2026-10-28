import {test} from 'node:test';
import assert from 'node:assert/strict';
import {foods,matchFood,searchFoods,parseIngredientList,resolveIngredient} from '../lib/ingredients';
import {calculateNutrition} from '../lib/nutrition';

test('nomes usuais, plurais, acentos e cortes identificam a referência correta',()=>{
 for(const [name,id] of Object.entries({'cebola picada':107,'cenouras raladas':110,'tomates em cubos':157,'peito de frango':409,'peito de frango cozido':408,'arroz branco cozido':3,'arroz integral cru':2,'mussarela':463,'castanha do Pará':589,'nozes':597,'lentilha':578,'azeite de oliva':260,'óleo de soja':272,'ovo cozido':488,'alho-poró cru':83,'creme de leite':447,'leite em pó desnatado':456}))assert.equal(matchFood(name)?.id,id,name);
});
test('busca oferece opções para nomes ambíguos e pequenos erros, sem decidir sozinha',()=>{
 for(const name of ['arroz','manteiga','banana','frango','queijo']){assert.equal(matchFood(name),undefined);assert.ok(searchFoods(name).length>=2,name);}
 assert.equal(matchFood('cenora'),undefined);assert.equal(searchFoods('cenora')[0]?.id,110);
 assert.ok(searchFoods('castanhas do para').some(f=>f.id===589));
 assert.ok(searchFoods('mussa').some(f=>f.id===463));
 assert.equal(searchFoods('',1000).length,foods.length);
});
test('qualificadores nutricionais e marcas não são apagados para reconhecer automaticamente',()=>{
 for(const name of ['cenoura frita','cebola desidratada','leite sem lactose','farinha de trigo Marca X','azeite saborizado','banana chips','coco seco ralado','peito de frango com pele'])assert.equal(matchFood(name),undefined,name);
 assert.equal(matchFood('leite desnatado')?.id,457);
 assert.equal(matchFood('leite desnatado')?.nutrients,null);
});
test('alimentos omitidos da importação anterior usam os valores oficiais por 100g',()=>{
 const list=parseIngredientList('100 g de lentilha crua\n100 g de nozes\n100 g de azeite de oliva\n100 g de gergelim');
 const n=calculateNutrition(list,4,null);
 assert.equal(n.complete,true);assert.equal(n.total.kcal,339+620+884+584);
 assert.equal(n.total.protein,23.2+14+0+21.2);
 assert.equal(n.perServing?.kcal,606.75);
});
test('dados em reavaliação são pendentes, enquanto NA de óleo puro não perde energia',()=>{
 const missing=parseIngredientList('100 g de leite desnatado');
 assert.equal(missing[0].foodId,457);assert.equal(calculateNutrition(missing,1,null).complete,false);
 const oil=parseIngredientList('1 colher de sopa de óleo de soja')[0];
 assert.equal(oil.grams,13.6);assert.equal(oil.foodId,272);assert.equal(oil.nutrients?.kcal,884);
 const legacy=resolveIngredient({...oil,foodId:10002});assert.equal(legacy.grams,13.6);assert.equal(legacy.nutrients?.kcal,884);
});
test('catálogo completo encontra todos os nomes oficiais da TACO',()=>{
 for(const f of foods.filter(f=>f.id<10000))assert.equal(matchFood(f.name)?.id,f.id,f.name);
});


test('sal comum é complementar, distinto do grosso e dietético e converte colheres',()=>{
 for(const name of ['sal','sal de cozinha','sal refinado','sal comum'])assert.equal(matchFood(name)?.id,10003);
 assert.equal(matchFood('sal grosso')?.id,517);assert.equal(matchFood('sal dietético')?.id,516);
 assert.equal(matchFood('sal temperado'),undefined);assert.equal(searchFoods('sal')[0].id,10003);
 const list=parseIngredientList('5 g de sal\n1 colher de chá de sal\n1 colher de sopa de sal');
 assert.deepEqual(list.map(i=>i.grams),[5,6,18]);
 const n=calculateNutrition(list,12,null);assert.equal(n.complete,true);assert.equal(n.total.kcal,0);
 assert.ok(list.every(i=>i.source.includes('UNIFESP')));
 const partial=calculateNutrition([...list,...parseIngredientList('5 g de ingrediente desconhecido')],12,null);
 assert.equal(partial.complete,false);assert.equal(partial.missing,1);
});
