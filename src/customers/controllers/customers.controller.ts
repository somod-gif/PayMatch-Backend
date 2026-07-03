import { Controller, Get, Post, Body, Param, Patch, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto/create-customer.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async create(@Body() dto: CreateCustomerDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.create(dto, businessOwnerId);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.findAll(businessOwnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.findOne(id, businessOwnerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.update(id, dto, businessOwnerId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a customer' })
  @ApiResponse({ status: 200, description: 'Customer deactivated successfully' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.customersService.remove(id, businessOwnerId);
  }
}
