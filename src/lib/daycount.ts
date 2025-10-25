// Light business-day utils
export const isWeekend = (d:Date)=> d.getDay()===0 || d.getDay()===6;
export function addBizDays(d:Date, n:number){
  const x=new Date(d); let k=0,step=n>0?1:-1;
  while(k!==n){ x.setDate(x.getDate()+step); if(!isWeekend(x)) k+=step; }
  return x;
}
export const yearFracACT365 = (d0:Date,d1:Date)=> (d1.getTime()-d0.getTime())/(365*24*3600*1000);
