import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary with key metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  async getSummary(@Req() req: any) {
    const businessOwnerId = req.user?.id;
    return this.dashboardService.getSummary(businessOwnerId);
  }
}
