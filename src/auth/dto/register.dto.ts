import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/libs/utils/constants/enum';

export class RegisterDto {
  @ApiProperty({ example: 'Bob' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @ApiProperty({ example: 'Security' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName: string;

  @ApiProperty({ example: 'bob@svss.io' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  /**
   * Accepts any UserRole so the service can return the specific spec-required
   * message for `customer` submissions instead of a generic validation error.
   */
  @ApiProperty({ enum: UserRole, example: 'security' })
  @IsEnum(UserRole, { message: 'Role must be admin, security, or customer.' })
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @Matches(/\d/, { message: 'Password must contain at least one number.' })
  password: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @IsNotEmpty({ message: 'confirmPassword is required.' })
  confirmPassword: string;
}
