import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface BusinessInsights {
  outstandingInvoices: {
    count: number;
    totalAmount: number;
    currency: string;
    topDebtors: Array<{
      customerName: string;
      invoiceCount: number;
      totalAmount: number;
    }>;
  };
  latePaymentTrends: {
    averageDaysOverdue: number;
    trend: 'improving' | 'stable' | 'worsening';
    overdueInvoicesCount: number;
    totalOverdueAmount: number;
  };
  paymentSummary: {
    totalRevenue: number;
    totalPayments: number;
    averagePaymentAmount: number;
    paymentMethods: Record<string, number>;
    recentPayments: Array<{
      date: string;
      amount: number;
      customerName: string;
      invoiceNumber: string;
    }>;
  };
  recommendedActions: string[];
}

@Injectable()
export class GeminiAiService {
  private readonly logger = new Logger(GeminiAiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('geminiApiKey');
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.logger.log('Gemini AI initialized successfully');
      } catch (error) {
        this.logger.warn(`Failed to initialize Gemini AI: ${(error as Error).message}`);
      }
    } else {
      this.logger.warn('Gemini API key not configured');
    }
  }

  async generateBusinessInsights(data: {
    totalCustomers: number;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    partialPayments: number;
    totalRevenue: number;
    recentPayments: any[];
    invoices: any[];
    payments: any[];
  }): Promise<BusinessInsights> {
    if (!this.model) {
      this.logger.warn('Gemini AI not configured - returning basic insights');
      return this.getBasicInsights(data);
    }

    try {
      const prompt = this.buildPrompt(data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.logger.log('Gemini AI insights generated successfully');
      return this.parseAIResponse(text, data);
    } catch (error) {
      this.logger.error(`Failed to generate AI insights: ${(error as Error).message}`);
      return this.getBasicInsights(data);
    }
  }

  private buildPrompt(data: any): string {
    return `You are a financial analyst for PayMatch, a payment reconciliation platform. Analyze the following business data and provide actionable insights in JSON format.

Business Data:
- Total Customers: ${data.totalCustomers}
- Total Invoices: ${data.totalInvoices}
- Paid Invoices: ${data.paidInvoices}
- Pending Invoices: ${data.pendingInvoices}
- Partial Payments: ${data.partialPayments}
- Total Revenue: ${data.totalRevenue} NGN
- Recent Payments: ${JSON.stringify(data.recentPayments?.slice(0, 5) || [])}
- Total Invoices Count: ${data.invoices?.length || 0}

Provide insights in the following JSON structure:
{
  "outstandingInvoices": {
    "count": <number of unpaid/partial invoices>,
    "totalAmount": <total amount in NGN>,
    "currency": "NGN",
    "topDebtors": [{"customerName": "<name>", "invoiceCount": <count>, "totalAmount": <amount>}]
  },
  "latePaymentTrends": {
    "averageDaysOverdue": <average days>,
    "trend": "<improving|stable|worsening>",
    "overdueInvoicesCount": <count>,
    "totalOverdueAmount": <amount>
  },
  "paymentSummary": {
    "totalRevenue": <total>,
    "totalPayments": <count>,
    "averagePaymentAmount": <average>,
    "paymentMethods": {"transfer": <count>, "ussd": <count>, "card": <count>},
    "recentPayments": [{"date": "<date>", "amount": <amount>, "customerName": "<name>", "invoiceNumber": "<number>"}]
  },
  "recommendedActions": ["<action 1>", "<action 2>", "<action 3>"]
}

Return ONLY valid JSON, no markdown or explanations.`;
  }

  private parseAIResponse(text: string, fallbackData: any): BusinessInsights {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        outstandingInvoices: {
          count: parsed.outstandingInvoices?.count || fallbackData.pendingInvoices + fallbackData.partialPayments,
          totalAmount: parsed.outstandingInvoices?.totalAmount || 0,
          currency: 'NGN',
          topDebtors: parsed.outstandingInvoices?.topDebtors || [],
        },
        latePaymentTrends: {
          averageDaysOverdue: parsed.latePaymentTrends?.averageDaysOverdue || 0,
          trend: parsed.latePaymentTrends?.trend || 'stable',
          overdueInvoicesCount: parsed.latePaymentTrends?.overdueInvoicesCount || 0,
          totalOverdueAmount: parsed.latePaymentTrends?.totalOverdueAmount || 0,
        },
        paymentSummary: {
          totalRevenue: parsed.paymentSummary?.totalRevenue || fallbackData.totalRevenue,
          totalPayments: parsed.paymentSummary?.totalPayments || fallbackData.recentPayments?.length || 0,
          averagePaymentAmount: parsed.paymentSummary?.averagePaymentAmount || 0,
          paymentMethods: parsed.paymentSummary?.paymentMethods || {},
          recentPayments: parsed.paymentSummary?.recentPayments || fallbackData.recentPayments?.slice(0, 5) || [],
        },
        recommendedActions: parsed.recommendedActions || [
          'Follow up on pending invoices',
          'Review payment collection processes',
          'Send payment reminders to customers with overdue invoices',
        ],
      };
    } catch (error) {
      this.logger.warn(`Failed to parse AI response: ${(error as Error).message}`);
      return this.getBasicInsights(fallbackData);
    }
  }

  private getBasicInsights(data: any): BusinessInsights {
    const outstandingCount = (data.pendingInvoices || 0) + (data.partialPayments || 0);
    const recentPayments = data.recentPayments || [];

    return {
      outstandingInvoices: {
        count: outstandingCount,
        totalAmount: 0,
        currency: 'NGN',
        topDebtors: [],
      },
      latePaymentTrends: {
        averageDaysOverdue: 0,
        trend: 'stable',
        overdueInvoicesCount: 0,
        totalOverdueAmount: 0,
      },
      paymentSummary: {
        totalRevenue: data.totalRevenue || 0,
        totalPayments: recentPayments.length,
        averagePaymentAmount: recentPayments.length > 0 
          ? recentPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) / recentPayments.length 
          : 0,
        paymentMethods: {},
        recentPayments: recentPayments.slice(0, 5).map((p: any) => ({
          date: p.createdAt || new Date().toISOString(),
          amount: parseFloat(p.amount) || 0,
          customerName: p.customer?.fullName || 'Unknown',
          invoiceNumber: p.invoice?.invoiceNumber || 'N/A',
        })),
      },
      recommendedActions: [
        'Follow up on pending invoices',
        'Review payment collection processes',
        'Send payment reminders to customers with overdue invoices',
        'Consider offering early payment discounts',
        'Analyze customer payment patterns',
      ],
    };
  }
}