import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Configuración de cabeceras (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key no configurada' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // CAMBIO AQUÍ: Usamos la versión específica '001' que suele fallar menos
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const prompt = `Eres un asistente útil y conciso. Responde a esto: ${message}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Error detallado de Gemini:', error);
        // Si falla el modelo específico, intenta capturarlo aquí para saberlo
        res.status(500).json({ error: 'Error al generar respuesta. Intenta de nuevo.' });
    }
}