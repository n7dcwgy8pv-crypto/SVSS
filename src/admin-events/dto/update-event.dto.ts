import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventCategory, ZoneName } from 'src/libs/utils/constants/enum';
import { EventZoneDto } from './create-event.dto';

export class UpdateEventZoneDto {
  @ApiPropertyOptional({ enum: ZoneName })
  @IsEnum(ZoneName, {
    message: 'Zone name must be VIP, Premium, General, or Standard.',
  })
  @IsOptional()
  name?: ZoneName;

  @ApiPropertyOptional({ example: 300 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  available?: number;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Rock Concert 2026 — Updated' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Grand Arena, Downtown' })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiPropertyOptional({ example: '2026-09-15' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: '20:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be in HH:MM format.' })
  @IsOptional()
  time?: string;

  @ApiPropertyOptional({ enum: EventCategory })
  @IsEnum(EventCategory, {
    message: 'Category must be Concert, Expo, Conference, or Festival.',
  })
  @IsOptional()
  category?: EventCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [EventZoneDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one zone is required.' })
  @ArrayMaxSize(4, { message: 'Maximum 4 zones allowed.' })
  @ValidateNested({ each: true })
  @Type(() => EventZoneDto)
  @IsOptional()
  zones?: EventZoneDto[];
}
