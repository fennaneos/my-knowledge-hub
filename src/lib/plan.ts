// super-light client plan store (localStorage only)
// values: "free" | "pro"
const KEY = "asraelx:plan";

export type Plan = "free" | "pro";

export function getPlan(): Plan {
  const v = (typeof window !== "undefined" && localStorage.getItem(KEY)) || "free";
  return v === "pro" ? "pro" : "free";
}

export function setPlan(p: Plan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, p);
  window.dispatchEvent(new CustomEvent("plan:changed", { detail: p }));
}
