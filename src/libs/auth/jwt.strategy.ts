import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/models/user.schema';
import { Status } from 'src/libs/utils/constants/enum';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  status: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'changeme',
    });
  }

  async validate(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.userModel
      .findById(payload.id)
      .select('-password')
      .lean();

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    if (user.status !== Status.ACTIVE) {
      throw new UnauthorizedException('Account is inactive.');
    }
    return user as UserDocument;
  }
}
