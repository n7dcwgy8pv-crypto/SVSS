import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventCategory, ZoneName } from 'src/libs/utils/constants/enum';

export class EventZoneDto {
  @ApiProperty({ enum: ZoneName, example: 'VIP' })
  @IsEnum(ZoneName, {
    message: 'Zone name must be VIP, Premium, General, or Standard.',
  })
  @IsNotEmpty()
  name: ZoneName;

  @ApiProperty({ example: 250 })
  @IsNumber({}, { message: 'Price must be a number.' })
  @Min(0, { message: 'Price must be 0 or greater.' })
  price: number;

  @ApiProperty({ example: 20 })
  @IsNumber({}, { message: 'Available must be a number.' })
  @Min(1, { message: 'Available seats must be at least 1.' })
  available: number;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Rock Concert 2026' })
  @IsString()
  @IsNotEmpty({ message: 'Event name is required.' })
  name: string;

  @ApiProperty({ example: 'Grand Arena, Downtown' })
  @IsString()
  @IsNotEmpty({ message: 'Venue is required.' })
  venue: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format.' })
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '19:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be in HH:MM format.' })
  @IsNotEmpty()
  time: string;

  @ApiProperty({ enum: EventCategory, example: 'Concert' })
  @IsEnum(EventCategory, {
    message: 'Category must be Concert, Expo, Conference, or Festival.',
  })
  @IsNotEmpty()
  category: EventCategory;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: 'An electrifying night of rock music.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [EventZoneDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one zone is required.' })
  @ArrayMaxSize(4, { message: 'Maximum 4 zones allowed.' })
  @ValidateNested({ each: true })
  @Type(() => EventZoneDto)
  zones: EventZoneDto[];
}
