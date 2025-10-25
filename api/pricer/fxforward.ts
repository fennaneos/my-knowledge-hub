// POST { S, r_dom, r_for, T }  -> F = S * exp((r_dom - r_for)*T)
export default async function handler(req:any,res:any){
  try{
    const body = req.method==="POST" ? await parseBody(req) : {};
    const { S=1.10, r_dom=0.035, r_for=0.01, T=0.5 } = body;
    const F = S * Math.exp((+r_dom - +r_for) * +T);
    return res.status(200).json({ forward: F });
  }catch(e:any){
    return res.status(400).json({ error: e?.message||"bad request" });
  }
}
async function parseBody(req:any){
  if (req.body) return typeof req.body==="string" ? JSON.parse(req.body): req.body;
  const text = await new Response(req.body || null).text().catch(()=>null);
  return text? JSON.parse(text): {};
}
