import { GoogleGenAI } from '@google/genai';
import { Expense, RecurringExpense, CategoryItem, DateRange } from '../../src/types.js';
import {
  calculateCategoryTotals,
  filterExpensesByDateRange,
  generateItemAnalytics,
  comparePeriods,
  formatCurrency,
} from '../../src/utils/calculations.js';
import { getPreviousPeriod } from '../../src/utils/dateRanges.js';

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

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AnalyzeSpendingParams {
  message: string;
  history?: ChatMessage[];
  expenses: Expense[];
  recurringExpenses?: RecurringExpense[];
  categories?: CategoryItem[];
  dateRange?: DateRange;
  currentDate?: string;
  userEmail?: string;
}

export class GeminiAssistantService {
  /**
   * Prepares a highly structured, accurate summary of the user's spending data
   */
  private buildDataContext(params: AnalyzeSpendingParams): string {
    const {
      expenses = [],
      recurringExpenses = [],
      categories = [],
      dateRange,
      currentDate = new Date().toISOString().split('T')[0],
    } = params;

    // 1. Context Period
    const activeStartDate = dateRange?.startDate || currentDate.slice(0, 7) + '-01';
    const activeEndDate = dateRange?.endDate || currentDate;
    const activeLabel = dateRange?.label || 'Current Active Period';

    // 2. Filter expenses for active range
    const periodExpenses = filterExpensesByDateRange(expenses, activeStartDate, activeEndDate);
    const totalPeriodSpend = periodExpenses.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0);
    const periodCategoryTotals = calculateCategoryTotals(periodExpenses);

    // 3. Period comparison
    const previousRange = getPreviousPeriod({ startDate: activeStartDate, endDate: activeEndDate });
    const periodComparison = comparePeriods(
      expenses,
      { startDate: activeStartDate, endDate: activeEndDate },
      previousRange
    );

    // 4. Item analytics (all-time & item history)
    const itemSummaries = generateItemAnalytics(expenses);

    // 5. Build JSON data context
    const dataContext = {
      meta: {
        currentDate,
        activePeriod: {
          label: activeLabel,
          startDate: activeStartDate,
          endDate: activeEndDate,
          totalSpending: totalPeriodSpend,
          expenseCount: periodExpenses.length,
        },
        previousPeriod: {
          startDate: previousRange.startDate,
          endDate: previousRange.endDate,
          totalSpending: periodComparison.previousPeriod.totalSpending,
          expenseCount: periodComparison.previousPeriod.expenseCount,
        },
        comparison: {
          difference: periodComparison.difference,
          percentageChange: periodComparison.percentageChange,
          categoryChanges: periodComparison.categoryChanges,
          itemPriceChanges: periodComparison.itemPriceChanges,
        },
      },
      categoryBreakdownForActivePeriod: periodCategoryTotals.map((c) => ({
        category: c.category,
        totalAmount: c.totalAmount,
        percentageOfTotal: `${c.percentage}%`,
        count: c.count,
      })),
      recentExpensesInActivePeriod: periodExpenses.slice(0, 25).map((e) => ({
        id: e.id,
        itemName: e.itemName,
        category: e.category,
        subcategory: e.subcategory,
        totalPrice: e.totalPrice,
        quantity: e.quantity,
        unit: e.unit,
        pricePerUnit: e.pricePerUnit,
        purchaseDate: e.purchaseDate,
        usageStartDate: e.usageStartDate,
        usageEndDate: e.usageEndDate,
        durationDays: e.durationDays,
        dailyCost: e.dailyCost,
        dailyQuantity: e.dailyQuantity,
        notes: e.notes,
      })),
      allTimeItemIntelligence: itemSummaries.map((it) => ({
        itemName: it.itemName,
        category: it.category,
        unit: it.unit,
        totalSpent: it.totalSpent,
        totalQuantity: it.totalQuantity,
        purchaseCount: it.purchaseCount,
        averagePrice: it.averagePrice,
        averagePricePerUnit: it.averagePricePerUnit,
        averageDurationDays: it.averageDurationDays,
        averageDailyCost: it.averageDailyCost,
        latestPrice: it.latestPrice,
        previousPrice: it.previousPrice,
        priceChange: it.priceChange,
        percentagePriceChange: it.percentagePriceChange ? `${it.percentagePriceChange}%` : undefined,
        purchaseHistory: it.history.map((h) => ({
          purchaseDate: h.purchaseDate,
          totalPrice: h.totalPrice,
          quantity: h.quantity,
          unit: h.unit,
          durationDays: h.durationDays,
          dailyCost: h.dailyCost,
          pricePerUnit: h.pricePerUnit,
        })),
      })),
      recurringExpenses: recurringExpenses.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        amount: r.amount,
        frequency: r.frequency,
        dueDay: r.dueDay,
        dueDate: r.dueDate,
        calendarReminderEnabled: r.calendarReminderEnabled,
        notes: r.notes,
      })),
      totalExpensesCountInDatabase: expenses.length,
    };

    return JSON.stringify(dataContext, null, 2);
  }

  /**
   * System instruction enforcing strict truthfulness, Indian currency formatting, and consumption domain logic
   */
  private getSystemInstruction(): string {
    return `You are "SpendTrack AI", an intelligent and friendly personal finance and household consumption assistant for the SpendTrack application.

YOUR PURPOSE:
Help the user clearly understand their spending, categories, items, consumption duration, prices, price changes, cost per day, spending velocity, period comparisons, recurring expenses, and household consumption patterns.

CRITICAL TRUTHFULNESS & ACCURACY DIRECTIVES:
1. ONLY USE REAL DATA: You have been provided the user's authentic SpendTrack database in structured JSON. Every calculation, price, date, and figure you cite MUST strictly originate from this data.
2. NO HALLUCINATIONS: Never fabricate expenses, purchases, prices, or consumption records. If the user asks about an item or period with zero or insufficient historical records (e.g. asking for price inflation on an item bought only once), clearly state that there is not enough historical data yet.
3. CURRENCY FORMATTING: Format all Indian rupee amounts with the '₹' symbol and appropriate commas (e.g., ₹1,200, ₹14,500, ₹1,25,000).
4. EXPLAIN CALCULATIONS: When answering consumption or cost questions, concisely show the formula so the user understands where the numbers came from:
   - Price per unit: Total Price ÷ Quantity (e.g. ₹650 ÷ 10 kg = ₹65/kg)
   - Daily Cost: Total Price ÷ Duration in days (e.g. ₹1,200 ÷ 32 days = ₹37.50/day)
   - Daily Velocity: Quantity ÷ Duration in days (e.g. 10 kg ÷ 24 days = 0.417 kg/day)
   - Monthly Estimate: Daily Cost × 30.4 days
5. UNDERSTAND CONSUMPTION VS EXPENSE TEMPLATES:
   - Distinguish between a recurring bill template and actual purchase records.
   - Understand usage start date, end date, and duration days for items like LPG Cooking Gas, Groceries (Rice, Oil, Milk), WiFi, etc.
6. PERIOD COMPARISON:
   - Use the provided comparison data to explain category increases/decreases, overall percentage changes, and top driving items.
7. TONE & FORMAT:
   - Conversational, clear, helpful, and concise.
   - Use markdown bullet points, bold key figures, and small clean summaries.
   - Keep answers focused and avoid unnecessarily verbose prose or sales hype.
8. READ-ONLY SCOPE:
   - You are an analytical assistant. You do not directly modify, delete, or create records unless reporting analytics to the user.`;
  }

  /**
   * Process a chat query with multi-turn history and full SpendTrack context
   */
  public async chat(params: AnalyzeSpendingParams): Promise<string> {
    const ai = getAiClient();
    const dataContextJson = this.buildDataContext(params);
    const systemInstruction = this.getSystemInstruction();

    // Construct conversation contents with system data grounding
    const contents: any[] = [];

    // First, ground the model with the user's live data
    const contextPrompt = `Here is the user's current SpendTrack data context:\n\`\`\`json\n${dataContextJson}\n\`\`\`\nPlease answer the user's questions based strictly on this data.`;

    contents.push({
      role: 'user',
      parts: [{ text: contextPrompt }],
    });

    contents.push({
      role: 'model',
      parts: [
        {
          text: "Understood. I have loaded your current SpendTrack data and consumption records. I am ready to answer any questions about your expenses, categories, item price trends, daily burn rates, and period comparisons with complete mathematical accuracy.",
        },
      ],
    });

    // Add conversation history if present
    if (params.history && params.history.length > 0) {
      for (const msg of params.history) {
        // Map roles to 'user' and 'model'
        const role = msg.role === 'user' ? 'user' : 'model';
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current user query
    contents.push({
      role: 'user',
      parts: [{ text: params.message }],
    });

    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.6-flash-lite'];
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.2, // Low temperature for high numerical precision
            },
          });

          const responseText = response.text;
          if (!responseText) {
            throw new Error('No response text received from Gemini.');
          }

          return responseText;
        } catch (error: any) {
          lastError = error;
          const status = error?.status || error?.statusCode;
          const msg = String(error?.message || '');
          const is503 = status === 503 || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
          const is404 = status === 404 || msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('no longer available');

          console.warn(`Gemini API model ${modelName} attempt ${attempt} warning:`, msg);

          if (is503 && attempt === 1) {
            console.log('SpendTrack AI is temporarily busy due to high demand. Retrying automatically...');
            await delay(800);
            continue;
          }

          if (is404) {
            console.warn('The configured Gemini model is unavailable. Falling back to the latest supported model.');
            break;
          }

          break;
        }
      }
    }

    const lastMsg = String(lastError?.message || '');
    const lastStatus = lastError?.status || lastError?.statusCode;

    if (lastStatus === 503 || lastMsg.includes('503') || lastMsg.includes('UNAVAILABLE')) {
      throw new Error('SpendTrack AI is temporarily busy due to high demand. Retrying automatically...');
    } else if (lastStatus === 404 || lastMsg.includes('404') || lastMsg.includes('NOT_FOUND')) {
      throw new Error('The configured Gemini model is unavailable. Falling back to the latest supported model.');
    } else {
      throw new Error('SpendTrack AI service is temporarily unavailable.');
    }
  }
}

export const geminiAssistantService = new GeminiAssistantService();
