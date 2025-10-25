import React from "react";

export default function PricerPanel({
  title, children, footer
}:{ title:string; children:React.ReactNode; footer?:React.ReactNode }){
  return (
    <div className="panel" style={{padding:16}}>
      <div className="panelHeader" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>{title}</div>
        <a className="btn-neo-red-modern" href="/pricing-labs">Get Pro</a>
      </div>
      <div className="panelBody" style={{display:"grid",gap:10}}>
        {children}
      </div>
      {footer && <div style={{marginTop:10}}>{footer}</div>}
    </div>
  );
}
