import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CustomerAuthService } from './customer-auth.service';
import { LoginDto } from 'src/auth/dto/login.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { Roles } from 'src/libs/auth/roles.decorator';
import { RolesGuard } from 'src/libs/auth/roles.guard';
import { UserRole } from 'src/libs/utils/constants/enum';

@ApiTags('Customer Auth')
@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Customer login' })
  async login(@Body() dto: LoginDto) {
    const data = await this.customerAuthService.customerLogin(dto);
    return { success: true, data };
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Customer register' })
  async register(@Body() dto: CustomerRegisterDto) {
    const data = await this.customerAuthService.customerRegister(dto);
    return { success: true, data };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer logout' })
  async logout() {
    return { success: true, data: this.customerAuthService.logout() };
  }
}
