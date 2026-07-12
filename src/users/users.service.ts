import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/models/user.schema';
import { Status } from 'src/libs/utils/constants/enum';
import { CreateUserDto } from './dto/create-user.dto';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

interface UserPlain {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt?: Date;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private formatUserPlain(u: UserPlain) {
    return {
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt
        ? new Date(u.createdAt).toISOString().split('T')[0]
        : null,
    };
  }

  private formatUser(user: UserDocument) {
    const typed = user as UserDocument & { createdAt?: Date };
    return {
      id: String(typed._id),
      name: typed.name,
      email: typed.email,
      role: typed.role,
      status: typed.status,
      createdAt: typed.createdAt
        ? new Date(typed.createdAt).toISOString().split('T')[0]
        : null,
    };
  }

  async findAll(query: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};

    if (query.role) filter['role'] = query.role;
    if (query.status) filter['status'] = query.status;

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter['$and'] = [{ $or: [{ name: regex }, { email: regex }] }];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .skip(skip)
        .limit(pageSize)
        .lean<UserPlain[]>(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: users.map((u) => this.formatUserPlain(u)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async create(dto: CreateUserDto) {
    const exists = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (exists) {
      throw new ConflictException('A user with this email already exists.');
    }

    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);

    const user = await this.userModel.create({
      name: `${dto.firstName} ${dto.lastName}`,
      email: dto.email.toLowerCase(),
      password: hash,
      role: dto.role,
      status: Status.ACTIVE,
    });

    return {
      user: this.formatUser(user),
      temporaryPassword: tempPassword,
    };
  }

  async toggleStatus(targetId: string, requestingUser: UserDocument) {
    if (String(requestingUser._id) === targetId) {
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    const user = await this.userModel.findById(targetId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.status =
      user.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;
    await user.save();

    return this.formatUser(user);
  }
}
