import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { VerifyTicketDto } from './dto/verify-ticket.dto';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { RolesGuard } from 'src/libs/auth/roles.guard';
import { Roles } from 'src/libs/auth/roles.decorator';
import { CurrentUser } from 'src/libs/auth/current-user.decorator';
import { UserRole } from 'src/libs/utils/constants/enum';
import type { UserDocument } from 'src/models/user.schema';
import { multerOptions } from 'src/libs/utils/file-upload.util';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ── POST /tickets/verify must come before /:id routes ──

  @Post('verify')
  @Roles(UserRole.SECURITY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a QR code (security)' })
  async verify(@Body() dto: VerifyTicketDto) {
    const data = await this.ticketsService.verify(dto);
    return { success: true, data };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECURITY)
  @ApiOperation({ summary: 'List all tickets' })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.ticketsService.findAll({
      search,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECURITY)
  @ApiOperation({ summary: 'Get a single ticket by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.ticketsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('photo', multerOptions))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a ticket (admin)' })
  async create(
    @Body() dto: CreateTicketDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    if (!photo) {
      throw new BadRequestException('A visitor identity photo is required.');
    }
    const data = await this.ticketsService.create(dto, photo);
    return { success: true, data };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a ticket (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    const data = await this.ticketsService.update(id, dto);
    return { success: true, data };
  }

  @Post(':id/approve')
  @Roles(UserRole.SECURITY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve entry for a ticket (security)' })
  async approve(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    const data = await this.ticketsService.approve(id, user);
    return { success: true, data };
  }

  @Post(':id/reject')
  @Roles(UserRole.SECURITY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject entry for a ticket (security)' })
  async reject(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    const data = await this.ticketsService.reject(id, user);
    return { success: true, data };
  }
}
