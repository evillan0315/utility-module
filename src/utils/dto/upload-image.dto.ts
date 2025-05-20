import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Upload your  file',
  })
  @IsNotEmpty()
  @Type(() => Buffer)
  file: any;

  @ApiProperty({ example: '#000000', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: '512', required: false })
  @IsOptional()
  @IsString()
  width?: string;

  @ApiProperty({ example: '512', required: false })
  @IsOptional()
  @IsString()
  height?: string;
}
