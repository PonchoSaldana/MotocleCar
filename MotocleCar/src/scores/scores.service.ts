import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from './score.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async saveScore(userId: number, scoreValue: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    const score = this.scoreRepo.create({ value: scoreValue, user });
    return await this.scoreRepo.save(score);
  }

  async getLeaderboard(limit = 10) {
    return await this.scoreRepo.find({
      order: { value: 'DESC' },
      take: limit,
    });
  }
}
