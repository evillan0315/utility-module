import { Injectable } from '@nestjs/common';
import { UtilsService } from './utils/utils.service';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class AppService {
  constructor(private readonly utilsService: UtilsService) {}
  
  async getHome(): Promise<string> {
    const readmePath = join(process.cwd(), 'README.md');
    const markdown = await readFile(readmePath, 'utf-8');
    return this.utilsService.markdownToHtml(markdown);
  }
}
