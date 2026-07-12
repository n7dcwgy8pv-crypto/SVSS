import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTicketDto {
  @ApiProperty({ example: 'TKT-001|John Doe|Rock Concert 2026|VIP|A12' })
  @IsString()
  @IsNotEmpty({ message: 'qrData is required.' })
  qrData: string;
}
