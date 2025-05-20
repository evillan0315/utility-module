// src/utils/utils.service.ts
import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as sharp from 'sharp';
import * as potrace from 'potrace';
import * as fs from 'fs';
import * as path from 'path';
import { lookup as mimeLookup } from 'mime-types';
import * as dotenv from 'dotenv';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkStringify from 'remark-stringify';
import { Root } from 'mdast';
const style = `
  <style>
     body {
       margin: 0;
       padding: 0;
       color: #999;
       background-color: black; font-family: Arial, sans-serif; 
     }
    .markdown-body { padding: 10px; max-width: 90%; margin: 0 auto; }
    .markdown-body h1 {  }
    .markdown-body .group:hover button {
	  opacity: 1;
	}

	.markdown-body .transition-opacity {
	  transition-property: opacity;
	}
	.prose p {
	}
	h1 {
	  margin-bottom: 20px;
	  font-size: 1.8em;
	}
	h2 {
	  margin-bottom: 16px;
	  margin-top: 16px;
	  font-size: 1.6em;
	}
	h3 {
	  margin-top: 12px;
	  margin-bottom: 12px;
	  font-size: 1.4em;
	}
	h4 {
	  margin-top: 12px;
	  margin-bottom: 12px;
	  font-size: 1.3em;
	}
	h5 {
	  margin-top: 12px;
	  margin-bottom: 12px;
	  font-size: 1.2em;
	}
	h2 > code {
	 font-size: 1em;
	}
	h3 > code {
	 font-size: .9em;
	}
	p {
	 margin-bottom: 0.5rem;   /* Space between items */
	}
	ul {
	  list-style-type: disc;   /* Bullet style */
	  padding-left: 1.5rem;    /* Indent */
	  margin-bottom: 1rem;     /* Optional spacing */
	}
	ul li {
	  margin-bottom: 0.5rem;   /* Space between items */
	}
	ol{
	  list-style-type: decimal; /* Numbered list */
	  padding-left: 1.5rem;
	  margin-bottom: 1rem;
	}

	ol li {
	  margin-bottom: 0.5rem;
	}
	hr {
	  border-color: #111;
	  margin-top: 20px;
	  margin-bottom: 10px;
	}
	pre {
	  padding: 14px;
	  border: 1px solid #333;
	  border-radius: 10px;
	  background: #222;
	  overflow: auto;
	}
	pre code {
	  color: #999;
	}
  </style>
`;
@Injectable()
export class UtilsService {
  private outputDir = path.join(__dirname, '../../svg-outputs');
  private getTempPngPath(originalPath: string): string {
    const fileName = path.basename(originalPath, path.extname(originalPath));
    return path.join(__dirname, `${fileName}-temp.png`);
  }

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir);
    }
  }
  async convertToSvg(
    filePath: string,
    color = '#000000',
    width: string = '512',
    height: string = '512',
  ): Promise<{ svg: string; filePath: string }> {
    try {
      const tempPngPath = this.getTempPngPath(filePath);

      await sharp(filePath)
        .resize(parseInt(width), parseInt(height)) // ← use custom size
        .threshold(128)
        .toFile(tempPngPath);

      const tracer = new potrace.Potrace({
        threshold: 128,
        color: color,
        optTolerance: 0.4,
        background: 'transparent',
      });

      const svg: string = await new Promise((resolve, reject) => {
        tracer.loadImage(tempPngPath, function (err) {
          if (err) return reject(err);
          resolve(this.getSVG());
        });
      });

      fs.unlinkSync(tempPngPath);

      const svgFilename = `svg-${Date.now()}.svg`;
      const svgPath = path.join(this.outputDir, svgFilename);
      fs.writeFileSync(svgPath, svg, 'utf-8');

      return { svg, filePath: svgPath };
    } catch (error) {
      throw new InternalServerErrorException(
        `Image to SVG conversion failed: ${error.message}`,
      );
    }
  }

  // Parses basic SELECT SQL to JSON
  parseSqlToJson(sql: string) {
    const selectRegex = /SELECT (.+) FROM (\w+)(?: WHERE (.+))?/i;
    const match = sql.match(selectRegex);

    if (!match) throw new Error('Invalid SELECT SQL syntax');

    const [, columns, table, where] = match;
    return {
      type: 'select',
      table,
      columns: columns.split(',').map((col) => col.trim()),
      where: where || null,
    };
  }

  // Parses basic INSERT SQL to JSON
  parseInsertSqlToJson(sql: string) {
    const insertRegex = /INSERT INTO (\w+)\s*\((.+)\)\s*VALUES\s*\((.+)\)/i;
    const match = sql.match(insertRegex);

    if (!match) throw new Error('Invalid INSERT SQL syntax');

    const [, table, columns, values] = match;

    const columnList = columns.split(',').map((c) => c.trim());
    const valueList = values
      .split(',')
      .map((v) => v.trim().replace(/^'|'$/g, ''));

    const data: Record<string, string> = {};
    columnList.forEach((col, idx) => {
      data[col] = valueList[idx];
    });

    return {
      type: 'insert',
      table,
      data,
    };
  }

  // Converts JSON to basic INSERT SQL
  jsonToInsertSql(input: {
    table: string;
    data: Record<string, string | number>;
  }): string {
    const { table, data } = input;
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data)
      .map((v) => (typeof v === 'string' ? `'${v}'` : v))
      .join(', ');

    return `INSERT INTO ${table} (${columns}) VALUES (${values});`;
  }

  // --- General Utilities ---

  capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  toKebabCase(text: string): string {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  reverseString(text: string): string {
    return text.split('').reverse().join('');
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }

  language(filename: string, mimeType?: string): string | undefined {
    if (!filename) return;

    const ext = filename.split('.').pop()?.toLowerCase();

    const extMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      html: 'html',
      css: 'css',
      md: 'markdown',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      cs: 'csharp',
      rs: 'rust',
      sh: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
      xml: 'xml',
      txt: 'plaintext',
      go: 'go',
      php: 'php',
    };

    if (ext && extMap[ext]) {
      return extMap[ext];
    }

    const detectedMimeType = mimeType || mimeLookup(filename) || undefined;

    const mimeMap: Record<string, string> = {
      'application/json': 'json',
      'text/html': 'html',
      'text/css': 'css',
      'application/javascript': 'javascript',
      'application/typescript': 'typescript',
      'text/markdown': 'markdown',
      'application/xml': 'xml',
      'text/x-python': 'python',
      'text/plain': 'plaintext',
      'video/mp2t': 'typescript', // override for .ts files
    };

    return detectedMimeType ? mimeMap[detectedMimeType] : undefined;
  }

  // --- Time Utilities ---

  timeAgo(ms: number): string {
    const formatter = new Intl.RelativeTimeFormat('en');
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const month = Math.round(day / 30);
    const year = Math.round(month / 12);

    if (sec < 10) {
      return 'just now';
    } else if (sec < 45) {
      return formatter.format(-sec, 'second');
    } else if (sec < 90 || min < 45) {
      return formatter.format(-min, 'minute');
    } else if (min < 90 || hr < 24) {
      return formatter.format(-hr, 'hour');
    } else if (hr < 36 || day < 30) {
      return formatter.format(-day, 'day');
    } else if (month < 18) {
      return formatter.format(-month, 'month');
    } else {
      return formatter.format(-year, 'year');
    }
  }

  toUnixSeconds(date: Date | string): number {
    return Math.floor(new Date(date).getTime() / 1000);
  }

  parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) throw new Error('Invalid duration format');

    const [_, amountStr, unit] = match;
    const amount = parseInt(amountStr, 10);

    switch (unit) {
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 's':
        return amount * 1000;
      default:
        throw new Error('Unknown time unit');
    }
  }

  formatUnixTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  extractMarkdownTitle(markdown: string): string | null {
    const match = markdown.match(/^#\s+(.*)/m);
    return match ? match[1].trim() : null;
  }

  uniqueArray<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }

  parseEnvToJsonString(content: string): Record<string, string> {
    const lines = content.split('\n');
    const result: Record<string, string> = {};

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      const [key, ...rest] = line.split('=');
      const value = rest
        .join('=')
        .trim()
        .replace(/^"(.*)"$/, '$1');
      result[key.trim()] = value;
    }

    return result;
  }
  async parseEnvFile(
    file?: Express.Multer.File,
    filepath?: string,
  ): Promise<{ filepath: string; data: Record<string, string> }> {
    if (file && filepath) {
      throw new HttpException(
        'Provide either an uploaded file or a filepath, not both.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!file && !filepath) {
      throw new HttpException(
        'Either an uploaded file or a filepath must be provided.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let content: string;
    let sourcePath: string;

    if (file) {
      content = file.buffer.toString('utf-8');
      sourcePath = file.originalname;
    } else {
      // Assert filepath is defined at this point
      const safePath = filepath as string;
      try {
        const resolvedPath = path.resolve(safePath);
        content = await fs.promises.readFile(resolvedPath, 'utf-8');
        sourcePath = resolvedPath;
      } catch (err) {
        throw new HttpException(
          `Failed to read file at path: ${safePath}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      const parsed = dotenv.parse(content);
      return { filepath: sourcePath, data: parsed };
    } catch (err) {
      throw new HttpException(
        'Failed to parse .env file',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  
  /**
   * Convert Markdown to MDAST JSON AST
   */
  async markdownToJson(markdown: string): Promise<Root> {
    const processor = unified().use(remarkParse);
    const tree = processor.parse(markdown);
    return tree;
  }

  /**
   * Convert JSON AST back to Markdown
   */
  async jsonToMarkdown(ast: Root): Promise<string> {
    const processor = unified().use(remarkStringify);
    const markdown = processor.stringify(ast);
    return markdown;
  }

  /**
   * Convert Markdown to HTML
   */
   
  async markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);

  return `${style}<div class="markdown-body">${String(file)}</div>`;
}
}
