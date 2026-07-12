import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PurchaseTicketDto {
  @ApiProperty({ example: '64abc123def456...' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'VIP' })
  @IsString()
  @IsNotEmpty()
  zone: string;

  @ApiProperty({ example: 'Eva Customer' })
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @ApiProperty({ example: 'eva@example.com' })
  @IsEmail()
  @IsNotEmpty()
  visitorEmail: string;
}
