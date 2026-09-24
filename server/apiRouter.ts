import express, { Request, Response } from 'express';
import {
  testConnection,
  listAvailableModels,
  analyzeStory,
  improveStory,
  generateCharacterBible,
  generateScenes,
  generateFinalPackage,
  formatSpokenStory,
  fastGenerateCinematicSuite,
} from './geminiService.ts';
import type { VideoDuration } from '../src/types/index.ts';

export const apiRouter = express.Router();

function getApiKeyFromReq(req: Request): string | undefined {
  const headerKey = req.headers['x-gemini-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  if (req.body && typeof req.body.apiKey === 'string' && req.body.apiKey.trim()) {
    return req.body.apiKey.trim();
  }
  return process.env.GEMINI_API_KEY;
}

function formatApiErrorMessage(error: any, fallbackMessage: string): string {
  if (!error) return fallbackMessage;
  const raw = typeof error === 'string' ? error : error?.message || String(error);

  if (raw.includes('Empty response text')) {
    return 'Gemini মডেল থেকে প্রতিক্রিয়া পেতে সমস্যা হয়েছিল। আমাদের স্বয়ংক্রিয় ব্যাকআপ সিস্টেম সক্রিয় রয়েছে। দয়া করে আবার জেনারেট বাটনে ক্লিক করুন অথবা সেটিংসে আপনার Gemini API Key চেক করুন। (Empty response from AI model. Automatic resilience active - please click generate again or check your API key in Settings.)';
  }
  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
    return 'Gemini AI সার্ভার সাময়িকভাবে ব্যস্ত (High Traffic Demand)। আমাদের স্বয়ংক্রিয় ফলব্যাক সক্রিয় রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার ক্লিক করুন অথবা সেটিংসে মডেল পরিবর্তন করুন।';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API রেট লিমিট শেষ হয়েছে। কিছুক্ষণ অপেক্ষা করুন অথবা সেটিংসে আপনার নিজস্ব Gemini API Key যুক্ত করুন। (Rate limit reached. Please wait a moment or configure your own API key in Settings.)';
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('401') || raw.includes('403')) {
    return 'Gemini API Key সঠিক নয় বা অনুমতি নেই। দয়া করে সেটিংস থেকে সঠিক API Key যাচাই করুন। (Invalid Gemini API key. Please verify your key in Settings.)';
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {}

  return raw || fallbackMessage;
}

// 1. Test Connection
apiRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKeyFromReq(req);
    const model = req.body?.model || 'gemini-3.8-flash';
    const result = await testConnection(apiKey, model);
    res.json(result);
  } catch (error: any) {
    console.error('API Test Error:', error);
    res.status(400).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to connect to Gemini API. Check your key.'),
    });
  }
});

// 2. List Models
apiRouter.post('/models', async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKeyFromReq(req);
    const models = await listAvailableModels(apiKey);
    res.json({ success: true, models });
  } catch (error: any) {
    console.error('Model List Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Error listing models'),
    });
  }
});

// 3. Analyze Story
apiRouter.post('/analyze-story', async (req: Request, res: Response) => {
  try {
    const { rawStory, model } = req.body;
    if (!rawStory || typeof rawStory !== 'string' || !rawStory.trim()) {
      return res.status(400).json({ success: false, error: 'Raw story content is required.' });
    }
    const apiKey = getApiKeyFromReq(req);
    const analysis = await analyzeStory(rawStory, model || 'gemini-3.8-flash', apiKey);
    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Story Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to analyze story.'),
    });
  }
});

// 4. Improve Story
apiRouter.post('/improve-story', async (req: Request, res: Response) => {
  try {
    const { rawStory, analysis, model } = req.body;
    if (!rawStory || !analysis) {
      return res.status(400).json({ success: false, error: 'Story and analysis data are required.' });
    }
    const apiKey = getApiKeyFromReq(req);
    const improved = await improveStory(rawStory, analysis, model || 'gemini-3.8-flash', apiKey);
    res.json({ success: true, improvedStory: improved });
  } catch (error: any) {
    console.error('Improve Story Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to improve story.'),
    });
  }
});

// 5. Generate Character Bible
apiRouter.post('/generate-characters', async (req: Request, res: Response) => {
  try {
    const { improvedStoryText, analysis, model } = req.body;
    if (!improvedStoryText || !analysis) {
      return res.status(400).json({ success: false, error: 'Improved story and analysis are required.' });
    }
    const apiKey = getApiKeyFromReq(req);
    const characters = await generateCharacterBible(
      improvedStoryText,
      analysis,
      model || 'gemini-3.8-flash',
      apiKey
    );
    res.json({ success: true, characters });
  } catch (error: any) {
    console.error('Generate Characters Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to generate character bible.'),
    });
  }
});

function calculateSceneCount(duration: VideoDuration, sceneCount?: any, targetVideoLength?: string): number {
  if (sceneCount && Number(sceneCount) > 0) {
    return Math.min(Math.max(1, Number(sceneCount)), 80);
  }
  const clipSec = duration === '10s' ? 10 : 8;
  switch (targetVideoLength) {
    case '30s':
      return Math.round(30 / clipSec); // 3 for 10s, 4 for 8s
    case '1m':
      return Math.round(60 / clipSec); // 6 for 10s, 8 for 8s
    case '2m':
      return Math.round(120 / clipSec); // 12 for 10s, 15 for 8s
    case '3m':
      return Math.round(180 / clipSec); // 18 for 10s, 23 for 8s
    case '5m':
      return Math.round(300 / clipSec); // 30 for 10s, 38 for 8s
    case '10m':
      return Math.round(600 / clipSec); // 60 for 10s, 75 for 8s
    default:
      return duration === '10s' ? 6 : 8;
  }
}

// 6. Generate Scenes
apiRouter.post('/generate-scenes', async (req: Request, res: Response) => {
  try {
    const { improvedStory, characters, duration, sceneCount, targetVideoLength, model } = req.body;
    if (!improvedStory || !characters || !Array.isArray(characters)) {
      return res.status(400).json({ success: false, error: 'Improved story and character bible are required.' });
    }
    const dur: VideoDuration = duration === '10s' ? '10s' : '8s';
    const computedSceneCount = calculateSceneCount(dur, sceneCount, targetVideoLength);
    const apiKey = getApiKeyFromReq(req);
    const scenes = await generateScenes(
      improvedStory,
      characters,
      dur,
      computedSceneCount,
      model || 'gemini-3.8-flash',
      apiKey
    );
    res.json({ success: true, scenes });
  } catch (error: any) {
    console.error('Generate Scenes Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to generate scenes.'),
    });
  }
});

// 7. Generate Package
apiRouter.post('/generate-package', async (req: Request, res: Response) => {
  try {
    const { improvedStory, scenes, characters, model, platform } = req.body;
    if (!improvedStory || !scenes) {
      return res.status(400).json({ success: false, error: 'Improved story and scenes are required.' });
    }
    const apiKey = getApiKeyFromReq(req);
    const targetPlatform = platform === 'facebook' ? 'facebook' : 'youtube';
    const videoPackage = await generateFinalPackage(
      improvedStory,
      scenes,
      characters || [],
      model || 'gemini-3.8-flash',
      apiKey,
      targetPlatform
    );
    res.json({ success: true, videoPackage });
  } catch (error: any) {
    console.error('Generate Package Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to generate release package.'),
    });
  }
});

// 8. Lightning-Fast Single-Pass Generator (Character Image Prompt + 8s/10s Video Prompts)
apiRouter.post('/fast-generate', async (req: Request, res: Response) => {
  try {
    const { rawStory, duration, sceneCount, targetVideoLength, model, platform } = req.body;
    if (!rawStory || typeof rawStory !== 'string' || !rawStory.trim()) {
      return res.status(400).json({ success: false, error: 'Raw story content is required.' });
    }

    const apiKey = getApiKeyFromReq(req);
    const dur: VideoDuration = duration === '10s' ? '10s' : '8s';
    const computedSceneCount = calculateSceneCount(dur, sceneCount, targetVideoLength);
    const selectedModel = model || 'gemini-3.8-flash';
    const targetPlatform = platform === 'facebook' ? 'facebook' : 'youtube';

    const result = await fastGenerateCinematicSuite(
      rawStory,
      dur,
      computedSceneCount,
      selectedModel,
      apiKey,
      targetPlatform
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Fast Generate Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to generate character and video prompts.'),
    });
  }
});

// 9. Full Pipeline (Optimized for high speed and resilience)
apiRouter.post('/full-pipeline', async (req: Request, res: Response) => {
  try {
    const { rawStory, duration, sceneCount, targetVideoLength, model, platform } = req.body;
    if (!rawStory || typeof rawStory !== 'string' || !rawStory.trim()) {
      return res.status(400).json({ success: false, error: 'Raw story content is required.' });
    }

    const apiKey = getApiKeyFromReq(req);
    const dur: VideoDuration = duration === '10s' ? '10s' : '8s';
    const computedSceneCount = calculateSceneCount(dur, sceneCount, targetVideoLength);
    const selectedModel = model || 'gemini-3.8-flash';
    const targetPlatform = platform === 'facebook' ? 'facebook' : 'youtube';

    // Execute ultra-fast single pass to avoid multi-request timeouts and 503 latency
    const result = await fastGenerateCinematicSuite(
      rawStory,
      dur,
      computedSceneCount,
      selectedModel,
      apiKey,
      targetPlatform
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Full Pipeline Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to execute story pipeline.'),
    });
  }
});

// 9. Format Spoken Voice Story (Bangla, Banglish, English)
apiRouter.post('/format-voice', async (req: Request, res: Response) => {
  try {
    const { transcript, languagePreference, model } = req.body;
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({ success: false, error: 'Transcript content is required.' });
    }
    const apiKey = getApiKeyFromReq(req);
    const result = await formatSpokenStory(
      transcript,
      languagePreference || 'auto',
      model || 'gemini-3.8-flash',
      apiKey
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Voice Formatting Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to format voice transcript.'),
    });
  }
});
