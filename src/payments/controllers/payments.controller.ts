import { Controller, Get, Post, Body, Param, Query, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiNotFoundResponse, ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { EmailService } from '../services/email.service';
import { CreatePaymentDto, QueryPaymentDto } from '../dto/create-payment.dto';
import { PaymentLinkResponseDto, PaymentShareResponseDto, SendEmailDto, EmailResponseDto } from '../dto/payment-share.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a new payment' })
  @ApiCreatedResponse({ description: 'Payment recorded successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.create(dto, businessOwnerId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payments for the authenticated business owner' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async findAll(@Req() req: any, @Query() query?: QueryPaymentDto) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.findAll(query, businessOwnerId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.findOne(id, businessOwnerId);
  }

  @Get('reference/:reference')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a payment by reference' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async findByReference(@Param('reference') reference: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.findByReference(reference, businessOwnerId);
  }

  @Get('link/:invoiceNumber')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get payment link for an invoice',
    description: 'Returns a shareable payment link for the specified invoice'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment link retrieved successfully',
    type: PaymentLinkResponseDto
  })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  @ApiParam({ name: 'invoiceNumber', description: 'Invoice number', example: 'INV-001' })
  async getPaymentLink(@Param('invoiceNumber') invoiceNumber: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.getPaymentLink(invoiceNumber, businessOwnerId);
  }

  @Get('share/:invoiceNumber')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get payment share information',
    description: 'Returns all information needed to share payment details via WhatsApp, Email, or Copy'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment share information retrieved successfully',
    type: PaymentShareResponseDto
  })
  @ApiNotFoundResponse({ description: 'Invoice not found or no virtual account' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  @ApiParam({ name: 'invoiceNumber', description: 'Invoice number', example: 'INV-001' })
  async getShareInfo(@Param('invoiceNumber') invoiceNumber: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.paymentsService.getShareInfo(invoiceNumber, businessOwnerId);
  }

  @Post('send-email/:invoiceNumber')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Send invoice email to customer',
    description: 'Sends an email with payment details to the customer'
  })
  @ApiCreatedResponse({ 
    description: 'Email sent successfully',
    type: EmailResponseDto
  })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  @ApiParam({ name: 'invoiceNumber', description: 'Invoice number', example: 'INV-001' })
  async sendEmail(
    @Param('invoiceNumber') invoiceNumber: string,
    @Body() dto: SendEmailDto,
    @Req() req: any,
  ) {
    const businessOwnerId = req.user?.id;
    const result = await this.paymentsService.sendInvoiceEmail(
      invoiceNumber,
      dto.email,
      businessOwnerId,
      this.emailService,
    );

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }
}