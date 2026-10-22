import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseIngredientLine as parse,parseIngredientList,convertWeight,matchFood,resolveIngredient,parseQuantity,formatQuantity} from '../lib/ingredients';
import {ingredientSchema,emptyRecipe,recipeSchema} from '../lib/model';
import {calculateNutrition} from '../lib/nutrition';

test('lista identifica alimentos e converte quantidades sem cadastro de nutrientes',()=>{
 const list=parseIngredientList('2 xícaras de farinha de trigo\n1/2 xícara de açúcar\n3 ovos\n250 ml de leite');
 assert.equal(list.length,4);assert.deepEqual(list.map(i=>i.grams),[240,99,150,258]);
 assert.deepEqual(list.map(i=>i.foodId),[35,494,489,10001]);
 const n=calculateNutrition(list,10,null);assert.equal(n.complete,true);assert.ok(n.total.kcal>1000);assert.equal(n.perServing?.kcal,n.total.kcal/10);
});
test('frações mistas e Unicode, vírgula decimal, kg e colheres',()=>{
 assert.equal(parse('1 1/2 xícara de farinha de trigo').grams,180);
 assert.equal(parse('1½ xícara de farinha de trigo').grams,180);
 assert.equal(parse('½ xícara de açúcar').grams,99);
 assert.equal(parse('0,5 kg de farinha de trigo').grams,500);
 assert.equal(parse('2 colheres (de sopa) de açúcar').grams,24.75);
 assert.equal(parse('3 colheres de chá de açúcar').grams,12.375);
 assert.equal(parse('200g de farinha de trigo').grams,200);
 assert.equal(parse('uma xícara de farinha de trigo').grams,120);
 assert.equal(parse('1 litro de leite').grams,1032);
 assert.equal(parseQuantity('1/0'),null);
});
test('equivalências são específicas por alimento, sem presumir 1ml = 1g',()=>{
 assert.equal(convertWeight(1,'cup',35).grams,120);assert.equal(convertWeight(1,'cup',494).grams,198);
 assert.equal(convertWeight(100,'ml',35).grams,null);assert.equal(convertWeight(1,'un',35).grams,null);
 assert.equal(parse('1 colher de sopa de óleo de soja').grams,13.6);
 assert.equal(parse('100 ml de leite').grams,103.2);
 assert.equal(convertWeight(1000,'kg',35).grams,null);
});
test('não adivinha alimento ambíguo, marca, estado de preparo ou medida desconhecida',()=>{
 for(const name of ['arroz','leite desnatado','açúcar de coco','manteiga','ovo cozido','farinha de trigo Marca X'])assert.equal(matchFood(name),undefined,name);
 for(const line of ['sal a gosto','1 lata de produto especial','2 colheres de farinha de trigo','1 pitada de açúcar']){
  const i=parse(line);assert.equal(i.grams,null);assert.equal(calculateNutrition([i],4,null).complete,false);assert.equal(i.originalText,line);
 }
 assert.equal(parse('2 cenouras').unit,'un');assert.equal(parse('2 cenouras').grams,null);
});
test('lista preserva linhas desconhecidas e não inclui modo de preparo',()=>{
 const list=parseIngredientList('Bolo\nIngredientes:\n• 2 ovos\n- 100 g de açúcar\nsal a gosto\nModo de preparo:\nMisture tudo');
 assert.equal(list.length,3);assert.equal(list[2].name,'sal a gosto');assert.equal(list[0].grams,100);
 assert.equal(parseIngredientList('2 ovos;100 g de açúcar').length,2);
});
test('persistência mantém medida original e recalcula valores da base no servidor',()=>{
 const initial=parse('2 xícaras de farinha de trigo');
 const tampered={...initial,grams:999,nutrients:{kcal:0,protein:0,carbs:0,fat:0}};
 const resolved=resolveIngredient(ingredientSchema.parse(JSON.parse(JSON.stringify(tampered))));
 assert.equal(resolved.grams,240);assert.ok(resolved.nutrients!.kcal>0);assert.equal(formatQuantity(resolved),'2 xícara(s)');
 const recipe=recipeSchema.parse({...emptyRecipe(),title:'Teste receita',steps:'Misture tudo',ingredients:[resolved]});
 assert.deepEqual(recipe.ingredients[0],resolved);
});
test('receitas antigas, rótulos manuais e pesos conferidos são preservados',()=>{
 const old={name:'Receita antiga',grams:250,nutrients:{kcal:100,protein:2,carbs:3,fat:4},source:'Rótulo'};
 assert.equal(resolveIngredient(old).grams,250);assert.deepEqual(resolveIngredient(old).nutrients,old.nutrients);
 const custom=resolveIngredient({...parse('2 ovos'),manualWeight:110});assert.equal(custom.grams,110);
 const manual=resolveIngredient({...parse('100 g de produto especial'),foodId:null,nutrients:old.nutrients,source:'Rótulo'});assert.equal(manual.grams,100);assert.deepEqual(manual.nutrients,old.nutrients);
});
test('sem alimento ou peso não exibe zero como cálculo completo',()=>{
 const i=parse('1 xícara de produto especial');const n=calculateNutrition([i],4,null);
 assert.equal(n.complete,false);assert.equal(n.known,0);assert.equal(n.missing,1);
 assert.equal(calculateNutrition([],4,null).complete,false);
});
test('validação rejeita quantidades inválidas, pesos negativos e unidades fora do contrato',()=>{
 const base=parse('100 g de açúcar');
 for(const change of [{quantity:0},{quantity:-1},{grams:-1},{unit:'litros secretos'},{manualWeight:Infinity}])assert.equal(ingredientSchema.safeParse({...base,...change}).success,false);
});
