import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Root } from 'mdast';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHome(): Promise<string> {
    return this.appService.getHome();
  }
}
