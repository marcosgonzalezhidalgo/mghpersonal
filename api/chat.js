import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Manejo de la solicitud pre-flight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo permitimos POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        // Verificación de seguridad
        if (!apiKey) {
            console.error("Error: GEMINI_API_KEY no está definida en las variables de entorno.");
            return res.status(500).json({ error: 'Error de configuración del servidor (API Key missing)' });
        }

        if (!message) {
            return res.status(400).json({ error: 'El mensaje está vacío' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // CAMBIO IMPORTANTE: Usamos el modelo 'gemini-1.5-flash' (más rápido y actual)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Error detallado en API Gemini:', error);

        // Devolvemos el error específico si es seguro hacerlo, ayuda a depurar
        return res.status(500).json({
            error: 'Error interno al procesar la respuesta',
            details: error.message
        });
    }
}