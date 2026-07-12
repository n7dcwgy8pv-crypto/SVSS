import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { RolesGuard } from 'src/libs/auth/roles.guard';
import { Roles } from 'src/libs/auth/roles.decorator';
import { UserRole } from 'src/libs/utils/constants/enum';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SECURITY)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard aggregate stats' })
  async getStats() {
    const data = await this.dashboardService.getStats();
    return { success: true, data };
  }

  @Get('scans')
  @ApiOperation({ summary: 'Get recent scan log entries' })
  async getScans(@Query('limit') limit?: number) {
    const data = await this.dashboardService.getRecentScans(
      limit ? Number(limit) : 10,
    );
    return { success: true, data };
  }
}
