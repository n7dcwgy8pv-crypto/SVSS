import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { TicketStatus } from 'src/libs/utils/constants/enum';

export class UpdateTicketDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  visitorName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  visitorEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  event?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seat?: string;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsEnum(TicketStatus, { message: 'Status must be valid, used, or invalid.' })
  @IsOptional()
  status?: TicketStatus;
}
