import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto/create-customer.dto';

/**
 * Customers service handling CRUD operations for customer records.
 */
@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, businessOwnerId: string) {
    this.logger.log(`Creating customer for business owner: ${businessOwnerId}`);

    // Generate unique customer reference if not provided
    const customerReference = dto.customerReference || `CUST-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const customer = await this.prisma.customer.create({
      data: {
        businessOwnerId,
        fullName: dto.fullName,
        email: dto.email as string | null,
        phone: dto.phone as string | null,
        customerReference,
      },
    });

    return { success: true, data: customer };
  }

  async findAll(businessOwnerId: string) {
    const customers = await this.prisma.customer.findMany({
      where: {
        businessOwnerId: businessOwnerId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invoices: true,
        payments: true,
      },
    });

    return { success: true, data: customers };
  }

  async findOne(id: string, businessOwnerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { 
        id,
        businessOwnerId: businessOwnerId,
      },
      include: {
        invoices: {
          include: {
            virtualAccount: true,
            payments: true,
          },
        },
        payments: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return { success: true, data: customer };
  }

  async update(id: string, dto: UpdateCustomerDto, businessOwnerId: string) {
    const existing = await this.prisma.customer.findFirst({
      where: { 
        id,
        businessOwnerId: businessOwnerId,
      },
    });
    
    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const updateData: any = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phone !== undefined) updateData.phone = dto.phone as string | null;
    if (dto.status) updateData.status = dto.status;
    if (dto.customerReference) updateData.customerReference = dto.customerReference;

    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: customer };
  }

  async remove(id: string, businessOwnerId: string) {
    const existing = await this.prisma.customer.findFirst({
      where: { 
        id,
        businessOwnerId: businessOwnerId,
      },
    });
    
    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    await this.prisma.customer.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { success: true, message: 'Customer deactivated successfully' };
  }
}