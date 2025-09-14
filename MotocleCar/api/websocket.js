const WebSocket = require('ws');
const score = require('./score');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    console.log('Cliente conectado');
    ws.on('message', message => {
        const data = JSON.parse(message);
        score.saveScore(data.userId, data.score);
        
        score.saveToFile();
        ws.send(JSON.stringify({ status: 'saved', score: data.score }));
    });
    ws.on('close', () => console.log('Cliente desconectado'));
});

console.log('Servidor WebSocket corriendo en ws://localhost:8080');