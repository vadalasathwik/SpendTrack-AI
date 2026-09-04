import { GoogleGenAI } from '@google/genai';

export interface ExtractedReceiptItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface ExtractedReceiptData {
  merchant: string;
  purchaseDate: string;
  totalAmount: number;
  currency: string;
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

const VISION_SYSTEM_INSTRUCTION = `You are a specialized AI receipt parsing system designed for Indian and international retail receipts, tax invoices, and Kirana store bills (e.g. D-Mart, Reliance Fresh, Ratnadeep, BigBasket, Supermarkets, Restaurants, Utility Bills, GST Invoices).

Your ONLY function is to extract structured receipt data from the provided image and return valid JSON.

RULES:
1. NEVER generate conversational responses, markdown explanations, or preamble text.
2. Return ONLY a single raw JSON object matching this EXACT schema:
{
  "merchant": "Store or Merchant Name",
  "purchaseDate": "YYYY-MM-DD",
  "totalAmount": 0.00,
  "currency": "INR",
  "items": [
    {
      "name": "Item Name",
      "category": "Groceries | Household | Dining | Utilities | Shopping | Healthcare | Transport | Entertainment | Other",
      "quantity": 1.0,
      "unit": "unit | kg | g | L | ml | pack | bottle | pc",
      "price": 0.00
    }
  ]
}
3. Format purchaseDate as YYYY-MM-DD. If missing on receipt, use current date.
4. Ensure all price, totalAmount, and quantity values are strict numbers (not strings).
5. If individual item prices cannot be distinguished, return 1 item with the total receipt amount.`;

export class ReceiptVisionService {
  /**
   * Sends image buffer / base64 data to Gemini Vision and extracts structured receipt JSON
   */
  async analyzeReceiptImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<ExtractedReceiptData> {
    const ai = getAiClient();

    // Clean base64 prefix if present
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: 'Extract all itemized purchase data, merchant, purchase date, and total from this receipt image. Return ONLY valid JSON.',
          },
        ],
      },
    ];

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: VISION_SYSTEM_INSTRUCTION,
            temperature: 0.1, // Low temperature for factual OCR extraction
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text;
        if (!rawText) {
          throw new Error('Empty response from Gemini Vision API.');
        }

        // Clean any codeblock formatting
        const cleanedJsonText = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanedJsonText);
        return this.validateAndSanitizeData(parsed);
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini Vision model ${modelName} failed:`, err.message);
      }
    }

    throw new Error(`Failed to parse receipt with Gemini Vision: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Ensures all fields strictly adhere to the required numerical and structural schema
   */
  private validateAndSanitizeData(data: any): ExtractedReceiptData {
    const merchant = typeof data?.merchant === 'string' && data.merchant.trim() ? data.merchant.trim() : 'Receipt Purchase';
    
    // Purchase Date validation YYYY-MM-DD
    let purchaseDate = new Date().toISOString().split('T')[0];
    if (typeof data?.purchaseDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.purchaseDate)) {
      purchaseDate = data.purchaseDate;
    }

    const totalAmount = Number(data?.totalAmount) || 0;
    const currency = data?.currency || 'INR';

    const items: ExtractedReceiptItem[] = [];
    if (Array.isArray(data?.items)) {
      for (const rawItem of data.items) {
        if (rawItem && typeof rawItem === 'object') {
          const name = typeof rawItem.name === 'string' && rawItem.name.trim() ? rawItem.name.trim() : 'Item';
          const category = typeof rawItem.category === 'string' ? rawItem.category : 'Groceries';
          const quantity = Number(rawItem.quantity) > 0 ? Number(rawItem.quantity) : 1;
          const unit = typeof rawItem.unit === 'string' && rawItem.unit.trim() ? rawItem.unit.trim() : 'unit';
          const price = Number(rawItem.price) >= 0 ? Number(rawItem.price) : 0;

          items.push({
            name,
            category,
            quantity,
            unit,
            price,
          });
        }
      }
    }

    // Fallback if no items extracted
    if (items.length === 0) {
      items.push({
        name: merchant,
        category: 'Groceries',
        quantity: 1,
        unit: 'unit',
        price: totalAmount,
      });
    }

    return {
      merchant,
      purchaseDate,
      totalAmount,
      currency,
      items,
    };
  }
}

export const receiptVisionService = new ReceiptVisionService();
