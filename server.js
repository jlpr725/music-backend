const express = require('express');
const cors = require('cors');
const ytSearch = require('yt-search');
const ytdl = require('@distube/ytdl-core');

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
        
        // Comprobar si el video es válido
        if (!ytdl.validateURL(url)) {
            return res.status(400).send('URL inválida');
        }

        // Encabezados para que el navegador sepa que es audio streaming
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Extraer audio
        const stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25 // 32MB buffer
        });

        // Manejar errores del stream para evitar caídas del servidor
        stream.on('error', (err) => {
            console.error('Error en el streaming:', err);
            if (!res.headersSent) {
                res.status(500).send('Error extrayendo el audio');
            } else {
                res.end();
            }
        });

        // Enviar stream directamente a la respuesta
        stream.pipe(res);

    } catch (error) {
        console.error('Error global de streaming:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});
