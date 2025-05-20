import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PdfContentDto {
  @IsString()
  @ApiPropertyOptional({
    description: 'Raw text content to be converted into PDF',
  })
  text?: string;

  @IsString()
  @ApiPropertyOptional({
    description: 'Base64-encoded content instead of plain text',
  })
  base64?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Custom filename for the PDF download (optional)',
  })
  filename?: string;
}
