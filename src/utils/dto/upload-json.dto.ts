// src/utils/dto/upload-json.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadJsonDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Upload your JSON file to convert to .env',
  })
  @IsNotEmpty()
  @Type(() => Buffer)
  file: any;
}
