// dto/markdown.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MarkdownDto {
  @ApiProperty({
    description: 'Markdown content containing a title (# Title)',
    example: '# Hello World\nThis is some markdown.',
  })
  @IsString()
  content: string;
}
