import { Controller, Get, Post, Body, Param, Patch, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvoicesService } from '../services/invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../dto/create-invoice.dto';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  async create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.invoicesService.create(dto, businessOwnerId);
  }

  @Get()
  @ApiOperation({ summary: 'List all invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async findAll(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.invoicesService.findAll(businessOwnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.invoicesService.findOne(id, businessOwnerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.invoicesService.update(id, dto, businessOwnerId);
  }
}
