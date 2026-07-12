import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { RolesGuard } from 'src/libs/auth/roles.guard';
import { Roles } from 'src/libs/auth/roles.decorator';
import { UserRole } from 'src/libs/utils/constants/enum';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Ticket report (admin)' })
  async ticketsReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: string,
    @Query('event') event?: string,
    @Query('zone') zone?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const data = await this.reportsService.ticketsReport({
      dateFrom,
      dateTo,
      status,
      event,
      zone,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
    return { success: true, data };
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Incident report (admin)' })
  async incidentsReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.reportsService.incidentsReport({
      dateFrom,
      dateTo,
      type,
      status,
    });
    return { success: true, data };
  }

  @Get('entries')
  @ApiOperation({ summary: 'Entry/scan log report (admin)' })
  async entriesReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('result') result?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const data = await this.reportsService.entriesReport({
      dateFrom,
      dateTo,
      result,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
    return { success: true, data };
  }
}
