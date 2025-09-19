import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ScoresGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly scoresService: ScoresService) {}

  @SubscribeMessage('submitScore')
  async handleScore(
    @MessageBody() createScoreDto: CreateScoreDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Guardar
      const saved = await this.scoresService.saveScore(
        createScoreDto.userId,
        createScoreDto.score,
      );

      // Top 10
      const leaderboard = await this.scoresService.getLeaderboard();

      // Difundir ranking a todos
      this.server.emit('leaderboardUpdate', leaderboard);

      // Confirmar solo al cliente que envió
      client.emit('scoreSaved', saved);
    } catch (err) {
      client.emit('errorSavingScore', { message: err.message });
    }
  }
}
