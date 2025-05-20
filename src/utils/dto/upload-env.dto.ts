// src/utils/dto/upload-env.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadEnvDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Upload your .env file',
    required: false,
  })
  @IsNotEmpty()
  @IsOptional()
  @Type(() => Buffer)
  file: any;

  @ApiProperty({
    description: 'Optional path or filename context for the uploaded .env file',
    type: 'string',
    example: '.env',
    required: false,
  })
  @IsOptional()
  @IsString()
  filepath?: string;
}
