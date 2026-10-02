import type {
  StoryAnalysis,
  ImprovedStory,
  CharacterBibleEntry,
  SceneItem,
  VideoPackage,
  VideoDuration,
  TargetPlatform,
} from '../types/index.ts';

function getHeaders(customApiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customApiKey && customApiKey.trim()) {
    const sanitized = customApiKey.trim().replace(/[\r\n\t]/g, '');
    if (sanitized) {
      headers['x-gemini-api-key'] = sanitized;
    }
  }
  return headers;
}

async function safeParseResponse(res: Response, fallbackErrMsg: string): Promise<any> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    throw new Error('Network error or connection lost. Please try again.');
  }

  if (!text || !text.trim()) {
    throw new Error(`Server returned an empty response (HTTP ${res.status}). Please try again.`);
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid response received from server (HTTP ${res.status}).`);
  }

  if (!res.ok || (data && data.success === false)) {
    throw new Error(data?.error || fallbackErrMsg);
  }

  return data;
}

export async function testGeminiApiKey(apiKey?: string, model = 'gemini-3.8-flash'): Promise<{ success: boolean; message: string }> {
  const cleanKey = apiKey ? apiKey.trim().replace(/['";\r\n\t\s]/g, '') : undefined;
  const res = await fetch('/api/gemini/test', {
    method: 'POST',
    headers: getHeaders(cleanKey),
    body: JSON.stringify({ apiKey: cleanKey, model }),
  });

  const data = await safeParseResponse(res, 'Failed to connect to Gemini API. Check your key.');
  return { success: true, message: data.message || '✓ Gemini API Connected' };
}

export async function fetchAvailableModels(apiKey?: string) {
  const res = await fetch('/api/gemini/models', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({}),
  });
  const data = await safeParseResponse(res, 'Failed to fetch models.');
  return data.models as Array<{ id: string; name: string; description: string; isDefault: boolean }>;
}

export async function apiAnalyzeStory(
  rawStory: string,
  model = 'gemini-3.8-flash',
  apiKey?: string
): Promise<StoryAnalysis> {
  const res = await fetch('/api/gemini/analyze-story', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ rawStory, model }),
  });
  const data = await safeParseResponse(res, 'Failed to analyze story.');
  return data.analysis as StoryAnalysis;
}

export async function apiImproveStory(
  rawStory: string,
  analysis: StoryAnalysis,
  model = 'gemini-3.8-flash',
  apiKey?: string
): Promise<ImprovedStory> {
  const res = await fetch('/api/gemini/improve-story', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ rawStory, analysis, model }),
  });
  const data = await safeParseResponse(res, 'Failed to generate improved story.');
  return data.improvedStory as ImprovedStory;
}

export async function apiGenerateCharacters(
  improvedStoryText: string,
  analysis: StoryAnalysis,
  model = 'gemini-3.8-flash',
  apiKey?: string
): Promise<CharacterBibleEntry[]> {
  const res = await fetch('/api/gemini/generate-characters', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ improvedStoryText, analysis, model }),
  });
  const data = await safeParseResponse(res, 'Failed to generate character bible.');
  return data.characters as CharacterBibleEntry[];
}

export async function apiGenerateScenes(
  improvedStory: ImprovedStory,
  characters: CharacterBibleEntry[],
  duration: VideoDuration,
  sceneCount?: number,
  targetVideoLength?: string,
  model = 'gemini-3.8-flash',
  apiKey?: string
): Promise<SceneItem[]> {
  const res = await fetch('/api/gemini/generate-scenes', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ improvedStory, characters, duration, sceneCount, targetVideoLength, model }),
  });
  const data = await safeParseResponse(res, 'Failed to generate scene breakdown.');
  return data.scenes as SceneItem[];
}

export async function apiGeneratePackage(
  improvedStory: ImprovedStory,
  scenes: SceneItem[],
  characters: CharacterBibleEntry[],
  model = 'gemini-3.8-flash',
  apiKey?: string,
  platform: TargetPlatform = 'youtube'
): Promise<VideoPackage> {
  const res = await fetch('/api/gemini/generate-package', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ improvedStory, scenes, characters, model, platform }),
  });
  const data = await safeParseResponse(res, 'Failed to generate final release package.');
  return data.videoPackage as VideoPackage;
}

export async function apiFastGenerate(
  rawStory: string,
  duration: VideoDuration,
  sceneCount?: number,
  targetVideoLength?: string,
  model = 'gemini-3.8-flash',
  apiKey?: string,
  platform: TargetPlatform = 'youtube',
  customSeconds?: number
): Promise<{
  analysis: StoryAnalysis;
  improvedStory: ImprovedStory;
  characters: CharacterBibleEntry[];
  scenes: SceneItem[];
  videoPackage: VideoPackage;
}> {
  const res = await fetch('/api/gemini/fast-generate', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ rawStory, duration, sceneCount, targetVideoLength, model, platform, customSeconds }),
  });
  const data = await safeParseResponse(res, 'Failed to generate character and video prompts.');
  return {
    analysis: data.analysis,
    improvedStory: data.improvedStory,
    characters: data.characters,
    scenes: data.scenes,
    videoPackage: data.videoPackage,
  };
}

export async function apiRunFullPipeline(
  rawStory: string,
  duration: VideoDuration,
  sceneCount?: number,
  targetVideoLength?: string,
  model = 'gemini-3.8-flash',
  apiKey?: string,
  platform: TargetPlatform = 'youtube',
  customSeconds?: number
): Promise<{
  analysis: StoryAnalysis;
  improvedStory: ImprovedStory;
  characters: CharacterBibleEntry[];
  scenes: SceneItem[];
  videoPackage: VideoPackage;
}> {
  const res = await fetch('/api/gemini/full-pipeline', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ rawStory, duration, sceneCount, targetVideoLength, model, platform, customSeconds }),
  });
  const data = await safeParseResponse(res, 'Failed to execute story pipeline.');
  return {
    analysis: data.analysis,
    improvedStory: data.improvedStory,
    characters: data.characters,
    scenes: data.scenes,
    videoPackage: data.videoPackage,
  };
}

export async function apiFormatVoiceTranscript(
  transcript: string,
  languagePreference: 'auto' | 'bn' | 'banglish' | 'en' = 'auto',
  model = 'gemini-3.8-flash',
  apiKey?: string
): Promise<{
  formattedText: string;
  detectedLanguage: string;
  summary: string;
}> {
  const res = await fetch('/api/gemini/format-voice', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ transcript, languagePreference, model }),
  });
  const data = await safeParseResponse(res, 'Failed to format voice transcript.');
  return {
    formattedText: data.formattedText,
    detectedLanguage: data.detectedLanguage,
    summary: data.summary,
  };
}

export interface VideoStoryExtraction {
  summary: string;
  bengaliStory: string;
  fullStory: string;
  identifiedCharacters: string[];
  setting: string;
  keyEvents: string[];
  suggestedPromptTheme: string;
}

export async function apiAnalyzeVideo(
  videoPayload: {
    videoBase64?: string;
    mimeType?: string;
    keyframes?: string[];
    fileName?: string;
  },
  model = 'gemini-3.8-flash',
  apiKey?: string
): Promise<VideoStoryExtraction> {
  const res = await fetch('/api/gemini/analyze-video', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ ...videoPayload, model }),
  });
  const data = await safeParseResponse(res, 'Failed to analyze video and extract story.');
  return {
    summary: data.summary,
    bengaliStory: data.bengaliStory,
    fullStory: data.fullStory,
    identifiedCharacters: data.identifiedCharacters || [],
    setting: data.setting || '',
    keyEvents: data.keyEvents || [],
    suggestedPromptTheme: data.suggestedPromptTheme || '',
  };
}

export interface VoiceTranscriptionResponse {
  rawTranscript: string;
  polishedStory: string;
  summary: string;
  detectedLanguage: string;
}

export async function apiTranscribeVoiceAudio(
  audioBase64: string,
  mimeType = 'audio/webm',
  languagePreference: 'auto' | 'bn' | 'banglish' | 'en' = 'auto',
  model = 'gemini-3.8-flash',
  apiKey?: string
): Promise<VoiceTranscriptionResponse> {
  const res = await fetch('/api/gemini/transcribe-voice', {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ audioBase64, mimeType, languagePreference, model }),
  });
  const data = await safeParseResponse(res, 'Failed to transcribe and correct voice recording.');
  return {
    rawTranscript: data.rawTranscript || '',
    polishedStory: data.polishedStory || data.rawTranscript || '',
    summary: data.summary || '',
    detectedLanguage: data.detectedLanguage || 'Bengali',
  };
}


