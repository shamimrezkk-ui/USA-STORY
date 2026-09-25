import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  Clock,
  Film,
  Zap,
  Copy,
  Check,
  RotateCcw,
  Settings as SettingsIcon,
  Tag,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  BookOpen,
  Hash,
  RefreshCw
} from 'lucide-react';
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
import { VoiceInputController } from './VoiceInputController.tsx';

interface StreamlinedStoryAppProps {
  rawStory: string;
  onRawStoryChange: (story: string) => void;
  duration: VideoDuration;
  onDurationChange: (duration: VideoDuration) => void;
  targetVideoLength: TargetVideoLength;
  onTargetVideoLengthChange: (length: TargetVideoLength) => void;
  platform?: TargetPlatform;
  onPlatformChange?: (platform: TargetPlatform) => void;
  customSceneCount: number;
  onCustomSceneCountChange: (count: number) => void;
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
  customSceneCount,
  onCustomSceneCountChange,
  isProcessing,
  stepMessage,
  errorMessage,
  onClearError,
  analysis: _analysis,
  improvedStory,
  characters,
  scenes,
  videoPackage,
  onGenerateAll,
  onAnalyzeOnly: _onAnalyzeOnly,
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
  const [copiedCharId, setCopiedCharId] = useState<string | null>(null);
  const [copiedGridPrompt, setCopiedGridPrompt] = useState<boolean>(false);
  const [copiedSceneNumber, setCopiedSceneNumber] = useState<number | null>(null);
  const [copiedAllScenes, setCopiedAllScenes] = useState<boolean>(false);
  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);
  const [copiedDesc, setCopiedDesc] = useState<boolean>(false);
  const [copiedTags, setCopiedTags] = useState<boolean>(false);
  const [copiedHashtags, setCopiedHashtags] = useState<boolean>(false);
  const [copiedThumbnail, setCopiedThumbnail] = useState<boolean>(false);

  // Helper calculation for scene count
  const getCalculatedSceneCount = () => {
    if (targetVideoLength === 'custom') {
      return Math.max(1, Math.min(customSceneCount || 6, 80));
    }
    const clipSec = duration === '10s' ? 10 : 8;
    switch (targetVideoLength) {
      case '30s': return Math.round(30 / clipSec); // 3 for 10s, 4 for 8s
      case '1m': return Math.round(60 / clipSec); // 6 for 10s, 8 for 8s
      case '2m': return Math.round(120 / clipSec); // 12 for 10s, 15 for 8s
      case '3m': return Math.round(180 / clipSec); // 18 for 10s, 23 for 8s
      case '5m': return Math.round(300 / clipSec); // 30 for 10s, 38 for 8s
      case '10m': return Math.round(600 / clipSec); // 60 for 10s, 75 for 8s
      default: return duration === '10s' ? 6 : 8;
    }
  };

  const calculatedSceneCount = getCalculatedSceneCount();

  const getTargetLengthLabel = () => {
    switch (targetVideoLength) {
      case '30s': return '৩০ সেকেন্ড (30s)';
      case '1m': return '১ মিনিট (1m)';
      case '2m': return '২ মিনিট (2m)';
      case '3m': return '৩ মিনিট (3m)';
      case '5m': return '৫ মিনিট (5m)';
      case '10m': return '১০ মিনিট (10m)';
      case 'custom': return `কাস্টম (${customSceneCount} সিন)`;
      default: return '১ মিনিট';
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

  const handleCopyChar = (id: string, text: string) => {
    handleCopyText(text, () => {
      setCopiedCharId(id);
      setTimeout(() => setCopiedCharId(null), 2500);
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

  // The story to display in Bengali
  const displayBengaliStory = improvedStory?.bengaliStory || improvedStory?.fullStory;

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-300">বিজ্ঞপ্তি / ত্রুটি (Notification)</p>
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
              <span>বিল্ট-ইন AI দিয়ে রিট্রাই</span>
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
          ১. STORY BOX (গল্প লেখার বক্স)
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
                  ১. গল্প লেখার বক্স (Story Input Box)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  বাংলা • Banglish • English
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                আপনার গল্পটি এখানে লিখুন বা বলুন। এআই স্বয়ংক্রিয়ভাবে গল্পটি সুন্দর বাংলায় সাজাবে এবং প্রতিটি ভিডিও প্রম্পট তৈরি করবে।
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
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
              <span className="font-semibold text-xs">সেটিংস</span>
            </button>
          </div>
        </div>

        {/* Clean Dropdown Controls Bar (Compact, Space-Saving UI) */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-inner">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Platform Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">প্ল্যাটফর্ম:</span>
              <select
                value={platform}
                onChange={(e) => onPlatformChange?.(e.target.value as TargetPlatform)}
                className="bg-transparent text-xs font-bold text-slate-100 cursor-pointer focus:outline-none pr-1"
                aria-label="Select Target Platform (YouTube or Facebook)"
              >
                <option value="youtube" className="bg-slate-900 text-slate-100">
                  🔴 YouTube (16:9 • SEO • Chapters)
                </option>
                <option value="facebook" className="bg-slate-900 text-slate-100">
                  🔵 Facebook (Watch • Reels • Viral Copy)
                </option>
              </select>
            </div>

            {/* 2. Video Length Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus-within:border-amber-500 transition-colors shadow-sm">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ভিডিও দৈর্ঘ্য:</span>
              <select
                value={targetVideoLength}
                onChange={(e) => onTargetVideoLengthChange(e.target.value as TargetVideoLength)}
                className="bg-transparent text-xs font-bold text-slate-100 cursor-pointer focus:outline-none pr-1"
                aria-label="Select Target Video Length"
              >
                <option value="30s" className="bg-slate-900 text-slate-100">30s Short ({duration === '10s' ? 3 : 4} Prompts)</option>
                <option value="1m" className="bg-slate-900 text-slate-100">1 Min ({duration === '10s' ? 6 : 8} Prompts)</option>
                <option value="2m" className="bg-slate-900 text-slate-100">2 Min ({duration === '10s' ? 12 : 15} Prompts)</option>
                <option value="3m" className="bg-slate-900 text-slate-100">3 Min ({duration === '10s' ? 18 : 23} Prompts)</option>
                <option value="5m" className="bg-slate-900 text-slate-100">5 Min ({duration === '10s' ? 30 : 38} Prompts)</option>
                <option value="10m" className="bg-slate-900 text-slate-100">10 Min ({duration === '10s' ? 60 : 75} Prompts)</option>
                <option value="custom" className="bg-slate-900 text-slate-100">Custom Count (কাস্টম)</option>
              </select>
            </div>

            {/* Custom scene count input if 'custom' is selected */}
            {targetVideoLength === 'custom' && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/50 rounded-xl px-2 py-1 shadow-sm">
                <span className="text-xs text-amber-300 font-semibold">সংখ্যা:</span>
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
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ক্লিপ:</span>
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
              <span className="text-slate-400">মোট:</span>
              <span className="text-amber-300 font-bold">{getTargetLengthLabel()}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-300 font-mono font-bold">{calculatedSceneCount}টি ভিডিও প্রম্পট</span>
            </div>
          </div>
        </div>

        {/* Compact Voice & Samples Toolbar */}
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

        {/* Story Textarea */}
        <div className="mt-3 relative">
          <textarea
            rows={5}
            placeholder="এখানে বাংলা, বাংলিশ বা ইংরেজিতে আপনার গল্প লিখুন, অথবা উপরের 'ভয়েস ইনপুট' বাটনে ক্লিক করে সরাসরি কথা বলুন... (e.g. ব্রুকলিনের বৃষ্টিভেজা সন্ধ্যায় একটি ছোট্ট কমলা বিড়ালছানা... অথবা Ekta chotto biral bacha...)"
            value={rawStory}
            onChange={(e) => onRawStoryChange(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 focus:outline-none resize-y leading-relaxed font-sans shadow-inner disabled:opacity-50"
          />
          <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-mono bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
            {rawStory.length} ch • {rawStory.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      </section>

      {/* ========================================================
          ২. বাংলায় সুন্দর করে সাজানো গল্প (Bengali Story Box)
          "GOLPO TAY SUNDOR KORE BANGLAY SAJYE LIKHBE ER KICU NA"
          Clean narrative display with Copy Story button - NO technical cards!
          ======================================================== */}
      <section className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wider uppercase text-indigo-200">
                  ২. বাংলায় সুন্দর করে সাজানো গল্প (Bengali Story)
                </h3>
                {displayBengaliStory && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold">
                    {displayBengaliStory.trim().split(/\s+/).filter(Boolean).length} শব্দ • সুন্দর বাংলায় রচিত ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                আপনার গল্পের আকর্ষণীয়, সিনেমাটিক ও প্রাঞ্জল বাংলা রূপান্তর।
              </p>
            </div>
          </div>

          {displayBengaliStory && (
            <button
              type="button"
              onClick={() => handleCopyStory(displayBengaliStory)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wider transition-all cursor-pointer active:scale-95 shadow self-start sm:self-auto"
            >
              {copiedStory ? (
                <>
                  <Check className="w-3.5 h-3.5 text-indigo-200" />
                  <span>গল্প কপি হয়েছে! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>গল্প কপি করুন (Copy Story)</span>
                </>
              )}
            </button>
          )}
        </div>

        {displayBengaliStory ? (
          <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-slate-800/90 text-slate-100 text-sm leading-relaxed whitespace-pre-line font-sans shadow-inner select-all">
            {displayBengaliStory}
          </div>
        ) : (
          <div className="mt-4 p-5 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 text-center">
            <Sparkles className="w-5 h-5 text-indigo-400 mx-auto mb-1.5 opacity-80" />
            <p className="text-xs text-slate-300 font-medium">
              গল্প লিখে নিচের <strong className="text-amber-400 font-bold">"GENERATE ALL PROMPTS"</strong> বাটনে ক্লিক করলেই এআই গল্পটিকে সুন্দর বাংলায় সাজিয়ে এখানে লিখবে।
            </p>
          </div>
        )}
      </section>

      {/* ========================================================
          ৩. GENERATE BUTTON (জেনারেট বাটন)
          Placed directly under the Story Box!
          ======================================================== */}
      <section className="flex flex-col sm:flex-row items-center justify-center gap-3 py-2">
        <button
          type="button"
          onClick={onGenerateAll}
          disabled={!rawStory.trim() || isProcessing}
          className="w-full sm:w-auto min-w-[340px] flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 hover:from-amber-300 hover:via-rose-400 hover:to-indigo-500 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-2xl shadow-rose-950/50 active:scale-95 disabled:opacity-50 cursor-pointer ring-2 ring-amber-400/50"
          title="Generate all prompts directly in one click"
        >
          <Zap className="w-5 h-5 fill-slate-950 text-slate-950 animate-bounce" />
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-black tracking-wide leading-tight">
              🎬 GENERATE ALL PROMPTS (সব প্রম্পট তৈরি করুন)
            </span>
            <span className="text-[10px] font-bold text-slate-900 opacity-90 font-mono">
              ক্যারেক্টার ইমেজ প্রম্পট • {calculatedSceneCount}টি ভিডিও প্রম্পট • ২৫টি ট্যাগ-হ্যাশট্যাগ
            </span>
          </div>
        </button>

        {hasGeneratedOutputs && (
          <button
            type="button"
            onClick={onResetAll}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-bold text-xs border border-slate-800 transition-all cursor-pointer active:scale-95"
            title="Start fresh project"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>নতুন গল্প (Reset)</span>
          </button>
        )}
      </section>

      {/* Ongoing processing banner */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/50 flex items-center gap-3.5 animate-pulse shadow-xl">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
          <div className="text-xs text-indigo-200">
            <span className="font-bold text-indigo-300 block text-sm">
              {stepMessage || 'Processing cinematic pipeline with Gemini API...'}
            </span>
            <span className="text-[11px] text-slate-400">
              গল্পটি সুন্দর বাংলায় সাজানো হচ্ছে এবং প্রতিটি ভিডিও প্রম্পট দ্রুত তৈরি হচ্ছে, দয়া করে অপেক্ষা করুন...
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          ৩. MASTER GRID IMAGE PROMPT BOX (১টি ছবির ভেতরেই ৮টি সিন ফ্রেম)
          "CREACTER IMAGE PROMPT AKTAY HOBE AKTA IMAGER VITOREI JODI 8 TA VIDEO TOIRI HOI
           EKTA IMAGER VITREI 8 IMAGE BOSANO THAKBE VIDEO JENO AMAR SUNDOVABE SURU THEKEY SES HOI"
          ONLY ONE SINGLE MASTER PROMPT BOX!
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
                    ৩. ক্যারেক্টার ও স্টোরিবোর্ড একক ইমেজ প্রম্পট (Master Grid Image Prompt)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                    ১টি ছবির ভেতরেই {scenes.length || 8}টি সিন ফ্রেম ✓
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  এই একটি প্রম্পট দিয়ে Midjourney বা Flux এ ১টি ছবি তৈরি করবেন, যার মধ্যে শুরু থেকে শেষ পর্যন্ত {scenes.length || 8}টি সিনের দৃশ্য গ্রিড আকারে সাজানো থাকবে।
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
                  <span>কপি হয়েছে! ✓</span>
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
                  Panel 01 (শুরু) থেকে Panel {String(scenes.length || 8).padStart(2, '0')} (শেষ)
                </span>
              </div>

              {/* Clean Prompt Box - ONLY PROMPT, NOTHING ELSE */}
              <div className="p-4 bg-slate-900 border border-emerald-900/40 rounded-xl text-xs text-emerald-100 font-mono leading-relaxed select-all max-h-[380px] overflow-y-auto whitespace-pre-wrap">
                {getMasterGridPrompt()}
              </div>

              {/* Informative usage tip in clear Bengali */}
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-300/90 leading-relaxed flex items-start gap-2">
                <span className="text-base leading-none">💡</span>
                <span>
                  <strong>কীভাবে ব্যবহার করবেন:</strong> উপরের বাটনটিতে ক্লিক করে প্রম্পটটি কপি করুন এবং <strong>Midjourney</strong> বা <strong>Flux</strong>-এ পেস্ট করুন। এর ফলে একটি একক ১৬:৯ ছবিতে ক্রমানুসারে শুরু থেকে শেষ পর্যন্ত <strong>{scenes.length || 8}টি প্যানেল গ্রিড</strong> হিসেবে তৈরি হবে। এই একটি ছবি ব্যবহার করে প্রতিটি ভিডিও তৈরি করলে আপনার ভিডিওর শুরু থেকে শেষ পর্যন্ত ক্যারেক্টার ও সিন ১০০% নিখুঁত ও ধারাবাহিক থাকবে!
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          ৫. VIDEO PROMPT BOXES (একটার পর একটা ভিডিও প্রম্পট বক্স)
          "ER EI JAIGAGULOTEY SUDU PROMPT THAKBE BAKI SOB KICU BAD"
          ONLY the clean scene prompt box + Copy button! No start/action/end/camera clutter!
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
                    ৪. ভিডিও প্রম্পটসমূহ (Video Prompts - একটার পর একটা বক্স)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold font-mono">
                    {scenes.length}টি ভিডিও প্রম্পট
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  প্রতিটি ভিডিওর প্রম্পট আলাদা আলাদা বক্সে সাজানো।
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
                  <span className="text-emerald-400 font-bold">সবগুলো প্রম্পট কপি হয়েছে! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy All Scene Prompts (সবগুলো কপি)</span>
                </>
              )}
            </button>
          </div>

          {/* Sequential Video Prompt Boxes - ONE BY ONE - ONLY PROMPT + COPY */}
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
                          <span>সিন {scene.sceneNumber} কপি হয়েছে! ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Scene {scene.sceneNumber} Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Clean Video Prompt Box - ONLY PROMPT, NOTHING ELSE */}
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
          ৫. RELEASE PACKAGE (ইউটিউব বা ফেসবুক প্যাকেজ)
          "AGULO SOB USA BASE VIDEO HOBE AKTA YOUTUBER JONNEY AR AKTA FACBOKER JONEY"
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
                        ? '৫. ফেসবুক রিলিজ প্যাকেজ (Facebook Watch, Reels & Feed)'
                        : '৫. ইউটিউব সিনেমাটিক প্যাকেজ (YouTube 16:9 Cinema & SEO)'}
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
                      ? 'আমেরিকান ফেসবুক দর্শকদের উপযোগী ভাইরাল হেডলাইন, আকর্ষণীয় ফেসবুক পোস্ট কপি (ইমোজি সহ), এবং ২০-২৫টি ফেসবুক ট্যাগ ও হ্যাশট্যাগ।'
                      : 'আমেরিকান ইউটিউব দর্শকদের জন্য বড় এসইও ডেসক্রিপশন, চ্যাপ্টার, আকর্ষণীয় টাইটেল এবং ২০-২৫টি ভাইরাল সার্চ ট্যাগ ও হ্যাশট্যাগ।'}
                  </p>
                </div>
              </div>

              {/* Quick platform indicator / toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">মোড:</span>
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
                      ? '📌 ফেসবুক ভাইরাল হেডলাইন (Facebook Headlines - স্ক্রল-স্টপিং টাইটেল)'
                      : '📌 ইউটিউব ভিডিও টাইটেল (YouTube Titles Box - বড় ও আকর্ষণীয় টাইটেল)'}
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
                            <span>কপি হয়েছে! ✓</span>
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
                      ? '📝 ফেসবুক পোস্ট কপি (Viral Facebook Post Copy - বিস্তারিত পোস্ট টেক্সট)'
                      : '📝 ইউটিউব ভিডিও ডেসক্রিপশন (YouTube SEO Description Box - সিনপসিস ও চ্যাপ্টার সহ)'}
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
                      <span>{isFB ? 'পোস্ট কপি হয়েছে! ✓' : 'ডেসক্রিপশন কপি হয়েছে! ✓'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isFB ? 'Copy Facebook Post (সম্পূর্ণ পোস্ট কপি)' : 'Copy Description (সম্পূর্ণ ডেসক্রিপশন কপি)'}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto p-4 bg-slate-900 border border-slate-800 rounded-lg select-all">
                {displayDescription}
              </div>
            </div>

            {/* BOX 3: TAGS & HASHTAGS (20 TO 25 ITEMS EACH) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* TAGS BOX (20-25 TAGS) */}
              <div className={`bg-slate-950 border ${isFB ? 'border-blue-500/40' : 'border-teal-500/40'} rounded-xl p-4.5 space-y-3 flex flex-col justify-between shadow-lg`}>
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className={`w-4 h-4 ${isFB ? 'text-blue-400' : 'text-teal-400'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isFB ? 'text-blue-300' : 'text-teal-300'}`}>
                        {isFB
                          ? `🏷️ ফেসবুক ইন্টারেস্ট কিওয়ার্ড (${videoPackage.tags.length}টি ট্যাগ)`
                          : `🏷️ ইউটিউব সার্চ ট্যাগ (${videoPackage.tags.length}টি ট্যাগ)`}
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
                          <span>সব {videoPackage.tags.length}টি ট্যাগ কপি হয়েছে! ✓</span>
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
                    ? 'ফেসবুক পেইজ পোস্ট, রিলস ও মেটা অ্যাডস টার্গেটিংয়ের জন্য রেডিমেড ট্যাগ।'
                    : 'কমা দেওয়া রেডিমেড ফরম্যাট—ইউটিউব স্টুডিওর ট্যাগ বক্সে সরাসরি পেস্ট করুন।'}
                </p>
              </div>

              {/* HASHTAGS BOX (20-25 HASHTAGS) */}
              <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4.5 space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                        {isFB
                          ? `#️⃣ ফেসবুক ট্রেন্ডিং হ্যাশট্যাগ (${videoPackage.hashtags.length}টি হ্যাশট্যাগ)`
                          : `#️⃣ ইউটিউব ভাইরাল হ্যাশট্যাগ (${videoPackage.hashtags.length}টি হ্যাশট্যাগ)`}
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
                          <span>সব {videoPackage.hashtags.length}টি হ্যাশট্যাগ কপি হয়েছে! ✓</span>
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
                    ? 'ফেসবুক ফিড, ওয়াচ এবং রিলসে সর্বোচ্চ অর্গানিক রিচের জন্য ট্রেন্ডিং হ্যাশট্যাগ।'
                    : 'ইউটিউব ডেসক্রিপশন এবং শর্টসের জন্য ট্রেন্ডিং হ্যাশট্যাগ।'}
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
                      ? '🎨 ফেসবুক কভার ও থাম্বনেইল প্রম্পট (Facebook Video Cover Art Prompt Box)'
                      : '🎨 ১৬:৯ ইউটিউব থাম্বনেইল প্রম্পট (Master 16:9 Thumbnail Prompt Box)'}
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
                      <span>কপি হয়েছে! ✓</span>
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
                  ? 'Midjourney বা Flux এ ব্যবহার করুন (ফেসবুক ভিডিও ফিড ও রিলের জন্য অপ্টিমাইজড)।'
                  : <>Midjourney (v6/v7) তে <code className="text-rose-300 font-mono">--ar 16:9 --style raw</code> সহ ব্যবহার করুন।</>}
              </p>
            </div>
          </section>
        );
      })()}
    </div>
  );
};
