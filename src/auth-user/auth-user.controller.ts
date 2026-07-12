import { Controller } from '@nestjs/common';
import { AuthUserService } from './auth-user.service';

@Controller('auth-user')
export class AuthUserController {
  constructor(private readonly authUserService: AuthUserService) {}
}
