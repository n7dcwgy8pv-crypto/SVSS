import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from 'src/libs/utils/constants/enum';

export class CreateUserDto {
  @ApiProperty({ example: 'New' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Guard' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'newguard@svss.io' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.SECURITY] })
  @IsEnum([UserRole.ADMIN, UserRole.SECURITY], {
    message: 'Role must be admin or security.',
  })
  role: UserRole.ADMIN | UserRole.SECURITY;
}
