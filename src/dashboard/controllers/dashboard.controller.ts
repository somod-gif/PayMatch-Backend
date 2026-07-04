import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard summary with key metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Business owner not authenticated' })
  async getSummary(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.dashboardService.getSummary(businessOwnerId);
  }
}
