export async function getQuote(symbol:string){
  const r = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
  return (await r.json());
}
export async function postJSON<T>(url:string, body:any):Promise<T>{
  const r = await fetch(url,{method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
