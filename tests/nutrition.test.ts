import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateNutrition} from '../lib/nutrition';
import foods from '../lib/foods.json';
const ingredient={name:'Rótulo de teste',grams:250,source:'teste',nutrients:{kcal:200,protein:10,carbs:30,fat:4}};
test('escala corretamente por quantidade, porções e peso após o preparo',()=>{
 const n=calculateNutrition([ingredient],5,400);
 assert.deepEqual(n.total,{kcal:500,protein:25,carbs:75,fat:10});
 assert.deepEqual(n.perServing,{kcal:100,protein:5,carbs:15,fat:2});
 assert.deepEqual(n.per100g,{kcal:125,protein:6.25,carbs:18.75,fat:2.5});
 assert.equal(n.complete,true);
});
test('ingrediente desconhecido mantém cálculo explicitamente parcial',()=>{
 const n=calculateNutrition([ingredient,{...ingredient,nutrients:null}],2,null);
 assert.equal(n.complete,false); assert.equal(n.missing,1); assert.equal(n.total.kcal,500); assert.equal(n.per100g,null);
});
test('sem peso ou rendimento válido não produz infinito',()=>{
 const n=calculateNutrition([ingredient],0,0);assert.equal(n.perServing,null);assert.equal(n.per100g,null);
});
test('base TACO possui identificadores únicos e valores nutricionais plausíveis',()=>{
 assert.equal(foods.length,597);assert.deepEqual(foods.map(f=>f.id),Array.from({length:597},(_,i)=>i+1));
 assert.deepEqual(foods.filter(f=>!f.nutrients).map(f=>f.id),[450,457,458,472,591]);
 for(const f of foods){if(!f.nutrients)continue;for(const [k,v] of Object.entries(f.nutrients)){assert.ok(Number.isFinite(v)&&v>=0&&v<=(k==='kcal'?1000:100),f.name+' '+k)}}
 const rice=foods.find(f=>f.name==='Arroz, tipo 1, cozido');assert.ok(rice?.nutrients);assert.equal(rice.nutrients.kcal,128);assert.equal(rice.nutrients.carbs,28.1);
});
