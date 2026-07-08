import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCreatedResponse } from '@nestjs/swagger';
import { VirtualAccountsService } from '../services/virtual-accounts.service';
import { CreateVirtualAccountDto } from '../dto/create-virtual-account.dto';

@ApiTags('Virtual Accounts')
@Controller('virtual-accounts')
export class VirtualAccountsController {
  constructor(private readonly virtualAccountsService: VirtualAccountsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a virtual account for an invoice' })
  @ApiCreatedResponse({
    description: 'Virtual account generated successfully.',
    schema: {
      example: {
        success: true,
        message: 'Virtual account generated successfully.',
        data: {
          bankName: 'Wema Bank',
          accountNumber: '1234567890',
          accountName: 'John Doe',
          amount: 5000,
          accountRef: 'INV-001-1720000000000',
          currency: 'NGN',
          paymentStatus: 'PENDING',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async create(@Body() dto: CreateVirtualAccountDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.virtualAccountsService.create(dto, businessOwnerId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all virtual accounts for the authenticated business owner' })
  @ApiResponse({ status: 200, description: 'Virtual accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async findAll(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.virtualAccountsService.findAll(businessOwnerId);
  }
}
