import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { CustomerTicketsService } from './customer-tickets.service';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { RolesGuard } from 'src/libs/auth/roles.guard';
import { Roles } from 'src/libs/auth/roles.decorator';
import { CurrentUser } from 'src/libs/auth/current-user.decorator';
import { UserRole } from 'src/libs/utils/constants/enum';
import type { UserDocument } from 'src/models/user.schema';
import { multerOptions } from 'src/libs/utils/file-upload.util';

@ApiTags('Customer Tickets')
@Controller('customer/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@ApiBearerAuth()
export class CustomerTicketsController {
  constructor(private readonly customerTicketsService: CustomerTicketsService) {}

  @Get()
  @ApiOperation({ summary: "Get customer's own tickets" })
  async findAll(
    @CurrentUser() customer: UserDocument,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.customerTicketsService.findAll(customer, {
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: "Get a customer's single ticket by ID" })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() customer: UserDocument,
  ) {
    const data = await this.customerTicketsService.findOne(id, customer);
    return { success: true, data };
  }

  @Post('purchase')
  @UseInterceptors(FileInterceptor('photo', multerOptions))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Purchase a ticket (customer)' })
  async purchase(
    @Body() dto: PurchaseTicketDto,
    @UploadedFile() photo: Express.Multer.File,
    @CurrentUser() customer: UserDocument,
  ) {
    if (!photo) {
      throw new BadRequestException('An identity photo is required for gate verification.');
    }
    const data = await this.customerTicketsService.purchase(dto, photo, customer);
    return { success: true, data };
  }
}
