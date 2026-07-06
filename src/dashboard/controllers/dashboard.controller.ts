import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard summary with key metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async getSummary(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.dashboardService.getSummary(businessOwnerId);
  }

  @Get('ai-insights')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get AI-powered business insights',
    description: 'Analyzes business data using Gemini AI to provide actionable insights including outstanding invoices, late payment trends, payment summary, and recommended actions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI insights generated successfully',
    schema: {
      example: {
        success: true,
        data: {
          outstandingInvoices: {
            count: 5,
            totalAmount: 150000,
            currency: 'NGN',
            topDebtors: [
              {
                customerName: 'John Doe',
                invoiceCount: 2,
                totalAmount: 75000
              }
            ]
          },
          latePaymentTrends: {
            averageDaysOverdue: 7,
            trend: 'worsening',
            overdueInvoicesCount: 3,
            totalOverdueAmount: 45000
          },
          paymentSummary: {
            totalRevenue: 500000,
            totalPayments: 25,
            averagePaymentAmount: 20000,
            paymentMethods: {
              transfer: 20,
              ussd: 5
            },
            recentPayments: []
          },
          recommendedActions: [
            'Follow up on pending invoices',
            'Send payment reminders to overdue customers'
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async getAiInsights(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.dashboardService.getAiInsights(businessOwnerId);
  }
}
