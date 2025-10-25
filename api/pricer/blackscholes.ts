// POST { S,K,r,vol,T,cp }  cp: "C" | "P"
function cdf(x:number){ // std normal CDF
  return 0.5*(1+erf(x/Math.SQRT2));
}
function erf(x:number){
  // Abramowitz-Stegun
  const s=Math.sign(x); x=Math.abs(x);
  const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911;
  const t=1/(1+p*x); const y=1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return s*y;
}
function bs(S:number,K:number,r:number,vol:number,T:number,cp:"C"|"P"){
  const d1=(Math.log(S/K)+(r+0.5*vol*vol)*T)/(vol*Math.sqrt(T));
  const d2=d1-vol*Math.sqrt(T);
  const Nd1=cdf(cp==="C"?d1:-d1);
  const Nd2=cdf(cp==="C"?d2:-d2);
  if (cp==="C") return S*cdf(d1)-K*Math.exp(-r*T)*cdf(d2);
  return K*Math.exp(-r*T)*cdf(-d2)-S*cdf(-d1);
}
export default async function handler(req:any,res:any){
  try{
    const body = req.method==="POST" ? await parseBody(req) : {};
    const { S=100,K=100,r=0.02,vol=0.2,T=1,cp="C" } = body;
    const price = bs(+S,+K,+r,+vol,+T, cp==="P"?"P":"C");
    return res.status(200).json({ price });
  }catch(e:any){
    return res.status(400).json({ error: e?.message||"bad request" });
  }
}
async function parseBody(req:any){
  if (req.body) return typeof req.body==="string" ? JSON.parse(req.body): req.body;
  const text = await new Response(req.body || null).text().catch(()=>null);
  return text? JSON.parse(text): {};
}
