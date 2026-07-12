import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/libs/auth/jwt-auth.guard';
import { CurrentUser } from 'src/libs/auth/current-user.decorator';
import type { UserDocument } from 'src/models/user.schema';

@ApiTags('Profile')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  @Get()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getMe(@CurrentUser() user: UserDocument) {
    return {
      success: true,
      data: {
        id: (user as any)._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: (user as any).createdAt
          ? new Date((user as any).createdAt).toISOString().split('T')[0]
          : null,
      },
    };
  }
}
