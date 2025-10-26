import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";

type AnyProps = Record<string, any>;

export default function PlotlyNoSSR(props: AnyProps) {
  // Only require/react-plotly.js in the browser
  return (
    <BrowserOnly>
      {() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Plot = require("react-plotly.js").default;
        return <Plot {...props} />;
      }}
    </BrowserOnly>
  );
}
