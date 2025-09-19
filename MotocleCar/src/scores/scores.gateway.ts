import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { ScoresService } from './scores.service';

@WebSocketGateway(8080, { cors: true }) // Puerto 8080 como en tu juego
export class ScoresGateway {
  @WebSocketServer()
  server: Server;

  constructor(private scoresService: ScoresService) {}

  @SubscribeMessage('saveScore')
  async handleSaveScore(@MessageBody() data: { userId: number; score: number }) {
    try {
      const saved = await this.scoresService.saveScore(BigInt(data.userId), data.score);
      return { success: true, id: saved.game_score_id };
    } catch (error) {
      console.error('Error guardando puntaje:', error);
      return { success: false, error: error.message };
    }
  }
}
