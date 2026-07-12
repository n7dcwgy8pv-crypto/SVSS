import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @ApiProperty({ example: 'john@email.com' })
  @IsEmail()
  @IsNotEmpty()
  visitorEmail: string;

  @ApiProperty({ example: 'Rock Concert 2026' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @ApiProperty({ example: 'VIP' })
  @IsString()
  @IsNotEmpty()
  zone: string;

  @ApiProperty({ example: 'A12' })
  @IsString()
  @IsNotEmpty()
  seat: string;
}
