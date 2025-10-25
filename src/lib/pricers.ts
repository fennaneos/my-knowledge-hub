import { postJSON } from "./client";

export async function priceBS(p:{S:number;K:number;r:number;vol:number;T:number;cp:"C"|"P"}){
  return postJSON<{price:number}>("/api/pricer/blackscholes", p);
}
export async function priceFXFwd(p:{S:number;r_dom:number;r_for:number;T:number}){
  return postJSON<{forward:number}>("/api/pricer/fxforward", p);
}
