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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { Roles } from 'src/libs/auth/roles.decorator';
import { RolesGuard } from 'src/libs/auth/roles.guard';
import { UserRole } from 'src/libs/utils/constants/enum';

@ApiTags('Staff Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Staff login (admin / security)' })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.staffLogin(dto);
    return { success: true, data };
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Staff register (admin / security only)' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.staffRegister(dto);
    return { success: true, data };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Staff logout' })
  async logout() {
    return { success: true, data: this.authService.logout() };
  }
}
