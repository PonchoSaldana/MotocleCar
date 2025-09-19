import { Module } from '@nestjs/common';
import { PrismaModule } from './../prisma/prisma.module';
import { UsersModule } from './users/user.module';
import { ScoresModule } from './scores/scores.module';

@Module({
  imports: [PrismaModule, UsersModule, ScoresModule],
})
export class AppModule {}
