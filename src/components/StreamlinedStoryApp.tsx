import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  BookOpen,
  Film,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Image as ImageIcon,
  Clock,
  Tag,
  Hash,
  FileText,
  AlertCircle,
  Settings as SettingsIcon,
  RefreshCw,
  Trash2,
  Video,
  Mic,
} from 'lucide-react';
import { VoiceInputController } from './VoiceInputController.tsx';
import { VideoUploadAnalyzer } from './VideoUploadAnalyzer.tsx';
import type {
  StoryAnalysis,
  ImprovedStory,
  CharacterBibleEntry,
  SceneItem,
  VideoPackage,
  VideoDuration,
  TargetVideoLength,
  TargetPlatform,
} from '../types/index.ts';

interface StreamlinedStoryAppProps {
  rawStory: string;
  onRawStoryChange: (text: string) => void;
  duration: VideoDuration;
  onDurationChange: (duration: VideoDuration) => void;
  targetVideoLength: TargetVideoLength;
  onTargetVideoLengthChange: (length: TargetVideoLength) => void;
  platform?: TargetPlatform;
  onPlatformChange?: (platform: TargetPlatform) => void;
  customSceneCount?: number;
  onCustomSceneCountChange: (count: number) => void;
  customSeconds?: number;
  onCustomSecondsChange?: (sec: number) => void;
  isProcessing: boolean;
  stepMessage: string;
  errorMessage: string | null;
  onClearError: () => void;
  analysis: StoryAnalysis | null;
  improvedStory: ImprovedStory | null;
  characters: CharacterBibleEntry[];
  scenes: SceneItem[];
  videoPackage: VideoPackage | null;
  onGenerateAll: () => void;
  onAnalyzeOnly: () => void;
  voiceLanguage: string;
  onVoiceLanguageChange: (lang: string) => void;
  selectedModel: string;
  apiKey: string;
  onApiKeyChange?: (key: string) => void;
  onOpenSettings: () => void;
  onResetAll: () => void;
}

export const StreamlinedStoryApp: React.FC<StreamlinedStoryAppProps> = ({
  rawStory,
  onRawStoryChange,
  duration,
  onDurationChange,
  targetVideoLength,
  onTargetVideoLengthChange,
  platform = 'youtube',
  onPlatformChange,
  customSceneCount = 6,
  onCustomSceneCountChange,
  customSeconds = 30,
  onCustomSecondsChange,
  isProcessing,
  stepMessage,
  errorMessage,
  onClearError,
  improvedStory,
  characters,
  scenes,
  videoPackage,
  onGenerateAll,
  voiceLanguage,
  onVoiceLanguageChange,
  selectedModel,
  apiKey,
  onApiKeyChange,
  onOpenSettings,
  onResetAll,
}) => {
  // Copy state trackers
  const [copiedStory, setCopiedStory] = useState<boolean>(false);
  const [copiedGridPrompt, setCopiedGridPrompt] = useState<boolean>(false);
  const [copiedSceneNumber, setCopiedSceneNumber] = useState<number | null>(null);
  const [copiedAllScenes, setCopiedAllScenes] = useState<boolean>(false);
  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);
  const [copiedDesc, setCopiedDesc] = useState<boolean>(false);
  const [copiedTags, setCopiedTags] = useState<boolean>(false);
  const [copiedHashtags, setCopiedHashtags] = useState<boolean>(false);
  const [copiedThumbnail, setCopiedThumbnail] = useState<boolean>(false);
  const [storyLanguageTab, setStoryLanguageTab] = useState<'bengali' | 'english'>('bengali');
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'video'>('text');

  // Helper calculation for scene count
  const getCalculatedSceneCount = () => {
    if (targetVideoLength === 'custom') {
      return Math.max(1, Math.min(customSceneCount || 6, 80));
    }
    const clipSec = duration === '10s' ? 10 : 8;

    if (targetVideoLength === 'customSeconds') {
      const sec = Number(customSeconds) || 30;
      return Math.min(Math.max(1, Math.round(sec / clipSec)), 80);
    }

    if (targetVideoLength === 'auto') {
      const words = rawStory.trim().split(/\s+/).filter(Boolean).length;
      if (words <= 40) return 3; // Short story -> exactly 3 video prompts!
      if (words <= 80) return 4;
      if (words <= 140) return 5;
      if (words <= 220) return 6;
      return 8;
    }

    // Match seconds like '15s', '30s', '45s', '60s', '90s', etc.
    const secondsMatch = typeof targetVideoLength === 'string' ? targetVideoLength.match(/^(\d+)s$/) : null;
    if (secondsMatch) {
      const sec = parseInt(secondsMatch[1], 10);
      return Math.min(Math.max(1, Math.round(sec / clipSec)), 80);
    }

    const minutesMatch = typeof targetVideoLength === 'string' ? targetVideoLength.match(/^(\d+)m$/) : null;
    if (minutesMatch) {
      const min = parseInt(minutesMatch[1], 10);
      return Math.min(Math.max(1, Math.round((min * 60) / clipSec)), 80);
    }

    return duration === '10s' ? 6 : 8;
  };

  const calculatedSceneCount = getCalculatedSceneCount();

  const getTargetLengthLabel = () => {
    switch (targetVideoLength) {
      case 'auto': return `Auto (${calculatedSceneCount} Prompts)`;
      case '15s': return '15 Seconds (১৫s)';
      case '30s': return '30 Seconds (৩০s)';
      case '45s': return '45 Seconds (৪৫s)';
      case '60s': return '60 Seconds (৬০s / 1m)';
      case '90s': return '90 Seconds (৯০s / 1.5m)';
      case '120s': return '120 Seconds (১২০s / 2m)';
      case '180s': return '180 Seconds (১৮০s / 3m)';
      case '300s': return '300 Seconds (৩০০s / 5m)';
      case 'customSeconds': return `${customSeconds || 30}s Seconds (নির্দিষ্ট সেকেন্ড)`;
      case '1m': return '1 Minute (60s)';
      case '2m': return '2 Minutes (120s)';
      case '3m': return '3 Minutes (180s)';
      case '5m': return '5 Minutes (300s)';
      case '10m': return '10 Minutes (600s)';
      case 'custom': return `Custom (${customSceneCount} Prompts)`;
      default: return 'Auto';
    }
  };

  // Copy handlers
  const handleCopyText = (text: string, onSuccess: () => void) => {
    navigator.clipboard.writeText(text);
    onSuccess();
  };

  const handleCopyStory = (storyText: string) => {
    handleCopyText(storyText, () => {
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 2500);
    });
  };

  const handleCopyGridPrompt = (promptText: string) => {
    handleCopyText(promptText, () => {
      setCopiedGridPrompt(true);
      setTimeout(() => setCopiedGridPrompt(false), 2500);
    });
  };

  const getMasterGridPrompt = () => {
    if (videoPackage?.masterGridImagePrompt && videoPackage.masterGridImagePrompt.trim().length > 50) {
      return videoPackage.masterGridImagePrompt;
    }
    if (characters[0]?.masterGridImagePrompt && characters[0].masterGridImagePrompt.trim().length > 50) {
      return characters[0].masterGridImagePrompt;
    }

    const char = characters[0];
    const panelCount = Math.max(1, scenes.length > 0 ? scenes.length : 8);
    const cols = panelCount <= 4 ? 2 : panelCount <= 6 ? 3 : 4;
    const rows = Math.ceil(panelCount / cols);
    const charName = char?.name || 'Main Protagonist';
    const charIdentity = char?.lockedIdentitySummary || `${charName}, a photorealistic live-action ${char?.speciesBreed || char?.type || 'character'}, ${char?.distinctiveMarkings || 'detailed features'}, wearing ${char?.accessories || 'locked collar / accessory'}`;

    const panelDescriptions = scenes.length > 0
      ? scenes.map((s, idx) => {
          const pNum = String(idx + 1).padStart(2, '0');
          const startAct = s.actionSystem?.startState || 'Starting posture';
          const midAct = s.actionSystem?.actionMiddle || s.actionSystem?.endState || 'Action progression';
          const loc = s.usaEnvironmentDetails || s.location || 'American cinematic environment';
          const cam = s.cameraPlan?.framing || 'Cinematic shot';
          const light = s.cameraPlan?.lighting || 'Atmospheric cinematic lighting';
          const emot = s.emotion || 'Emotional tension';
          return `[Panel ${pNum} - Scene ${pNum}]: ${cam} of ${charIdentity} at ${loc}. Chronological Action: ${startAct} progressing to ${midAct}. Environment & Lighting: ${light}, weather: ${s.weather || 'ambient'}. Emotional State: ${emot}.`;
        }).join('\n\n')
      : Array.from({ length: 8 }, (_, idx) => {
          const pNum = String(idx + 1).padStart(2, '0');
          return `[Panel ${pNum} - Scene ${pNum}]: Cinematic shot of ${charIdentity} in authentic American suburban setting. Chronological action stage ${idx + 1} progression. Authentic lighting and photorealistic live-action detail.`;
        }).join('\n\n');

    return `Cinematic multi-panel storyboard contact sheet grid containing exactly ${panelCount} sequential panels (arranged in a clean ${cols}x${rows} grid layout on a single 16:9 canvas), depicting the complete chronological narrative journey of ${charIdentity} from start to finish across all ${panelCount} scenes:

${panelDescriptions}

CRITICAL STORYBOARD & CONTINUITY MANDATE:
- All ${panelCount} scenes arranged sequentially inside ONE single unified master image (clean storyboard contact sheet grid).
- 100% Character Visual Identity Lock: Identical biological anatomy, exact facial features, eye reflections, fur/skin texture, and locked accessories across all ${panelCount} panels with zero character morphing or distortion.
- Chronological narrative progression from top-left (Panel 01 - Scene 01 Beginning) to bottom-right (Panel ${String(panelCount).padStart(2, '0')} - Final Resolution).
- Unified Hollywood 35mm photorealistic live-action feature film cinematography, shot on Arri Alexa 65, Cooke 50mm Anamorphic Prime, realistic depth of field, authentic Kodak 5219 film grain, directional natural lighting, photorealistic 8k raw photograph, master film still contact sheet --ar 16:9 --style raw`.trim();
  };

  const handleCopyScene = (num: number, text: string) => {
    handleCopyText(text, () => {
      setCopiedSceneNumber(num);
      setTimeout(() => setCopiedSceneNumber(null), 2500);
    });
  };

  const handleCopyAllScenes = () => {
    const all = scenes
      .map(
        (s) =>
          `=== SCENE ${s.sceneNumber.toString().padStart(2, '0')}: ${s.sceneTitle.toUpperCase()} (${s.duration}) ===\n` +
          `PROMPT:\n${s.fullVideoPrompt}\n`
      )
      .join('\n----------------------------------------\n\n');

    handleCopyText(all, () => {
      setCopiedAllScenes(true);
      setTimeout(() => setCopiedAllScenes(false), 2500);
    });
  };

  const hasGeneratedOutputs = characters.length > 0 || scenes.length > 0 || !!videoPackage;
  const hasInput = rawStory.trim().length > 0;

  // The story narrative to display (Prioritizes Bengali story as requested: "are vai golpo to banglay thakbe")
  const displayBengaliStory = (improvedStory?.bengaliStory && improvedStory.bengaliStory.trim()) || '';
  const displayEnglishStory = (improvedStory?.fullStory && improvedStory.fullStory.trim()) || '';
  const activeStoryText = storyLanguageTab === 'bengali'
    ? (displayBengaliStory || displayEnglishStory)
    : (displayEnglishStory || displayBengaliStory);

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-300">Notification / Notice</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('gemini_api_key_custom');
                if (onApiKeyChange) onApiKeyChange('');
                onClearError();
                onGenerateAll();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow cursor-pointer"
              title="Reset any custom key and retry using system built-in AI"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry with Built-in AI</span>
            </button>
            <button
              type="button"
              onClick={onClearError}
              className="text-rose-400 hover:text-rose-200 font-bold px-2 py-1 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          1. STORY INPUT BOX
          ======================================================== */}
      <section className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider uppercase text-rose-200">
                  1. Story Input & Narrative Setup
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  Live-Action USA Narrative
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Type or speak your story below. AI crafts the narrative and creates locked character image &amp; video prompts.
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Clear Story Button inside Header */}
            {(hasInput || hasGeneratedOutputs) && (
              <button
                type="button"
                onClick={onResetAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Clear story and start fresh"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs font-bold">
              <span>🇺🇸</span>
              <span>USA Audience Base</span>
            </div>

            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
              title="Open Gemini API & Model Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-xs">Settings</span>
            </button>
          </div>
        </div>

        {/* Clean Dropdown Controls Bar */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-inner">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Platform Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform:</span>
              <select
                value={platform}
                onChange={(e) => onPlatformChange?.(e.target.value as TargetPlatform)}
                className="bg-transparent text-xs font-bold text-slate-100 cursor-pointer focus:outline-none pr-1"
                aria-label="Select Target Platform"
              >
                <option value="youtube" className="bg-slate-900 text-slate-100">
                  🔴 YouTube (16:9 • Cinema SEO • Chapters)
                </option>
                <option value="facebook" className="bg-slate-900 text-slate-100">
                  🔵 Facebook (Watch • Reels • Viral Copy)
                </option>
              </select>
            </div>

            {/* 2. Video Timer & Seconds Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus-within:border-amber-500 transition-colors shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timer (সেকেন্ড):</span>
              <select
                value={targetVideoLength}
                onChange={(e) => onTargetVideoLengthChange(e.target.value as TargetVideoLength)}
                className="bg-transparent text-xs font-bold text-slate-100 cursor-pointer focus:outline-none pr-1"
                aria-label="Select Target Video Timer Seconds"
              >
                <option value="auto" className="bg-slate-900 text-slate-100">
                  ⚡ Auto (গল্পের সাইজ অনুযায়ী ৩+ প্রম্পট / Auto Adaptive)
                </option>
                <option value="15s" className="bg-slate-900 text-slate-100">
                  15 Seconds (১৫ সেকেন্ড • ২-৩টি প্রম্পট)
                </option>
                <option value="30s" className="bg-slate-900 text-slate-100">
                  30 Seconds (৩০ সেকেন্ড • ৩টি প্রম্পট)
                </option>
                <option value="45s" className="bg-slate-900 text-slate-100">
                  45 Seconds (৪৫ সেকেন্ড • ৫টি প্রম্পট)
                </option>
                <option value="60s" className="bg-slate-900 text-slate-100">
                  60 Seconds (৬০ সেকেন্ড / ১ মিনিট • ৬টি প্রম্পট)
                </option>
                <option value="90s" className="bg-slate-900 text-slate-100">
                  90 Seconds (৯০ সেকেন্ড / ১.৫ মিনিট • ৯টি প্রম্পট)
                </option>
                <option value="120s" className="bg-slate-900 text-slate-100">
                  120 Seconds (১২০ সেকেন্ড / ২ মিনিট • ১২টি প্রম্পট)
                </option>
                <option value="180s" className="bg-slate-900 text-slate-100">
                  180 Seconds (১৮০ সেকেন্ড / ৩ মিনিট • ১৮টি প্রম্পট)
                </option>
                <option value="300s" className="bg-slate-900 text-slate-100">
                  300 Seconds (৩০০ সেকেন্ড / ৫ মিনিট • ৩০টি প্রম্পট)
                </option>
                <option value="600s" className="bg-slate-900 text-slate-100">
                  600 Seconds (৬০০ সেকেন্ড / ১০ মিনিট • ৬০টি প্রম্পট)
                </option>
                <option value="customSeconds" className="bg-slate-900 text-slate-100">
                  ⏱️ Custom Seconds (পছন্দমতো সেকেন্ড লিখুন)
                </option>
                <option value="custom" className="bg-slate-900 text-slate-100">
                  🔢 Custom Prompts (পছন্দমতো প্রম্পট সংখ্যা)
                </option>
              </select>
            </div>

            {/* Custom exact seconds input if 'customSeconds' is selected */}
            {targetVideoLength === 'customSeconds' && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/60 rounded-xl px-2 py-1 shadow-sm animate-pulse">
                <span className="text-xs text-amber-300 font-semibold">সেকেন্ড (Sec):</span>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={customSeconds}
                  onChange={(e) => onCustomSecondsChange?.(Math.max(5, Math.min(600, Number(e.target.value) || 30)))}
                  className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-white text-center font-bold focus:outline-none focus:border-amber-400"
                  aria-label="Custom Exact Seconds"
                />
              </div>
            )}

            {/* Custom scene count input if 'custom' is selected */}
            {targetVideoLength === 'custom' && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/50 rounded-xl px-2 py-1 shadow-sm">
                <span className="text-xs text-amber-300 font-semibold">Count:</span>
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={customSceneCount}
                  onChange={(e) => onCustomSceneCountChange(Math.max(1, Math.min(80, Number(e.target.value) || 1)))}
                  className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-white text-center font-bold focus:outline-none focus:border-amber-400"
                  aria-label="Custom Prompt Count"
                />
              </div>
            )}

            {/* 3. Per-Clip Duration Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus-within:border-teal-500 transition-colors shadow-sm">
              <Film className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clip:</span>
              <select
                value={duration}
                onChange={(e) => onDurationChange(e.target.value as VideoDuration)}
                className="bg-transparent text-xs font-bold text-slate-100 cursor-pointer focus:outline-none pr-1"
                aria-label="Select Duration Per Clip"
              >
                <option value="10s" className="bg-slate-900 text-slate-100">10s / Clip (Sora, Runway Gen-3)</option>
                <option value="8s" className="bg-slate-900 text-slate-100">8s / Clip (Luma, Kling)</option>
              </select>
            </div>
          </div>

          {/* Right calculation badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-xs">
              <span className="text-slate-400">Timer:</span>
              <span className="text-amber-300 font-bold">{getTargetLengthLabel()}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-300 font-mono font-bold">{calculatedSceneCount} Video Prompts</span>
            </div>
          </div>
        </div>

        {/* 1-Click Quick Seconds Presets Toolbar */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>টাইমার প্রিসেট (Seconds):</span>
          </span>
          {[
            { id: 'auto', label: '⚡ Auto' },
            { id: '15s', label: '15s (১৫ সে)' },
            { id: '30s', label: '30s (৩০ সে)' },
            { id: '45s', label: '45s (৪৫ সে)' },
            { id: '60s', label: '60s (১ মিনিট)' },
            { id: '90s', label: '90s (১.৫ মিনিট)' },
            { id: '120s', label: '120s (২ মিনিট)' },
            { id: 'customSeconds', label: '⏱️ Custom Sec' },
          ].map((pill) => {
            const isActive = targetVideoLength === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onTargetVideoLengthChange(pill.id as TargetVideoLength)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-bold'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* 3-Way Story Input Method Switcher: Text Story | Voice Input | Video Upload & Extract */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'text'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>✍️ গল্প লিখুন (Text)</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'voice'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>🎙️ ভয়েস ইনপুট (Voice)</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('video')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'video'
                  ? 'bg-teal-500 text-slate-950 border border-teal-400 shadow-md font-black'
                  : 'bg-teal-950/50 hover:bg-teal-900/60 text-teal-300 border border-teal-800/60 hover:border-teal-600'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>📹 ভিডিও আপলোড ও সারাংশ (Video Upload)</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  inputMode === 'video'
                    ? 'bg-slate-900 text-teal-300'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                }`}
              >
                নতুন
              </span>
            </button>
          </div>

          {inputMode !== 'video' && (
            <button
              type="button"
              onClick={() => setInputMode('video')}
              className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-semibold cursor-pointer px-2 py-1 rounded-md hover:bg-teal-950/40 transition"
              title="ভিডিও আপলোড করে এআই দিয়ে সারাংশ ও গল্প তৈরি করুন"
            >
              <Video className="w-3.5 h-3.5" />
              <span>ভিডিও থেকে সারাংশ বের করবেন? ক্লিক করুন ➜</span>
            </button>
          )}
        </div>

        {/* Voice Mode Intelligence Guidance Badge */}
        {inputMode === 'voice' && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 shadow-sm animate-fadeIn">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm shrink-0">🎙️</span>
            <div>
              <span className="font-bold text-emerald-300 block text-xs">
                প্রফেশনাল ভয়েস এআই সক্রিয় (Professional Voice Intelligence Active):
              </span>
              <span className="text-[11px] text-slate-300 leading-relaxed">
                কথা বলার সময় উচ্চারণ বা বক্তব্য একটু এলোমেলো হলেও চিন্তা নেই—Gemini AI নিখুঁতভাবে আপনার মনের ভাব বুঝে সুন্দর গল্পে রূপান্তর করবে।
              </span>
            </div>
          </div>
        )}

        {/* Video Upload & Story Extraction Panel (Rendered when video mode is active) */}
        {inputMode === 'video' && (
          <div className="mt-3">
            <VideoUploadAnalyzer
              onStoryExtracted={(storyText) => {
                onRawStoryChange(storyText);
              }}
              onGenerateAllPrompts={onGenerateAll}
              selectedModel={selectedModel}
              apiKey={apiKey}
              disabled={isProcessing}
            />
          </div>
        )}

        {/* Voice & Samples Toolbar (Rendered in text or voice mode) */}
        {inputMode !== 'video' && (
          <div className="mt-3">
            <VoiceInputController
              currentStoryText={rawStory}
              onUpdateStoryText={onRawStoryChange}
              voiceLanguage={voiceLanguage}
              onVoiceLanguageChange={onVoiceLanguageChange}
              selectedModel={selectedModel}
              apiKey={apiKey}
              disabled={isProcessing}
            />
          </div>
        )}

        {/* Story Textarea (Always accessible with contextual header in video mode) */}
        <div className="mt-3 relative">
          {inputMode === 'video' && (
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>ভিডিও থেকে প্রাপ্ত ও এডিটযোগ্য গল্প (Extracted Story Narrative):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {rawStory.length} characters • {rawStory.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          )}
          <textarea
            rows={inputMode === 'video' ? 4 : 5}
            placeholder={
              inputMode === 'video'
                ? "ভিডিও আপলোড করলে তার সারাংশ ও সম্পূর্ণ গল্প স্বয়ংক্রিয়ভাবে এখানে চলে আসবে। আপনি চাইলে যেকোনো লাইন পরিবর্তন বা যোগ করতে পারেন..."
                : "এখানে বাংলা, বাংলিশ বা ইংরেজিতে আপনার গল্প লিখুন, অথবা উপরের 'ভয়েস ইনপুট' বা 'ভিডিও আপলোড' ব্যবহার করুন... (Write or dictate your story in Bengali, Banglish, or English...)"
            }
            value={rawStory}
            onChange={(e) => onRawStoryChange(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 focus:outline-none resize-y leading-relaxed font-sans shadow-inner disabled:opacity-50"
          />
          {inputMode !== 'video' && (
            <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-mono bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
              {rawStory.length} characters • {rawStory.split(/\s+/).filter(Boolean).length} words
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          ACTION BUTTONS BAR: GENERATE & PROMINENT CLEAR BUTTON
          "cliar button akta set atatey click korley agey ja toiri korci sob cole jabe clicn page asbe abar genareayte kora jabe"
          ======================================================== */}
      <section className="flex flex-col sm:flex-row items-center justify-center gap-3 py-2">
        {/* Main Generate Button */}
        <button
          type="button"
          onClick={onGenerateAll}
          disabled={!rawStory.trim() || isProcessing}
          className="w-full sm:w-auto min-w-[340px] flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 hover:from-amber-300 hover:via-rose-400 hover:to-indigo-500 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-2xl shadow-rose-950/50 active:scale-95 disabled:opacity-50 cursor-pointer ring-2 ring-amber-400/50"
          title="Generate character image prompt and all video prompts in one click"
        >
          <Zap className="w-5 h-5 fill-slate-950 text-slate-950 animate-bounce" />
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-black tracking-wide leading-tight">
              🎬 GENERATE ALL PROMPTS
            </span>
            <span className="text-[10px] font-bold text-slate-900 opacity-90 font-mono">
              1 Master Grid Image Prompt • {calculatedSceneCount} Video Prompts • Complete Metadata
            </span>
          </div>
        </button>

        {/* Prominent Clear / Reset Button - Always available to give a 100% clean page */}
        <button
          type="button"
          onClick={onResetAll}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 font-bold text-xs uppercase tracking-wider border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer active:scale-95 shadow-lg"
          title="Clear all inputs and results to start fresh with a clean page"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>Clear All (Clean Page)</span>
        </button>
      </section>

      {/* Ongoing processing banner */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/50 flex items-center gap-3.5 animate-pulse shadow-xl">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
          <div className="text-xs text-indigo-200">
            <span className="font-bold text-indigo-300 block text-sm">
              {stepMessage || 'Processing cinematic pipeline with Gemini AI...'}
            </span>
            <span className="text-[11px] text-slate-400">
              Structuring cinematic live-action story, multi-panel storyboard grid, and sequential video prompts. Please wait...
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          2. MASTER CINEMATIC STORY SCRIPT (BENGALI NARRATIVE)
          "are vai golpo to banglay thakbe"
          "ei golpo ti ami banglishey likheci app oota jetuleici oi tkuki agey banlatery sajai likhbey"
          ======================================================== */}
      <section className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold tracking-wider uppercase text-indigo-200">
                  ২. বাংলায় বিস্তারিত সাজানো গল্প ও মূল সারাংশ (Detailed Story &amp; Core Essence)
                </h3>
                {activeStoryText && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold">
                    {activeStoryText.trim().split(/\s+/).filter(Boolean).length} শব্দ • {storyLanguageTab === 'bengali' ? 'বাংলা লিপি ও মূল সারাংশ ✓' : 'English Screenplay ✓'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                আপনার দেওয়া গল্প থেকে বিশদ ও আবেগঘন বিস্তারিত বিবরণ এবং স্পষ্ট মূল সারাংশ (Core Summary &amp; Moral Essence)।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Bengali / English View Switcher Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStoryLanguageTab('bengali')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  storyLanguageTab === 'bengali'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="বাংলায় সাজানো গল্প দেখুন"
              >
                <span>🇧🇩 বাংলা গল্প</span>
              </button>
              <button
                type="button"
                onClick={() => setStoryLanguageTab('english')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  storyLanguageTab === 'english'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View English Screenplay version"
              >
                <span>🇺🇸 English</span>
              </button>
            </div>

            {activeStoryText && (
              <button
                type="button"
                onClick={() => handleCopyStory(activeStoryText)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wider transition-all cursor-pointer active:scale-95 shadow shrink-0"
              >
                {copiedStory ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-indigo-200" />
                    <span>গল্প কপি হয়েছে! ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Story (গল্প কপি)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {activeStoryText ? (
          <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-slate-800/90 text-slate-100 text-sm leading-relaxed whitespace-pre-line font-sans shadow-inner select-all">
            {activeStoryText}
          </div>
        ) : (
          <div className="mt-4 p-5 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 text-center">
            <Sparkles className="w-5 h-5 text-indigo-400 mx-auto mb-1.5 opacity-80" />
            <p className="text-xs text-slate-300 font-medium">
              আপনার গল্প বাংলিশ, বাংলা বা ইংরেজিতে লিখে উপরে <strong className="text-amber-400 font-bold">&quot;GENERATE ALL PROMPTS&quot;</strong> বাটনে ক্লিক করলেই এআই গল্পটিকে সুন্দর বাংলায় সাজিয়ে এখানে লিখবে।
            </p>
          </div>
        )}
      </section>

      {/* ========================================================
          3. MASTER GRID IMAGE PROMPT BOX (Single Image with all scene panels)
          1 Image with all scenes chronologically arranged
          ======================================================== */}
      {(characters.length > 0 || scenes.length > 0) && (
        <section className="bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-wider uppercase text-emerald-300">
                    3. Master Multi-Panel Storyboard Grid Prompt (Single Image)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                    All {scenes.length || 8} Scene Panels inside 1 Master Image ✓
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Generate this single prompt in Midjourney or Flux to produce one 16:9 contact-sheet image containing all {scenes.length || 8} chronological scenes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyGridPrompt(getMasterGridPrompt())}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider uppercase transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-950/50 shrink-0"
            >
              {copiedGridPrompt ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Copied! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Master Image Prompt</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-300 font-mono">
                    MASTER {scenes.length || 8}-PANEL STORYBOARD GRID PROMPT
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                    {getMasterGridPrompt().trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 hidden sm:inline-block font-mono">
                  Panel 01 (Opening) to Panel {String(scenes.length || 8).padStart(2, '0')} (Resolution)
                </span>
              </div>

              {/* Clean Prompt Box - ONLY PROMPT */}
              <div className="p-4 bg-slate-900 border border-emerald-900/40 rounded-xl text-xs text-emerald-100 font-mono leading-relaxed select-all max-h-[380px] overflow-y-auto whitespace-pre-wrap">
                {getMasterGridPrompt()}
              </div>

              {/* Informative usage tip in clear English */}
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-300/90 leading-relaxed flex items-start gap-2">
                <span className="text-base leading-none">💡</span>
                <span>
                  <strong>How to Use:</strong> Click the button above to copy this prompt, then paste into <strong>Midjourney (v6/v7)</strong> or <strong>Flux</strong>. It generates all <strong>{scenes.length || 8} sequential panels</strong> on a single 16:9 canvas. Using this single image anchor locks your character&apos;s face, markings, and environment across every video clip with 100% visual continuity!
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          4. VIDEO PROMPT BOXES (Scene by Scene)
          ======================================================== */}
      {scenes.length > 0 && (
        <section className="bg-slate-900/95 border border-rose-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-wider uppercase text-rose-200">
                    4. Sequential Video Generation Prompts (Scene-by-Scene)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold font-mono">
                    {scenes.length} Video Prompts
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Individual prompts optimized for Sora, Runway Gen-3, Luma Dream Machine, or Kling AI.
                </p>
              </div>
            </div>

            {/* Copy All Prompts Button */}
            <button
              type="button"
              onClick={handleCopyAllScenes}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer active:scale-95 shadow self-start sm:self-auto"
            >
              {copiedAllScenes ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">All Prompts Copied! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy All Scene Prompts</span>
                </>
              )}
            </button>
          </div>

          {/* Sequential Video Prompt Boxes */}
          <div className="mt-4 space-y-3.5">
            {scenes.map((scene) => {
              const isCopied = copiedSceneNumber === scene.sceneNumber;
              return (
                <div
                  key={scene.sceneNumber}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 transition-colors shadow-lg space-y-2.5"
                >
                  {/* Scene Title + Copy Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono font-black">
                        SCENE {scene.sceneNumber.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-rose-300/80 font-mono px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/60 font-semibold">
                        {scene.fullVideoPrompt.trim().split(/\s+/).filter(Boolean).length} words • Ultra-detailed
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyScene(scene.sceneNumber, scene.fullVideoPrompt)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold tracking-wider uppercase transition-all cursor-pointer active:scale-95 shadow"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-rose-200" />
                          <span>Scene {scene.sceneNumber} Copied! ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Scene {scene.sceneNumber}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Clean Video Prompt Box */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono leading-relaxed select-all">
                    {scene.fullVideoPrompt}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          5. RELEASE SUITE (YouTube or Facebook Package)
          ======================================================== */}
      {videoPackage && (() => {
        const isFB = (videoPackage.platform || platform) === 'facebook';
        const displayDescription = isFB
          ? (videoPackage.facebookPostCopy || videoPackage.seoDescription)
          : videoPackage.seoDescription;

        return (
          <section className={`bg-slate-900/95 border ${isFB ? 'border-blue-500/50' : 'border-amber-500/40'} rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 ${isFB ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'} border rounded-xl shrink-0`}>
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold tracking-wider uppercase ${isFB ? 'text-blue-200' : 'text-amber-200'}`}>
                      {isFB
                        ? '5. Facebook Viral Release Suite (Watch, Reels & Feed)'
                        : '5. YouTube Master Cinematic Suite (16:9 Cinema & SEO)'}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isFB
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {isFB ? '🔵 Facebook Watch & Feed Ready • 20-25 Tags' : '🔴 YouTube 16:9 Cinema Ready • 20-25 Tags'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFB
                      ? 'High-conversion viral headlines, engaging post copy with emojis, and targeted interest keywords for American Facebook audiences.'
                      : 'High-retention SEO description, chapter timestamps, clickable titles, and search tags for American YouTube audiences.'}
                  </p>
                </div>
              </div>

              {/* Platform indicator */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Mode:</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  isFB
                    ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                }`}>
                  {isFB ? '🔵 Facebook Mode' : '🔴 YouTube Mode'}
                </span>
              </div>
            </div>

            {/* BOX 1: TITLE / HEADLINES BOX */}
            <div className={`p-4 rounded-xl bg-slate-950 border ${isFB ? 'border-blue-500/40' : 'border-indigo-500/40'} shadow-lg space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${isFB ? 'text-blue-400' : 'text-indigo-400'}`} />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isFB ? 'text-blue-300' : 'text-indigo-300'}`}>
                    {isFB
                      ? '📌 Facebook Viral Headlines (Scroll-Stopping Hooks)'
                      : '📌 YouTube Video Titles (High CTR Hooks - 3 Categories)'}
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isFB ? 'Viral Mobile CTR' : 'High CTR 16:9 Titles'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {videoPackage.suggestedTitles.map((t, idx) => {
                  const isCopied = copiedTitleIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 text-xs hover:border-indigo-500/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                              t.category === 'Cinematic'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : t.category.includes('CTR')
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {t.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {t.title.trim().split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>
                        <p className="text-slate-100 font-bold text-sm leading-snug">{t.title}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleCopyText(t.title, () => {
                            setCopiedTitleIndex(idx);
                            setTimeout(() => setCopiedTitleIndex(null), 2500);
                          });
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg ${
                          isFB ? 'bg-blue-600 hover:bg-blue-500' : 'bg-indigo-600 hover:bg-indigo-500'
                        } text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Copied! ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isFB ? 'Copy Headline' : 'Copy Title'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOX 2: BIG DESCRIPTION / POST COPY BOX */}
            <div className={`bg-slate-950 border ${isFB ? 'border-blue-500/40' : 'border-amber-500/40'} rounded-xl p-4.5 space-y-3 shadow-lg`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isFB ? 'text-blue-400' : 'text-amber-400'}`} />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isFB ? 'text-blue-300' : 'text-amber-300'}`}>
                    {isFB
                      ? '📝 Facebook Viral Post Copy (Detailed Post Text)'
                      : '📝 YouTube SEO Description (With Synopsis & Chapter Timestamps)'}
                  </h4>
                  <span className="text-[10px] text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 font-bold">
                    {displayDescription.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyText(displayDescription, () => {
                      setCopiedDesc(true);
                      setTimeout(() => setCopiedDesc(false), 2500);
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${
                    isFB ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-600 hover:bg-amber-500'
                  } text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm`}
                >
                  {copiedDesc ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-200" />
                      <span>{isFB ? 'Post Copy Copied! ✓' : 'Description Copied! ✓'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isFB ? 'Copy Facebook Post' : 'Copy Description'}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto p-4 bg-slate-900 border border-slate-800 rounded-lg select-all">
                {displayDescription}
              </div>
            </div>

            {/* BOX 3: TAGS & HASHTAGS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* TAGS BOX */}
              <div className={`bg-slate-950 border ${isFB ? 'border-blue-500/40' : 'border-teal-500/40'} rounded-xl p-4.5 space-y-3 flex flex-col justify-between shadow-lg`}>
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className={`w-4 h-4 ${isFB ? 'text-blue-400' : 'text-teal-400'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isFB ? 'text-blue-300' : 'text-teal-300'}`}>
                        {isFB
                          ? `🏷️ Facebook Interest Keywords (${videoPackage.tags.length} Tags)`
                          : `🏷️ YouTube Search Tags (${videoPackage.tags.length} Tags)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyText(videoPackage.tags.join(', '), () => {
                          setCopiedTags(true);
                          setTimeout(() => setCopiedTags(false), 2500);
                        });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                        isFB ? 'bg-blue-600 hover:bg-blue-500' : 'bg-teal-600 hover:bg-teal-500'
                      } text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm`}
                    >
                      {copiedTags ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-teal-200" />
                          <span>All {videoPackage.tags.length} Tags Copied! ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy All {videoPackage.tags.length} Tags</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono select-all break-words leading-relaxed max-h-48 overflow-y-auto">
                    {videoPackage.tags.join(', ')}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {isFB
                    ? 'Comma-separated keywords ready to paste directly into Meta Business Suite or Facebook post tags.'
                    : 'Comma-separated format ready to paste directly into the YouTube Studio Tags box.'}
                </p>
              </div>

              {/* HASHTAGS BOX */}
              <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4.5 space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                        {isFB
                          ? `#️⃣ Facebook Trending Hashtags (${videoPackage.hashtags.length} Hashtags)`
                          : `#️⃣ YouTube Viral Hashtags (${videoPackage.hashtags.length} Hashtags)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyText(videoPackage.hashtags.join(' '), () => {
                          setCopiedHashtags(true);
                          setTimeout(() => setCopiedHashtags(false), 2500);
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      {copiedHashtags ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-cyan-200" />
                          <span>All {videoPackage.hashtags.length} Hashtags Copied! ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy All {videoPackage.hashtags.length} Hashtags</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                    {videoPackage.hashtags.map((h, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 text-xs font-mono font-medium"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {isFB
                    ? 'Trending hashtags for maximum organic reach across Facebook Watch, Reels, and News Feed.'
                    : 'High-velocity hashtags for YouTube description and Shorts.'}
                </p>
              </div>
            </div>

            {/* BOX 4: MASTER THUMBNAIL / COVER PROMPT */}
            <div className={`p-4 rounded-xl bg-slate-950 border ${isFB ? 'border-blue-500/40' : 'border-rose-500/40'} shadow-lg space-y-2.5`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ImageIcon className={`w-4 h-4 ${isFB ? 'text-blue-400' : 'text-rose-400'}`} />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isFB ? 'text-blue-300' : 'text-rose-300'}`}>
                    {isFB
                      ? '🎨 Facebook Video Cover Art Prompt (Master 16:9 Prompt)'
                      : '🎨 Master 16:9 YouTube Thumbnail Prompt (Cinematic Composition)'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyText(videoPackage.masterThumbnailPrompt, () => {
                      setCopiedThumbnail(true);
                      setTimeout(() => setCopiedThumbnail(false), 2500);
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${
                    isFB ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'
                  } text-white text-xs font-bold tracking-wider transition-all cursor-pointer active:scale-95 shadow`}
                >
                  {copiedThumbnail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-rose-200" />
                      <span>Copied! ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isFB ? 'Copy Facebook Cover Prompt' : 'Copy Thumbnail Prompt'}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-rose-100 font-mono leading-relaxed bg-rose-950/20 p-3 rounded-lg border border-rose-900/40 select-all">
                {videoPackage.masterThumbnailPrompt}
              </p>
              <p className="text-[11px] text-slate-400">
                {isFB
                  ? 'Generate in Midjourney or Flux (optimized for Facebook feed CTR).'
                  : <>Use in Midjourney (v6/v7) with <code className="text-rose-300 font-mono">--ar 16:9 --style raw</code> for maximum YouTube CTR.</>}
              </p>
            </div>
          </section>
        );
      })()}
    </div>
  );
};
