// utils/bs.ts


import 'katex/dist/katex.min.css';

import { InlineMath, BlockMath } from 'react-katex';

import { erf } from "mathjs";


const Nd = (x:number)=>0.5*(1+erf(x/Math.SQRT2));
const pd = (x:number)=>Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);

export function bs(S:number,K:number,r:number,q:number,vol:number,T:number){
  const df = Math.exp(-r*T), dq = Math.exp(-q*T), sv = vol*Math.sqrt(T);
  const d1 = (Math.log(S/K)+(r-q+0.5*vol*vol)*T)/sv;
  const d2 = d1 - sv;
  const call = S*dq*Nd(d1) - K*df*Nd(d2);
  const put  = K*df*Nd(-d2) - S*dq*Nd(-d1);
  const gamma = dq*pd(d1)/(S*sv);
  const vega  = S*dq*pd(d1)*Math.sqrt(T); // per 1.00 vol
  const deltaC = dq*Nd(d1), deltaP = dq*(Nd(d1)-1);
  const thetaC = -(S*dq*pd(d1)*vol)/(2*Math.sqrt(T)) - r*K*df*Nd(d2) + q*S*dq*Nd(d1);
  const thetaP = -(S*dq*pd(d1)*vol)/(2*Math.sqrt(T)) + r*K*df*Nd(-d2) - q*S*dq*Nd(-d1);
  const rhoC = K*T*df*Nd(d2), rhoP = -K*T*df*Nd(-d2);
  return {call, put, deltaC, deltaP, gamma, vega, thetaC, thetaP, rhoC, rhoP, d1, d2};
}
