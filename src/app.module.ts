import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilsModule } from './utils/utils.module';
import { UtilsService } from './utils/utils.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UtilsModule,
  ],
  controllers: [AppController],
  providers: [AppService, UtilsService],
})
export class AppModule {}
