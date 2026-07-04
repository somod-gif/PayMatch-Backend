import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VirtualAccountsService } from '../services/virtual-accounts.service';
import { CreateVirtualAccountDto } from '../dto/create-virtual-account.dto';

@ApiTags('Virtual Accounts')
@Controller('virtual-accounts')
export class VirtualAccountsController {
  constructor(private readonly virtualAccountsService: VirtualAccountsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a virtual account for an invoice' })
  @ApiResponse({ status: 201, description: 'Virtual account created successfully' })
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
