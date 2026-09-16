import { GoogleGenAI } from '@google/genai';

export interface ExtractedReceiptItem {
  name: string;
  price: number;
  quantity?: number;
  unit?: string;
  category?: string;
}

export interface ExtractedReceiptResult {
  title: string;
  amount: number;
  purchaseDate: string;
  category: string;
  merchant: string;
  items: ExtractedReceiptItem[];
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const RECEIPT_SYSTEM_INSTRUCTION = `You are a specialized AI receipt OCR parsing system.
Your ONLY function is to extract structured receipt data from the provided image and return valid JSON.

RULES:
1. NEVER generate conversational responses, markdown explanations (e.g. no \`\`\`json block wrappers), or preamble text.
2. Return ONLY a single raw JSON object matching this EXACT schema:
{
  "title": "Merchant or Store Name",
  "amount": 0.00,
  "purchaseDate": "YYYY-MM-DD",
  "category": "Groceries | Household | Dining | Utilities | Shopping | Healthcare | Transport | Entertainment | Other",
  "merchant": "Store or Merchant Name",
  "items": [
    {
      "name": "Item Name",
      "price": 0.00,
      "quantity": 1
    }
  ]
}
3. Format purchaseDate as YYYY-MM-DD. If missing on receipt, use current date.
4. Ensure amount, price, and quantity are valid numbers.
5. Auto-select the single best matching category for the overall receipt.`;

/**
 * Normalizes raw JSON response from Gemini Vision into standard ExtractedReceiptResult
 */
export function normalizeExpense(data: any): ExtractedReceiptResult {
  const merchant =
    typeof data?.merchant === 'string' && data.merchant.trim()
      ? data.merchant.trim()
      : typeof data?.merchantName === 'string' && data.merchantName.trim()
      ? data.merchantName.trim()
      : typeof data?.title === 'string' && data.title.trim()
      ? data.title.trim()
      : 'Receipt Purchase';

  const title =
    typeof data?.title === 'string' && data.title.trim()
      ? data.title.trim()
      : merchant;

  let purchaseDate = new Date().toISOString().split('T')[0];
  const rawDate = data?.purchaseDate || data?.date;
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    purchaseDate = rawDate;
  } else if (typeof rawDate === 'string' && !isNaN(new Date(rawDate).getTime())) {
    purchaseDate = new Date(rawDate).toISOString().split('T')[0];
  }

  const amount = Number(data?.amount ?? data?.total ?? data?.totalAmount) || 0;
  const category =
    typeof data?.category === 'string' && data.category.trim()
      ? data.category.trim()
      : 'Groceries';

  const items: ExtractedReceiptItem[] = [];
  if (Array.isArray(data?.items)) {
    for (const rawItem of data.items) {
      if (rawItem && typeof rawItem === 'object') {
        const name =
          typeof rawItem.name === 'string' && rawItem.name.trim()
            ? rawItem.name.trim()
            : 'Item';
        const price = Number(rawItem.price) >= 0 ? Number(rawItem.price) : 0;
        const quantity = Number(rawItem.quantity) > 0 ? Number(rawItem.quantity) : 1;
        const unit = typeof rawItem.unit === 'string' ? rawItem.unit : 'unit';

        items.push({
          name,
          price,
          quantity,
          unit,
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      name: title,
      price: amount,
      quantity: 1,
    });
  }

  return {
    title,
    amount,
    purchaseDate,
    category,
    merchant,
    items,
  };
}

/**
 * Extracts receipt data from image using Gemini 2.5 Flash Vision
 */
export async function extractReceipt(
  imageInput: string | { base64Data: string; mimeType?: string }
): Promise<ExtractedReceiptResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is missing.');
    throw new Error('GEMINI_API_KEY is missing');
  }

  let base64Data = '';
  let mimeType = 'image/jpeg';

  if (typeof imageInput === 'string') {
    base64Data = imageInput.replace(/^data:[^;]+;base64,/, '');
    const mimeMatch = imageInput.match(/^data:([^;]+);base64,/);
    if (mimeMatch) mimeType = mimeMatch[1];
  } else if (imageInput && typeof imageInput === 'object') {
    base64Data = (imageInput.base64Data || '').replace(/^data:[^;]+;base64,/, '');
    if (imageInput.mimeType) mimeType = imageInput.mimeType;
  }

  if (!base64Data) {
    throw new Error('Image base64 data is required');
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-3.6-flash'];
  let rawText: string | null = null;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const requestPayload = {
        contents: [
          {
            parts: [
              { text: `${RECEIPT_SYSTEM_INSTRUCTION}\n\nExtract receipt JSON: title, amount, purchaseDate, category, merchant, items[].` },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      };

      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (restRes.ok) {
        const restData: any = await restRes.json();
        rawText = restData?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (rawText) {
          console.log(`Receipt extracted via Gemini REST model ${modelName}`);
          break;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!rawText) {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: RECEIPT_SYSTEM_INSTRUCTION },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      rawText = response.text || null;
    } catch (sdkError: any) {
      lastError = sdkError;
    }
  }

  if (!rawText) {
    console.error('Gemini Vision Extraction Error:', lastError);
    throw new Error('Receipt scanner unavailable');
  }

  const cleanedJsonText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleanedJsonText);
  return normalizeExpense(parsed);
}
