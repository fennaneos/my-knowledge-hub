import React, { useEffect } from "react";
import Layout from "@theme/Layout";
import { setPlan } from "../lib/plan";

export default function ProSuccess(){
  useEffect(()=>{ setPlan("pro"); }, []);
  return (
    <Layout title="Welcome to Pro">
      <div style={{maxWidth:900, margin:"0 auto", padding:"24px"}}>
        <div className="panel" style={{padding:18}}>
          <div className="panelHeader">Welcome to Pro 🎉</div>
          <div className="panelBody" style={{display:"grid", gap:10}}>
            <div>Your account on this device is now <b>Pro</b>. Enjoy unlimited runs, advanced panes and exports.</div>
            <div className="cta-group">
              <a className="btn-neo-blue" href="/virtual-trading">Go to Virtual Trading</a>
              <a className="btn-ghost-blue" href="/lab">Open Lab</a>
            </div>
            <div style={{opacity:.7, fontSize:12}}>
              Note: this demo stores plan locally (no server). Use this page after checkout success while you build server webhooks.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
