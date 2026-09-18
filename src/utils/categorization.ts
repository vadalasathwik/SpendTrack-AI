export interface CategoryMatch {
  category: string;
  confidence: number; // 0 to 100
  suggestedTags: string[];
}

const MERCHANT_CATEGORY_MAP: Record<string, { category: string; tags: string[] }> = {
  swiggy: { category: 'Food & Dining', tags: ['Food Delivery', 'Online Order'] },
  zomato: { category: 'Food & Dining', tags: ['Food Delivery', 'Restaurants'] },
  starbucks: { category: 'Food & Dining', tags: ['Coffee', 'Cafe'] },
  mcdonalds: { category: 'Food & Dining', tags: ['Fast Food'] },
  uber: { category: 'Transportation', tags: ['Cab', 'Rideshare'] },
  ola: { category: 'Transportation', tags: ['Cab', 'Rideshare'] },
  rapido: { category: 'Transportation', tags: ['Bike Taxi'] },
  'indian oil': { category: 'Fuel', tags: ['Petrol', 'Vehicle'] },
  hpcl: { category: 'Fuel', tags: ['Petrol', 'Vehicle'] },
  bpcl: { category: 'Fuel', tags: ['Petrol', 'Vehicle'] },
  shell: { category: 'Fuel', tags: ['Petrol', 'Vehicle'] },
  amazon: { category: 'Shopping', tags: ['E-Commerce', 'Online Shopping'] },
  flipkart: { category: 'Shopping', tags: ['E-Commerce'] },
  myntra: { category: 'Shopping', tags: ['Apparel', 'Fashion'] },
  mmtc: { category: 'Gold & Investments', tags: ['Precious Metals', 'Gold'] },
  tanishq: { category: 'Gold & Investments', tags: ['Jewelry', 'Gold'] },
  zerodha: { category: 'Investments', tags: ['Stocks', 'Mutual Funds'] },
  groww: { category: 'Investments', tags: ['Stocks', 'SIP'] },
  netflix: { category: 'Subscriptions', tags: ['Entertainment', 'Streaming'] },
  spotify: { category: 'Subscriptions', tags: ['Music', 'Streaming'] },
  bescom: { category: 'Bills & Utilities', tags: ['Electricity', 'Utility'] },
  act: { category: 'Bills & Utilities', tags: ['Broadband', 'Internet'] },
  jio: { category: 'Bills & Utilities', tags: ['Mobile', 'Telecom'] },
  airtel: { category: 'Bills & Utilities', tags: ['Mobile', 'Telecom'] },
};

export function autoCategorizeMerchant(merchantName: string): CategoryMatch {
  if (!merchantName) {
    return { category: 'General', confidence: 50, suggestedTags: [] };
  }

  const normalized = merchantName.toLowerCase().trim();

  for (const [key, value] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (normalized.includes(key)) {
      return {
        category: value.category,
        confidence: 95,
        suggestedTags: value.tags,
      };
    }
  }

  if (normalized.includes('mart') || normalized.includes('super') || normalized.includes('grocery')) {
    return { category: 'Groceries', confidence: 85, suggestedTags: ['Daily Needs'] };
  }

  if (normalized.includes('hospital') || normalized.includes('pharmacy') || normalized.includes('apollo') || normalized.includes('med')) {
    return { category: 'Healthcare', confidence: 90, suggestedTags: ['Medical'] };
  }

  return { category: 'General', confidence: 60, suggestedTags: ['Misc'] };
}
