// api/stream-proxy.js

// Usaremos 'node-fetch' o 'fetch' nativo, dependiendo de la configuración de Vercel.
// Para Vercel Serverless Functions, usa el módulo 'node-fetch' si es necesario, 
// o simplemente 'fetch' si tu configuración lo soporta (más moderno).

// Asumiremos que estás en un entorno Node.js que requiere 'require':
const fetch = require('node-fetch');

// URL base de donde vienen los streams (dlhd.dad)
const URL_BASE = 'https://dlhd.dad/stream/'; 

module.exports = async (req, res) => {
    // 1. Obtener el ID del stream de la URL (ej: /api/stream-proxy?id=445)
    // El ID se obtiene de req.query en este entorno Serverless
    const url = new URL(req.url, `http://${req.headers.host}`);
    const streamId = url.searchParams.get('id');
    
    if (!streamId) {
        // Enviar respuesta si falta el ID
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error: Missing stream ID parameter.');
        return;
    }

    // 2. Construir la URL completa del stream externo
    const targetUrl = `${URL_BASE}stream-${streamId}.php?disableads=1&no-reload=1&autoplay=1`;

    try {
        // 3. Petición de servidor a servidor (omite CORS)
        const response = await fetch(targetUrl, {
            method: 'GET',
            // Opcional: Configurar cabeceras para Hotlink Protection
            headers: {
                'User-Agent': 'Vercel Serverless Proxy',
                // Simular el Referer al propio dominio dlhd.dad a veces ayuda
                'Referer': URL_BASE, 
            },
        });

        // 4. Configurar cabeceras en la respuesta de Vercel (incluido CORS)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
        
        // 5. Reenviar el código de estado HTTP
        res.statusCode = response.status;

        // 6. Transmitir el cuerpo del stream directamente
        // NOTA: Usamos response.body.pipe(res) para manejar streams grandes de forma eficiente
        response.body.pipe(res);
        
    } catch (error) {
        console.error('Proxy Fetch Error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy failed to fetch the external stream.');
    }
};
