import type {Ingredient,Nutrients} from './model';
export function calculateNutrition(ingredients:Ingredient[],servings:number,weight:number|null){
 const total:Nutrients={kcal:0,protein:0,carbs:0,fat:0}; let missing=0;
 for(const i of ingredients){if(!i.nutrients){missing++;continue;} for(const k of Object.keys(total) as (keyof Nutrients)[])total[k]+=i.nutrients[k]*i.grams/100;}
 const scale=(divisor:number)=>Object.fromEntries(Object.entries(total).map(([k,v])=>[k,v/divisor])) as Nutrients;
 return {total,perServing:servings>0?scale(servings):null,per100g:weight&&weight>0?scale(weight/100):null,missing,complete:missing===0};
}
