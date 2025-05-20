import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Body,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Root } from 'mdast';
import { Response } from 'express';
import { MarkdownDto } from './dto/markdown.dto';

import { UploadEnvDto } from './dto/upload-env.dto';
import { UploadJsonDto } from './dto/upload-json.dto';
import { JsonBodyDto } from './dto/json-body.dto';
import { diskStorage } from 'multer';
import { UtilsService } from './utils.service';
import { UploadImageDto } from './dto/upload-image.dto';

@ApiTags('Utilities')
@Controller('api/utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  @Post('convert-to-svg')
  @ApiOperation({ summary: 'Convert an image to SVG' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        color: {
          type: 'string',
          example: '#000000',
          description: 'Fill color of the SVG output',
        },
        width: {
          type: 'string',
          example: '512',
          description: 'Resize width',
        },
        height: {
          type: 'string',
          example: '512',
          description: 'Resize height',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = path.basename(file.originalname, ext);
          cb(null, `${name}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageDto,
  ) {
    let tempPath;
    if (file) {
      tempPath = `./uploads/${file.originalname}`;
    }
    const { color = '#000000', width, height } = body;

    const result = await this.utilsService.convertToSvg(
      tempPath,
      color,
      width,
      height,
    );

    fs.unlinkSync(tempPath);

    return {
      message: 'SVG conversion successful',
      color,
      width,
      height,
      svg: result.svg,
      savedPath: result.filePath,
    };
  }
  @Post('json-to-env')
  @ApiOperation({
    summary: 'Upload JSON file or provide JSON body to convert to .env',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        json: {
          type: 'object',
          additionalProperties: { type: 'string' },
          example: {
            DB_HOST: 'localhost',
            DB_USER: 'admin',
          },
        },
        download: {
          type: 'boolean',
          example: true,
          default: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns .env as a file or raw string based on download option',
  })
  @UseInterceptors(FileInterceptor('file'))
  async jsonToEnv(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: JsonBodyDto,
    @Res() res: Response,
  ) {
    let json: Record<string, string>;

    if (file) {
      try {
        json = JSON.parse(file.buffer.toString('utf-8'));
      } catch {
        throw new HttpException(
          'Invalid JSON file format',
          HttpStatus.BAD_REQUEST,
        );
      }
    } else if (body?.json) {
      json = body.json;
    } else {
      throw new HttpException(
        'Either file or JSON body must be provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    const envContent = Object.entries(json)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const shouldDownload = body.download ?? false;

    if (shouldDownload) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=".env"');
      res.send(envContent);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.send(envContent);
    }
  }
  @Post('env-to-json')
  @ApiOperation({
    summary: 'Convert uploaded .env file or a filepath to JSON',
    description:
      'Parses a .env file from an upload or filepath and returns its contents as a JSON object.',
  })
  @ApiBody({
    description: 'Upload a .env file or provide a filepath (only one)',
    type: UploadEnvDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Successfully parsed .env file.',
    schema: {
      example: {
        filepath: '.env.local',
        data: {
          DB_HOST: 'localhost',
          DB_USER: 'root',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async envToJson(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadEnvDto,
  ) {
    return this.utilsService.parseEnvFile(file, body.filepath);
  }
  @Post('extract-title')
  @ApiOperation({ summary: 'Extracts the title from Markdown content' })
  @ApiResponse({
    status: 200,
    description: 'Title successfully extracted',
    schema: {
      example: {
        title: 'Hello World',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  extractTitle(@Body() body: MarkdownDto) {
    const match = body.content.match(/^#{1,2}\s+(.*)/m);
    const title = match ? match[1].trim() : null;
    return title;
  }

  // Utili for handling SQL
  @Post('parse-select')
  @ApiOperation({
    summary: 'Convert SELECT SQL to JSON',
    description:
      'Parses a simple SELECT SQL string into a structured JSON object.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          example: 'SELECT id, name FROM users WHERE active = 1',
        },
      },
    },
  })
  parseSelect(@Body('sql') sql: string) {
    try {
      return this.utilsService.parseSqlToJson(sql);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('parse-insert')
  @ApiOperation({
    summary: 'Convert INSERT SQL to JSON',
    description:
      'Parses a simple INSERT SQL string into a structured JSON object.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          example: "INSERT INTO users (id, name) VALUES (1, 'Alice')",
        },
      },
    },
  })
  parseInsert(@Body('sql') sql: string) {
    try {
      return this.utilsService.parseInsertSqlToJson(sql);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('json-to-insert')
  @ApiOperation({
    summary: 'Convert JSON to INSERT SQL',
    description: 'Generates a simple INSERT SQL string from a JSON object.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        table: { type: 'string', example: 'users' },
        data: {
          type: 'object',
          example: { id: 1, name: 'Alice' },
        },
      },
    },
  })
  jsonToSql(@Body() body: { table: string; data: Record<string, any> }) {
    try {
      return { sql: this.utilsService.jsonToInsertSql(body) };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  @Post('to-json')
  @ApiOperation({ summary: 'Convert Markdown to JSON AST' })
  @ApiBody({
    schema: { example: { markdown: '# Hello\n\nThis is **bold**.' } },
  })
  @ApiResponse({ status: 201, description: 'MDAST JSON returned.' })
  async convertToJson(@Body('markdown') markdown: string): Promise<Root> {
    return this.utilsService.markdownToJson(markdown);
  }
  @Post('to-markdown')
  @ApiOperation({ summary: 'Convert JSON AST to Markdown' })
  @ApiBody({
    schema: {
      example: {
        ast: {
          type: 'root',
          children: [
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Hello' }],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Markdown string returned.' })
  async convertToMarkdown(@Body('ast') ast: Root): Promise<string> {
    return this.utilsService.jsonToMarkdown(ast);
  }

  @Post('to-html')
  @ApiOperation({ summary: 'Convert Markdown to HTML' })
  @ApiBody({ schema: { example: { markdown: '# Hello\n\nParagraph here.' } } })
  @ApiResponse({ status: 201, description: 'HTML string returned.' })
  async convertToHtml(@Body('markdown') markdown: string): Promise<string> {
    return this.utilsService.markdownToHtml(markdown);
  }
}
