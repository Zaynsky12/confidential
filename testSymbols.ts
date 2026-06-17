import { useTradeStore } from "./src/store/useTradeStore.ts";
const getTVSymbol = (pythSymbol: string) => {
  const parts = pythSymbol.split(".")
  const cleanPair = parts[parts.length - 1].replace("/", "") 
  if (pythSymbol.startsWith("Crypto.")) return `PYTH:${cleanPair}`
  if (pythSymbol.startsWith("Equity.US.")) {
    const symbol = parts[2].split("/")[0]
    if (symbol === "SPY") return "AMEX:SPY"
    return `NASDAQ:${symbol}`
  }
  if (pythSymbol.startsWith("Metal.")) return `OANDA:${cleanPair}`
  if (pythSymbol.startsWith("FX.")) return `PYTH:${cleanPair}`
  return `PYTH:${cleanPair}`
}
const state = useTradeStore.getState();
state.markets.forEach(m => console.log(m.pythSymbol, "->", getTVSymbol(m.pythSymbol)));
