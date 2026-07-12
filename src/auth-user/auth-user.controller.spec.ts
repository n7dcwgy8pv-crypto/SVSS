import { Test, TestingModule } from '@nestjs/testing';
import { AuthUserController } from './auth-user.controller';
import { AuthUserService } from './auth-user.service';

describe('AuthUserController', () => {
  let controller: AuthUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthUserController],
      providers: [AuthUserService],
    }).compile();

    controller = module.get<AuthUserController>(AuthUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
