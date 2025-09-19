import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from './score.entity';
import { ScoresService } from './scores.service';
import { ScoresGateway } from './scores.gateway';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Score, User]), // registramos las entidades
    UsersModule, //Importamos UsersModule para reutilizar su servicio si hace falta
  ],
  providers: [ScoresService, ScoresGateway],
  exports: [ScoresService], 
})
export class ScoresModule {}
