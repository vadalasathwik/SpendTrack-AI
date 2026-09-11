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
  date?: string;
  time?: string;
  paymentMethod?: string;
  category?: string;
  totalAmount: number;
  total?: number;
  tax?: number;
  subtotal?: number;
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

const VISION_SYSTEM_INSTRUCTION = `You are a specialized AI receipt OCR parsing system.
Your ONLY function is to extract structured receipt data from the provided image and return valid JSON.

RULES:
1. NEVER generate conversational responses, markdown explanations (e.g. no \`\`\`json block wrappers), or preamble text.
2. Return ONLY a single raw JSON object matching this EXACT schema:
{
  "merchant": "Store or Merchant Name",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "paymentMethod": "Cash | Card | UPI | Other",
  "category": "Groceries | Household | Dining | Utilities | Shopping | Healthcare | Transport | Entertainment | Other",
  "items": [
    {
      "name": "Item Name",
      "category": "Groceries | Household | Dining | Utilities | Shopping | Healthcare | Transport | Entertainment | Other",
      "quantity": 1.0,
      "unit": "unit | kg | g | L | ml | pack | bottle | pc",
      "price": 0.00
    }
  ],
  "tax": 0.00,
  "subtotal": 0.00,
  "total": 0.00,
  "currency": "INR"
}
3. Format date as YYYY-MM-DD. If missing on receipt, use current date.
4. Ensure all total, subtotal, tax, price, and quantity values are strict numbers.`;

export class ReceiptVisionService {
  /**
   * Sends image buffer / base64 data to Gemini 3.6 Flash and extracts structured receipt JSON
   */
  async analyzeReceiptImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<ExtractedReceiptData> {
    const modelName = 'gemini-3.6-flash';
    console.log(`Using Gemini model: ${modelName}`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is missing.');
      throw new Error('Receipt scanner unavailable');
    }

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const imageMimeType = mimeType || 'image/jpeg';

    const promptText = `Extract structured receipt data from this receipt image: merchant, total, date, time, paymentMethod, category, items[], tax, subtotal. Return ONLY raw JSON without markdown formatting.`;

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: `${VISION_SYSTEM_INSTRUCTION}\n\n${promptText}` },
            {
              inline_data: {
                mime_type: imageMimeType,
                data: cleanBase64,
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

    let rawText: string | null = null;

    // 1. Primary Attempt via SDK
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${VISION_SYSTEM_INSTRUCTION}\n\n${promptText}` },
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction: VISION_SYSTEM_INSTRUCTION,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      rawText = response.text || null;
    } catch (sdkError: any) {
      console.error('SDK generateContent notice:', sdkError?.message || sdkError);

      // 2. Direct REST API endpoint (compatible with v1beta)
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const restRes = await fetch(restUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        });

        if (!restRes.ok) {
          const errBody = await restRes.text();
          console.error(`Gemini REST API Raw Error Response (${restRes.status}):`, errBody);
          throw new Error('Receipt scanner unavailable');
        }

        const restData: any = await restRes.json();
        rawText = restData?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (restError: any) {
        console.error('Gemini Vision API Raw Response/Error:', restError?.message || restError);
        throw new Error('Receipt scanner unavailable');
      }
    }

    if (!rawText) {
      console.error('Empty response body received from Gemini Vision API.');
      throw new Error('Receipt scanner unavailable');
    }

    try {
      const cleanedJsonText = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedJsonText);
      const sanitized = this.validateAndSanitizeData(parsed);
      console.log('Receipt parsed successfully');
      return sanitized;
    } catch (parseError: any) {
      console.error('Failed to parse JSON response from Gemini Vision API:', rawText, parseError);
      throw new Error('Receipt scanner unavailable');
    }
  }

  /**
   * Ensures all fields strictly adhere to the required numerical and structural schema
   */
  private validateAndSanitizeData(data: any): ExtractedReceiptData {
    const merchant =
      typeof data?.merchant === 'string' && data.merchant.trim()
        ? data.merchant.trim()
        : typeof data?.merchantName === 'string' && data.merchantName.trim()
        ? data.merchantName.trim()
        : 'Receipt Purchase';

    // Date validation YYYY-MM-DD
    let purchaseDate = new Date().toISOString().split('T')[0];
    const rawDate = data?.date || data?.purchaseDate;
    if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      purchaseDate = rawDate;
    } else if (typeof rawDate === 'string' && !isNaN(new Date(rawDate).getTime())) {
      purchaseDate = new Date(rawDate).toISOString().split('T')[0];
    }

    const totalAmount = Number(data?.total ?? data?.totalAmount) || 0;
    const currency = data?.currency || 'INR';
    const time = typeof data?.time === 'string' ? data.time : undefined;
    const paymentMethod = typeof data?.paymentMethod === 'string' ? data.paymentMethod : undefined;
    const category = typeof data?.category === 'string' ? data.category : 'Groceries';
    const tax = Number(data?.tax) >= 0 ? Number(data?.tax) : 0;
    const subtotal = Number(data?.subtotal) >= 0 ? Number(data?.subtotal) : totalAmount;

    const items: ExtractedReceiptItem[] = [];
    if (Array.isArray(data?.items)) {
      for (const rawItem of data.items) {
        if (rawItem && typeof rawItem === 'object') {
          const name =
            typeof rawItem.name === 'string' && rawItem.name.trim()
              ? rawItem.name.trim()
              : 'Item';
          const itemCategory = typeof rawItem.category === 'string' ? rawItem.category : category;
          const quantity = Number(rawItem.quantity) > 0 ? Number(rawItem.quantity) : 1;
          const unit =
            typeof rawItem.unit === 'string' && rawItem.unit.trim()
              ? rawItem.unit.trim()
              : 'unit';
          const price = Number(rawItem.price) >= 0 ? Number(rawItem.price) : 0;

          items.push({
            name,
            category: itemCategory,
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
        category,
        quantity: 1,
        unit: 'unit',
        price: totalAmount,
      });
    }

    return {
      merchant,
      purchaseDate,
      date: purchaseDate,
      time,
      paymentMethod,
      category,
      totalAmount,
      total: totalAmount,
      tax,
      subtotal,
      currency,
      items,
    };
  }
}

export const receiptVisionService = new ReceiptVisionService();
