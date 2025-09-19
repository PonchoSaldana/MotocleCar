require('dotenv').config();
const WebSocket = require('ws');
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('Conectando a la BD del congreso...');
pool.query('SELECT NOW()')
    .then(() => console.log('¡Conexión exitosa!'))
    .catch(err => console.error('Error de conexión:', err));

const wss = new WebSocket.Server({ port: process.env.WS_PORT || 8080 });
console.log('Servidor WebSocket en ws://localhost:8080 (o wss:// en producción)');

wss.on('connection', (ws) => {
    console.log('Cliente conectado via WS');
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Datos WS recibidos:', data);
            if (data.userId && data.score !== undefined) {
                const validateQuery = 'SELECT id FROM public.users WHERE id = $1::BIGINT';
                const validateResult = await pool.query(validateQuery, [data.userId]);
                if (validateResult.rows.length === 0) {
                    ws.send(JSON.stringify({ success: false, error: 'Usuario no registrado en el congreso' }));
                    return;
                }

                const query = `
                    INSERT INTO public.game_score (user_id, score) 
                    VALUES ($1::BIGINT, $2) 
                    RETURNING game_score_id, user_id, score, created_at
                `;
                const result = await pool.query(query, [data.userId, data.score]);
                console.log('Puntaje guardado para usuario ID', data.userId, ':', result.rows[0]);
                ws.send(JSON.stringify({ success: true, id: result.rows[0].game_score_id }));
            } else {
                ws.send(JSON.stringify({ success: false, error: 'Datos incompletos (userId y score requeridos)' }));
            }
        } catch (error) {
            console.error('Error WS:', error);
            ws.send(JSON.stringify({ success: false, error: error.message }));
        }
    });
    ws.on('close', () => console.log('Cliente WS desconectado'));
});

// Endpoint para obtener un nuevo userId con nombre (puedes pasar name como query param)
app.get('/get-user-id', async (req, res) => {
    try {
        const { name } = req.query; // Opcional: nombre via query (ej. ?name=Juan)
        const userName = name || 'Usuario Anónimo'; // Default si no se proporciona
        const query = `
            INSERT INTO public.users (created_at, name) 
            VALUES (CURRENT_TIMESTAMP, $1) 
            RETURNING id, name
        `;
        const result = await pool.query(query, [userName]);
        const { id, name: userNameResult } = result.rows[0];
        console.log('Nuevo userId generado para registro en congreso:', id, 'con nombre:', userNameResult);
        res.json({ userId: id, name: userNameResult });
    } catch (error) {
        console.error('Error al obtener userId:', error);
        res.status(500).json({ error: 'No se pudo asignar userId' });
    }
});

app.post('/save-score', async (req, res) => {
    try {
        const { userId, score } = req.body;
        console.log('Datos HTTP recibidos para clasificaciones:', { userId, score });

        if (!userId || score === undefined) {
            return res.status(400).json({ success: false, error: 'userId o score faltante' });
        }

        const validateQuery = 'SELECT id FROM public.users WHERE id = $1::BIGINT';
        const validateResult = await pool.query(validateQuery, [userId]);
        if (validateResult.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Usuario no registrado en el congreso' });
        }

        const query = `
            INSERT INTO public.game_score (user_id, score) 
            VALUES ($1::BIGINT, $2) 
            RETURNING game_score_id, user_id, score, created_at
        `;
        const result = await pool.query(query, [userId, score]);
        console.log('Puntaje guardado para usuario ID', userId, ':', result.rows[0]);
        res.json({ success: true, id: result.rows[0].game_score_id });
    } catch (error) {
        console.error('Error HTTP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/leaderboard', async (req, res) => {
    try {
        const query = `
            SELECT gs.user_id, u.name, gs.score, gs.created_at, u.created_at as user_registration_date
            FROM public.game_score gs
            JOIN public.users u ON gs.user_id = u.id
            ORDER BY gs.score DESC 
            LIMIT 10
        `;
        const result = await pool.query(query);
        console.log('Clasificaciones consultadas:', result.rows.length, 'registros');
        res.json(result.rows);
    } catch (error) {
        console.error('Error leaderboard:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor HTTP en http://localhost:${PORT}`));

process.on('SIGINT', () => {
    pool.end().then(() => console.log('Pool cerrado'));
    process.exit();
});