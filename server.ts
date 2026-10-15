import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON with generous payload limits for base64 images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(ai),
    timestamp: new Date().toISOString(),
  });
});

// AI Person & Hair Detail Analyzer endpoint
app.post('/api/ai/analyze-portrait', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI API key is not configured.',
        fallback: {
          peopleCount: 1,
          hairComplexity: 'medium',
          lightingQuality: 'good',
          tips: ['Bordas bem definidas detectadas', 'Recomendado refino suave nas mechas de cabelo'],
        },
      });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `Você é um especialista em visão computacional e recorte de alta precisão de pessoas e retratos fotográficos.
Analise detalhadamente esta imagem focando estritamente nas PESSOAS presentes e nos detalhes necessários para uma remoção de fundo com transparência perfeita SEM BORDAS BRANCAS ou halos indesejados (cabelos, contornos corporais, roupas finas, acessórios).

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "peopleCount": number,
  "confidenceScore": number (0-100),
  "detectedSubjects": string[] (ex: ["Mulher com cabelo cacheado e jaqueta preta", "Criança ao lado"]),
  "hairComplexity": "simple" | "medium" | "high" | "curly/flyaway",
  "edgesAssessment": {
    "hairDetail": string,
    "contrastWithBackground": "high" | "medium" | "low",
    "motionBlurDetected": boolean,
    "translucentElements": string (ex: "óculos", "fios de cabelo finos", "véu", "nenhum")
  },
  "recommendedSettings": {
    "featheringRadius": number (em pixels, entre 0 e 2, preferencialmente 0.5 para nitidez),
    "edgeShift": number (em pixels, entre -3 e -1 para contrair o contorno e eliminar completamente bordas brancas),
    "defringe": boolean,
    "smoothing": boolean
  },
  "portraitAdvice": string (uma frase motivadora em português destacando a eliminação de bordas brancas e a qualidade do recorte para pessoas)
}`,
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from AI model');
    }

    const parsed = JSON.parse(text);
    return res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Error analyzing portrait with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze portrait',
      fallback: {
        peopleCount: 1,
        hairComplexity: 'medium',
        confidenceScore: 92,
        detectedSubjects: ['Pessoa detectada com sucesso'],
        edgesAssessment: {
          hairDetail: 'Detecção padrão otimizada com algoritmo neural',
          contrastWithBackground: 'high',
          motionBlurDetected: false,
          translucentElements: 'nenhum',
        },
        recommendedSettings: {
          featheringRadius: 1,
          edgeShift: 0,
          defringe: true,
          smoothing: true,
        },
        portraitAdvice: 'IA neural pronta para segmentação com alta nitidez.',
      },
    });
  }
});

// Configure Vite in dev mode or serve dist in prod
async function setupApp() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
});
