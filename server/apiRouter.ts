import express from 'express';
import type { Request, Response } from 'express';
import {
  cleanApiKey,
  testConnection,
  listAvailableModels,
  analyzeStory,
  improveStory,
  generateCharacterBible,
  generateScenes,
  generateFinalPackage,
  formatSpokenStory,
  fastGenerateCinematicSuite,
  analyzeVideoStory,
  transcribeAudioVoice,
} from './geminiService.ts';
import type { VideoDuration } from '../src/types/index.ts';

export const apiRouter = express.Router();

function getApiKeyFromReq(req: Request): string | undefined {
  const headerKey = req.headers['x-gemini-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    const cleaned = cleanApiKey(headerKey);
    if (cleaned) return cleaned;
  }
  if (req.body && typeof req.body.apiKey === 'string' && req.body.apiKey.trim()) {
    const cleaned = cleanApiKey(req.body.apiKey);
    if (cleaned) return cleaned;
  }
  return cleanApiKey(process.env.GEMINI_API_KEY);
}

function formatApiErrorMessage(error: any, fallbackMessage: string): string {
  if (!error) return fallbackMessage;
  const raw = typeof error === 'string' ? error : error?.message || String(error);

  if (raw.includes('Empty response text')) {
    return 'The AI model returned an empty response. The resilience engine has recovered; please click Generate again.';
  }
  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
    return 'The AI server is experiencing temporary high demand. Please try again in a few moments or switch to a different model in Settings.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API temporary rate limit reached. Please wait a moment or try another model in Settings.';
  }
  if (
    raw.includes('API_KEY_INVALID') ||
    raw.includes('401') ||
    raw.includes('403') ||
    raw.includes('API key not valid') ||
    raw.includes('INVALID_ARGUMENT')
  ) {
    return 'The custom API Key is invalid or expired. If you do not have a custom key, click "Use Built-in AI" in Settings.';
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
    const rawCustom = req.body?.apiKey || req.headers['x-gemini-api-key'];
    const apiKey = typeof rawCustom === 'string' ? cleanApiKey(rawCustom) : undefined;
    const model = req.body?.model || 'gemini-3.8-flash';
    const result = await testConnection(apiKey, model);
    // Always return clean JSON payload (HTTP 200) to ensure client JSON parsing never encounters unexpected end of input
    res.json(result);
  } catch (error: any) {
    console.error('API Test Error:', error);
    res.json({
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

function calculateSceneCount(
  duration: VideoDuration,
  sceneCount?: any,
  targetVideoLength?: string,
  rawStory?: string,
  customSeconds?: any
): number {
  if (sceneCount && Number(sceneCount) > 0) {
    return Math.min(Math.max(1, Number(sceneCount)), 80);
  }
  const clipSec = duration === '10s' ? 10 : 8;

  // If custom exact seconds provided
  if ((targetVideoLength === 'customSeconds' || targetVideoLength === 'custom') && customSeconds && Number(customSeconds) > 0) {
    return Math.min(Math.max(1, Math.round(Number(customSeconds) / clipSec)), 80);
  }

  // If format is like '15s', '30s', '45s', '60s', '90s', etc.
  const secondsMatch = typeof targetVideoLength === 'string' ? targetVideoLength.match(/^(\d+)s$/) : null;
  if (secondsMatch) {
    const sec = parseInt(secondsMatch[1], 10);
    return Math.min(Math.max(1, Math.round(sec / clipSec)), 80);
  }

  // If format is like '1m', '2m', '3m', '5m', '10m'
  const minutesMatch = typeof targetVideoLength === 'string' ? targetVideoLength.match(/^(\d+)m$/) : null;
  if (minutesMatch) {
    const min = parseInt(minutesMatch[1], 10);
    return Math.min(Math.max(1, Math.round((min * 60) / clipSec)), 80);
  }

  // If user selected 'auto' or didn't set length, dynamically adapt to story length
  // e.g., "atutku golper jonney jodi 3 ta video prompt lage 3 tay dibe"
  if (targetVideoLength === 'auto' || !targetVideoLength) {
    if (rawStory && typeof rawStory === 'string') {
      const words = rawStory.trim().split(/\s+/).filter(Boolean).length;
      if (words <= 40) {
        return 3; // Short story -> exactly 3 video prompts!
      } else if (words <= 80) {
        return 4;
      } else if (words <= 140) {
        return 5;
      } else if (words <= 220) {
        return 6;
      } else {
        return 8;
      }
    }
    return 3;
  }

  return duration === '10s' ? 6 : 8;
}

// 6. Generate Scenes
apiRouter.post('/generate-scenes', async (req: Request, res: Response) => {
  try {
    const { improvedStory, characters, duration, sceneCount, targetVideoLength, model, rawStory, customSeconds } = req.body;
    if (!improvedStory || !characters || !Array.isArray(characters)) {
      return res.status(400).json({ success: false, error: 'Improved story and character bible are required.' });
    }
    const dur: VideoDuration = duration === '10s' ? '10s' : '8s';
    const computedSceneCount = calculateSceneCount(
      dur,
      sceneCount,
      targetVideoLength,
      rawStory || improvedStory?.fullStory || improvedStory?.bengaliStory,
      customSeconds
    );
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
    const { rawStory, duration, sceneCount, targetVideoLength, customSeconds, model, platform } = req.body;
    if (!rawStory || typeof rawStory !== 'string' || !rawStory.trim()) {
      return res.status(400).json({ success: false, error: 'Raw story content is required.' });
    }

    const apiKey = getApiKeyFromReq(req);
    const dur: VideoDuration = duration === '10s' ? '10s' : '8s';
    const computedSceneCount = calculateSceneCount(dur, sceneCount, targetVideoLength, rawStory, customSeconds);
    const selectedModel = model || 'gemini-3.8-flash';
    const targetPlatform = platform === 'facebook' ? 'facebook' : 'youtube';

    const result = await fastGenerateCinematicSuite(
      rawStory,
      dur,
      computedSceneCount,
      selectedModel,
      apiKey,
      targetPlatform,
      customSeconds
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
    const { rawStory, duration, sceneCount, targetVideoLength, customSeconds, model, platform } = req.body;
    if (!rawStory || typeof rawStory !== 'string' || !rawStory.trim()) {
      return res.status(400).json({ success: false, error: 'Raw story content is required.' });
    }

    const apiKey = getApiKeyFromReq(req);
    const dur: VideoDuration = duration === '10s' ? '10s' : '8s';
    const computedSceneCount = calculateSceneCount(dur, sceneCount, targetVideoLength, rawStory, customSeconds);
    const selectedModel = model || 'gemini-3.8-flash';
    const targetPlatform = platform === 'facebook' ? 'facebook' : 'youtube';

    // Execute ultra-fast single pass to avoid multi-request timeouts and 503 latency
    const result = await fastGenerateCinematicSuite(
      rawStory,
      dur,
      computedSceneCount,
      selectedModel,
      apiKey,
      targetPlatform,
      customSeconds
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

// 10. Analyze Video Footage & Extract Narrative Story with Summary
apiRouter.post('/analyze-video', async (req: Request, res: Response) => {
  try {
    const { videoBase64, mimeType, keyframes, fileName, model } = req.body;
    if (!videoBase64 && (!Array.isArray(keyframes) || keyframes.length === 0)) {
      return res.status(400).json({ success: false, error: 'Video file or video keyframes are required.' });
    }
    const apiKey = getApiKeyFromReq(req);
    const result = await analyzeVideoStory(
      { videoBase64, mimeType, keyframes, fileName },
      model || 'gemini-3.8-flash',
      apiKey
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Video Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to analyze video story.'),
    });
  }
});

// 11. Transcribe & Professionally Correct Spoken Audio (Bengali, Banglish, English)
apiRouter.post('/transcribe-voice', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, languagePreference, model } = req.body;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'Audio data is required.' });
    }
    const apiKey = getApiKeyFromReq(req);
    const result = await transcribeAudioVoice(
      audioBase64,
      mimeType || 'audio/webm',
      languagePreference || 'auto',
      model || 'gemini-3.8-flash',
      apiKey
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Audio Transcription Error:', error);
    res.status(500).json({
      success: false,
      error: formatApiErrorMessage(error, 'Failed to transcribe voice recording.'),
    });
  }
});

