import React, { useEffect, useRef } from "react";

export function TradingViewWidget({ symbol, price }: { symbol: string; price: number }) {
  const container = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!container.current) return;
    const el = container.current;
    el.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        const widget = new window.TradingView.widget({
          container_id: el.id,
          autosize: true,
          symbol,
          interval: "60",
          theme: "dark",
          style: "1",
          locale: "en",
          hide_side_toolbar: false,
          allow_symbol_change: true,
          studies: [],
          onChartReady: function () {
            // @ts-ignore
            chartRef.current = widget.chart();
            drawMarker(price);
          },
        });
      }
    };
    el.appendChild(script);
  }, [symbol]);

  function drawMarker(currentPrice: number) {
    if (!chartRef.current) return;
    if (markerRef.current) {
      try {
        chartRef.current.removeEntity(markerRef.current);
      } catch {}
    }
    markerRef.current = chartRef.current.createShape(
      { price: currentPrice },
      {
        shape: "horizontal_line",
        text: `Model Spot: ${currentPrice.toFixed(2)} (${symbol})`,
        lock: true,
        color: "#ffb400",
        linewidth: 2,
      }
    );
  }

  useEffect(() => {
    if (chartRef.current) drawMarker(price);
  }, [price]);

  return (
    <div
      id={`tv-${symbol}`}
      ref={container}
      style={{ height: 400, width: "100%", borderRadius: 8, overflow: "hidden" }}
    />
  );
}
