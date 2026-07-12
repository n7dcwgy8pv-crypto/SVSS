import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { RolesGuard } from 'src/libs/auth/roles.guard';
import { Roles } from 'src/libs/auth/roles.decorator';
import { CurrentUser } from 'src/libs/auth/current-user.decorator';
import { UserRole } from 'src/libs/utils/constants/enum';
import type { UserDocument } from 'src/models/user.schema';

@ApiTags('Incidents')
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECURITY)
  @ApiOperation({ summary: 'List all incidents' })
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.incidentsService.findAll({
      type,
      status,
      search,
      dateFrom,
      dateTo,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECURITY)
  @ApiOperation({ summary: 'Get a single incident' })
  async findOne(@Param('id') id: string) {
    const data = await this.incidentsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.SECURITY)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report an incident (security)' })
  async create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.incidentsService.create(dto, user);
    return { success: true, data };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update incident status (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    const data = await this.incidentsService.updateStatus(id, dto);
    return { success: true, data };
  }
}
