import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(businessOwnerId: string) {
    this.logger.log(`Fetching dashboard summary for business owner: ${businessOwnerId}`);

    const [
      totalCustomers,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      partialPayments,
      totalRevenue,
      recentPayments,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { businessOwnerId, status: 'active' } }),
      this.prisma.invoice.count({ where: { businessOwnerId: businessOwnerId } }),
      this.prisma.invoice.count({ where: { businessOwnerId: businessOwnerId, status: 'paid' } }),
      this.prisma.invoice.count({ where: { businessOwnerId: businessOwnerId, status: 'pending' } }),
      this.prisma.invoice.count({ where: { businessOwnerId: businessOwnerId, status: 'partial' } }),
      this.prisma.payment.aggregate({
        where: { 
          invoice: { businessOwnerId: businessOwnerId },
          status: 'success'
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: { invoice: { businessOwnerId: businessOwnerId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { 
          invoice: { 
            include: { 
              customer: true 
            } 
          },
          customer: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        metrics: {
          totalCustomers,
          totalInvoices,
          paidInvoices,
          pendingInvoices,
          partialPayments,
          totalRevenue: totalRevenue._sum?.amount || 0,
        },
        recentPayments,
        timestamp: new Date().toISOString(),
      },
    };
  }
}