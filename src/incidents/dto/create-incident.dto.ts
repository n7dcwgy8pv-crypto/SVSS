import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IncidentType } from 'src/libs/utils/constants/enum';

export class CreateIncidentDto {
  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType, {
    message: 'Type must be duplicate, suspicious, invalid, or other.',
  })
  @IsNotEmpty()
  type: IncidentType;

  @ApiPropertyOptional({ example: 'TKT-003' })
  @IsString()
  @IsOptional()
  ticketId?: string;

  @ApiProperty({ example: 'Visitor appearance did not match registered photo.' })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters.' })
  @IsNotEmpty()
  description: string;
}
