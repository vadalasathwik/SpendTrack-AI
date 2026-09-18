import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getMarketIntelligence() {
  const indices = [
    {
      symbol: "NIFTY 50",
      name: "NSE NIFTY 50 Index",
      price: 24890.5,
      change: +145.2,
      changePercent: +0.59,
      trend: "BULLISH" as const,
    },
    {
      symbol: "BANKNIFTY",
      name: "NSE Nifty Bank Index",
      price: 52140.8,
      change: +310.4,
      changePercent: +0.6,
      trend: "BULLISH" as const,
    },
    {
      symbol: "GOLD_24K",
      name: "24K Physical Gold (₹/10g)",
      price: 74250,
      change: +420,
      changePercent: +0.57,
      trend: "BULLISH" as const,
    },
    {
      symbol: "SILVER_1KG",
      name: "Silver (₹/1kg)",
      price: 88500,
      change: -150,
      changePercent: -0.17,
      trend: "NEUTRAL" as const,
    },
    {
      symbol: "USD/INR",
      name: "US Dollar to Indian Rupee",
      price: 83.92,
      change: -0.04,
      changePercent: -0.05,
      trend: "NEUTRAL" as const,
    },
    {
      symbol: "IN10Y_BOND",
      name: "India 10-Yr Government Bond",
      price: 6.88,
      change: -0.02,
      changePercent: -0.29,
      trend: "BULLISH" as const,
    },
  ];

  let marketSentiment: "BULLISH" | "BEARISH" | "NEUTRAL" = "BULLISH";
  let goldTrend = "Gold maintaining strong upward momentum above ₹74,000/10g supported by central bank buying.";
  let equityOutlook = "Nifty 50 holding firm near 24,900. Large-cap banking and IT stocks leading quarterly rally.";
  let etfOpportunity = "Nifty IT & Sovereign Gold Bonds (SGB) presenting optimal dip-buying entry points.";

  if (ai) {
    try {
      const prompt = `Provide a concise 3-bullet market outlook for an Indian investor based on NIFTY 24890 (+0.59%), Gold ₹74250 (+0.57%), USD/INR 83.92. Return bullet points on Gold Trend, Equity Outlook, and ETF Opportunity.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (response?.text) {
        const text = response.text.trim();
        equityOutlook = text;
      }
    } catch (e) {
      console.warn("Gemini market intelligence advice fallback:", e);
    }
  }

  return {
    indices,
    marketSentiment,
    goldTrend,
    equityOutlook,
    etfOpportunity,
  };
}
