import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/models/user.schema';
import { Status, UserRole } from 'src/libs/utils/constants/enum';
import { LoginDto } from 'src/auth/dto/login.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  private signToken(user: UserDocument): string {
    return this.jwtService.sign({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    });
  }

  private formatUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: (user as any).createdAt
        ? new Date((user as any).createdAt).toISOString().split('T')[0]
        : null,
    };
  }

  async customerLogin(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.SECURITY) {
      throw new ForbiddenException(
        'Staff accounts must use the Staff Portal to sign in.',
      );
    }

    if (user.status !== Status.ACTIVE) {
      throw new ForbiddenException('Your account is inactive.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      user: this.formatUser(user),
      token: this.signToken(user),
    };
  }

  async customerRegister(dto: CustomerRegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const exists = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (exists) {
      throw new ConflictException('A user with this email already exists.');
    }

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      name: `${dto.firstName} ${dto.lastName}`,
      email: dto.email.toLowerCase(),
      password: hash,
      role: UserRole.CUSTOMER, // always forced
      status: Status.ACTIVE,
    });

    return {
      user: this.formatUser(user),
      token: this.signToken(user),
    };
  }

  logout() {
    return { message: 'Logged out successfully.' };
  }
}
