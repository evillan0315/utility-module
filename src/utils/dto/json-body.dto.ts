// src/utils/dto/json-body.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsBoolean } from 'class-validator';

export class JsonBodyDto {
  @ApiPropertyOptional({
    description: 'Optional JSON body as an alternative to file upload',
    example: {
      DB_HOST: 'localhost',
      DB_USER: 'admin',
    },
  })
  @IsOptional()
  @IsObject()
  json?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'If true, response will be a .env file download',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  download?: boolean;
}
