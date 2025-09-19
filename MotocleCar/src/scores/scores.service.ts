import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScoresService {
  constructor(private prisma: PrismaService) {}

  async saveScore(userId: bigint, value: number) {
    return this.prisma.game_score.create({
      data: {
        game_score_id: BigInt(Date.now()), 
        score: value,
        users: { connect: { user_id: userId } },
      },
    });
  }

  async getLeaderboard() {
    return this.prisma.game_score.findMany({
      orderBy: { score: 'desc' },
      take: 10,
      include: { users: true },
    });
  }
}
