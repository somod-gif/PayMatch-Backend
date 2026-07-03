import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto, QueryPaymentDto } from '../dto/create-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  async create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.create(dto, businessOwnerId);
  }

  @Get()
  @ApiOperation({ summary: 'List all payments or filter by query' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async findAll(@Req() req: any, @Query() query?: QueryPaymentDto) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.findAll(query, businessOwnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.findOne(id, businessOwnerId);
  }

  @Get('reference/:reference')
  @ApiOperation({ summary: 'Get a payment by reference' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findByReference(@Param('reference') reference: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.findByReference(reference, businessOwnerId);
  }
}