import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminEventsService } from './admin-events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { RolesGuard } from 'src/libs/auth/roles.guard';
import { Roles } from 'src/libs/auth/roles.decorator';
import { UserRole } from 'src/libs/utils/constants/enum';

@ApiTags('Admin Events')
@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminEventsController {
  constructor(private readonly adminEventsService: AdminEventsService) {}

  @Get()
  @ApiOperation({ summary: 'List all events — admin (includes past events)' })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.adminEventsService.findAll({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID — admin' })
  async findOne(@Param('id') id: string) {
    const data = await this.adminEventsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event — admin' })
  async create(@Body() dto: CreateEventDto) {
    const data = await this.adminEventsService.create(dto);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an event — admin' })
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    const data = await this.adminEventsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event — admin' })
  async remove(@Param('id') id: string) {
    const data = await this.adminEventsService.remove(id);
    return { success: true, data };
  }
}
