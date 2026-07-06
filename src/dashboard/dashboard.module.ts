import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { GeminiAiService } from './services/gemini-ai.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, GeminiAiService],
  exports: [DashboardService],
})
export class DashboardModule {}
