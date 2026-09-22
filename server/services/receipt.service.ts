import { GoogleGenAI } from '@google/genai';

export interface ExtractedReceiptItem {
  name: string;
  price: number;
  pricePerUnit?: number;
  quantity?: number;
  amount?: number;
  totalPrice?: number;
  unit?: string;
  category?: string;
}

export interface ExtractedReceiptResult {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  purchaseDate: string;
  paymentMethod: string | null;
  invoiceNumber: string | null;
  gst: number | null;
  tax: number | null;
  taxAmount: number;
  category: string;
  title: string;
  currency: string;
  items: ExtractedReceiptItem[];
  lineItems: ExtractedReceiptItem[];
  confidences: Record<string, 'High' | 'Medium' | 'Low'>;
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
1. NEVER generate conversational responses, markdown explanations, or preamble text.
2. Return ONLY a single raw JSON object matching this EXACT schema:
{
  "merchant": "Merchant or Store Name",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "paymentMethod": "Credit Card | UPI | Cash | NetBanking | Debit Card",
  "invoiceNumber": "INV-12345",
  "gst": 0.00,
  "tax": 0.00,
  "category": "Groceries | Household | Dining | Utilities | Shopping | Healthcare | Transport | Entertainment | Other",
  "lineItems": [
    {
      "name": "Item Name",
      "quantity": 1,
      "pricePerUnit": 0.00,
      "amount": 0.00
    }
  ]
}
3. For lineItems, "amount" represents the TOTAL line item amount (quantity × pricePerUnit), NOT the unit price. "pricePerUnit" represents the unit price.
4. Missing values should be null. Never fabricate values. Format date as YYYY-MM-DD.`;

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
      : null;

  const title = merchant || 'Receipt Purchase';

  let date: string | null = null;
  const rawDate = data?.date || data?.purchaseDate;
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
    date = rawDate.trim();
  } else if (typeof rawDate === 'string' && !isNaN(new Date(rawDate).getTime())) {
    date = new Date(rawDate).toISOString().split('T')[0];
  }

  const purchaseDate = date || new Date().toISOString().split('T')[0];

  const rawAmount = data?.amount ?? data?.total ?? data?.totalAmount;
  const amount =
    typeof rawAmount === 'number' && !isNaN(rawAmount)
      ? rawAmount
      : rawAmount && !isNaN(Number(rawAmount))
      ? Number(rawAmount)
      : null;

  const rawGst = data?.gst ?? data?.taxAmount ?? data?.tax;
  const gst =
    typeof rawGst === 'number' && !isNaN(rawGst)
      ? rawGst
      : rawGst && !isNaN(Number(rawGst))
      ? Number(rawGst)
      : null;

  const rawTax = data?.tax ?? data?.taxAmount ?? data?.gst;
  const tax =
    typeof rawTax === 'number' && !isNaN(rawTax)
      ? rawTax
      : rawTax && !isNaN(Number(rawTax))
      ? Number(rawTax)
      : null;

  const taxAmount = tax ?? gst ?? 0;

  const currency =
    typeof data?.currency === 'string' && data.currency.trim()
      ? data.currency.trim()
      : 'INR';
  const invoiceNumber =
    typeof data?.invoiceNumber === 'string' && data.invoiceNumber.trim()
      ? data.invoiceNumber.trim()
      : null;
  const paymentMethod =
    typeof data?.paymentMethod === 'string' && data.paymentMethod.trim()
      ? data.paymentMethod.trim()
      : null;

  const category =
    typeof data?.category === 'string' && data.category.trim()
      ? data.category.trim()
      : 'Groceries';

  const lineItems: ExtractedReceiptItem[] = [];
  const rawItems = Array.isArray(data?.lineItems)
    ? data.lineItems
    : Array.isArray(data?.items)
    ? data.items
    : [];

  if (Array.isArray(rawItems)) {
    for (const rawItem of rawItems) {
      if (rawItem && typeof rawItem === 'object') {
        const name =
          typeof rawItem.name === 'string' && rawItem.name.trim()
            ? rawItem.name.trim()
            : 'Item';
        const quantity = Number(rawItem.quantity) > 0 ? Number(rawItem.quantity) : 1;
        const unit = typeof rawItem.unit === 'string' ? rawItem.unit : 'unit';

        let pricePerUnit = Number(rawItem.pricePerUnit ?? rawItem.unitPrice);
        if (isNaN(pricePerUnit) || pricePerUnit < 0) {
          pricePerUnit = 0;
        }

        let lineAmount = Number(rawItem.amount ?? rawItem.totalPrice ?? rawItem.price ?? rawItem.total);
        if (isNaN(lineAmount) || lineAmount < 0) {
          lineAmount = 0;
        }

        // Calculation rules:
        // 1. If lineAmount is missing (0) but pricePerUnit is >0, calculate lineAmount = quantity * pricePerUnit.
        // 2. If pricePerUnit is missing (0) but lineAmount is >0, calculate pricePerUnit = lineAmount / quantity.
        // 3. If lineAmount === pricePerUnit and quantity > 1 (e.g. price field passed unit price), calculate lineAmount = quantity * pricePerUnit.
        if (lineAmount === 0 && pricePerUnit > 0) {
          lineAmount = Math.round(quantity * pricePerUnit * 100) / 100;
        } else if (lineAmount > 0 && pricePerUnit === 0) {
          pricePerUnit = Math.round((lineAmount / quantity) * 100) / 100;
        } else if (lineAmount > 0 && pricePerUnit > 0 && lineAmount === pricePerUnit && quantity > 1) {
          lineAmount = Math.round(quantity * pricePerUnit * 100) / 100;
        }

        const price = lineAmount;

        lineItems.push({
          name,
          price, // TOTAL line amount (used by UI for totalPrice)
          pricePerUnit, // Unit price
          quantity,
          amount: lineAmount,
          totalPrice: lineAmount,
          unit,
        });
      }
    }
  }

  if (lineItems.length === 0 && amount !== null) {
    lineItems.push({
      name: title,
      price: amount,
      pricePerUnit: amount,
      quantity: 1,
      amount,
      totalPrice: amount,
    });
  }

  const items = lineItems;

  const confidences: Record<string, 'High' | 'Medium' | 'Low'> = {
    merchant: merchant !== null ? 'High' : 'Low',
    amount: amount !== null ? 'High' : 'Low',
    purchaseDate: date !== null ? 'High' : 'Low',
    category: category ? 'High' : 'Medium',
    taxAmount: tax !== null || gst !== null ? 'High' : 'Low',
    invoiceNumber: invoiceNumber !== null ? 'High' : 'Low',
    paymentMethod: paymentMethod !== null ? 'High' : 'Medium',
  };

  return {
    merchant,
    amount,
    date,
    purchaseDate,
    paymentMethod,
    invoiceNumber,
    gst,
    tax,
    taxAmount,
    category,
    title,
    currency,
    items,
    lineItems,
    confidences,
  };
}

export const GEMINI_VISION_MODEL =
  process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash';

/**
 * Extracts receipt data from image using configured Gemini Vision model
 */
export async function extractReceipt(
  imageInput: string | { base64Data: string; mimeType?: string }
): Promise<ExtractedReceiptResult> {
  console.log(`Using Gemini Vision model: ${GEMINI_VISION_MODEL}`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('OCR unavailable');
    throw new Error('RECEIPT_AI_UNAVAILABLE');
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

  if (!base64Data || base64Data.trim().length === 0) {
    console.log('OCR unavailable');
    throw new Error('INVALID_RECEIPT_IMAGE');
  }

  let rawText: string | null = null;
  let errorType: 'TIMEOUT' | 'UNAVAILABLE' | 'INVALID' | null = null;

  try {
    const ai = getAiClient();
    const sdkPromise = ai.models.generateContent({
      model: GEMINI_VISION_MODEL,
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

    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('RECEIPT_AI_TIMEOUT')), 20000);
    });

    const response = await Promise.race([sdkPromise, timeoutPromise]);
    clearTimeout(timeoutId!);
    rawText = response.text || null;
  } catch (sdkError: any) {
    if (sdkError?.message === 'RECEIPT_AI_TIMEOUT') {
      errorType = 'TIMEOUT';
    } else {
      errorType = 'UNAVAILABLE';
    }
  }

  // Fallback: REST call if SDK fails (unless timeout occurred)
  if (!rawText && errorType !== 'TIMEOUT') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${apiKey}`;
      const requestPayload = {
        contents: [
          {
            parts: [
              { text: RECEIPT_SYSTEM_INSTRUCTION },
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (restRes.ok) {
        const restData: any = await restRes.json();
        rawText = restData?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } else {
        errorType = 'UNAVAILABLE';
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        errorType = 'TIMEOUT';
      } else {
        errorType = 'UNAVAILABLE';
      }
    }
  }

  if (errorType === 'TIMEOUT') {
    console.log('OCR timeout');
    throw new Error('RECEIPT_AI_TIMEOUT');
  }

  if (!rawText) {
    console.log('OCR unavailable');
    throw new Error('RECEIPT_AI_UNAVAILABLE');
  }

  try {
    const cleanedJsonText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJsonText);
    const result = normalizeExpense(parsed);
    console.log('OCR completed successfully');
    return result;
  } catch (parseErr) {
    console.log('OCR unavailable');
    throw new Error('RECEIPT_AI_UNAVAILABLE');
  }
}
