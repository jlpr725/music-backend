const express = require('express');
const cors = require('cors');
const ytSearch = require('yt-search');
const play = require('play-dl');

const app = express();
app.use(cors());

// Endpoint de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Música Backend Activo');
});

// Endpoint de búsqueda
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Falta el parámetro de búsqueda "q"' });
    }

    try {
        console.log(`Buscando: ${query}`);
        const r = await ytSearch(query);
        // Filtrar solo videos (excluir listas o canales)
        const videos = r.videos.slice(0, 10).map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author.name,
            cover: v.image,
            duration: v.timestamp
        }));
        
        res.json({ results: videos });
    } catch (error) {
        console.error('Error buscando:', error);
        res.status(500).json({ error: 'Error al buscar en internet' });
    }
});

// Endpoint para streaming
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).send('Falta el ID del video');
    }

    try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        
        const stream = await play.stream(url, {
            discordPlayerCompatibility : true
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Transfer-Encoding', 'chunked');

        stream.stream.pipe(res);

    } catch (error) {
        console.error('Error global de streaming:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor o video bloqueado');
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});
