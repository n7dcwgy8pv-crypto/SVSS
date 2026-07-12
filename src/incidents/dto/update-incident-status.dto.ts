import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { IncidentStatus } from 'src/libs/utils/constants/enum';

export class UpdateIncidentStatusDto {
  @ApiProperty({ enum: IncidentStatus })
  @IsEnum(IncidentStatus, {
    message: 'Status must be open, investigating, or resolved.',
  })
  @IsNotEmpty()
  status: IncidentStatus;
}
