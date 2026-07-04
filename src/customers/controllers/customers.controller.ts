import { Controller, Get, Post, Body, Param, Patch, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto/create-customer.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async create(@Body() dto: CreateCustomerDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.create(dto, businessOwnerId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all customers for the authenticated business owner' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async findAll(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.findAll(businessOwnerId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.findOne(id, businessOwnerId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.update(id, dto, businessOwnerId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a customer' })
  @ApiResponse({ status: 200, description: 'Customer deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.remove(id, businessOwnerId);
  }
}
