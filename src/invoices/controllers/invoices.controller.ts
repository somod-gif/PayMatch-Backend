import { Controller, Get, Post, Body, Param, Patch, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from '../services/invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../dto/create-invoice.dto';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.invoicesService.create(dto, businessOwnerId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all invoices for the authenticated business owner' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async findAll(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.invoicesService.findAll(businessOwnerId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.invoicesService.findOne(id, businessOwnerId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.invoicesService.update(id, dto, businessOwnerId);
  }
}
