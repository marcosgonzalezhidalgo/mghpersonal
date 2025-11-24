import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Headers para evitar problemas de CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Manejo de pre-flight request
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

        // USAMOS GEMINI-PRO PARA ASEGURAR COMPATIBILIDAD
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Error en API Gemini:', error);
        res.status(500).json({ error: 'Error interno del servidor al conectar con IA' });
    }
}