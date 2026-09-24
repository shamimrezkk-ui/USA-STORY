import React from 'react';
import { 
  Clapperboard, 
  Clock, 
  Sparkles, 
  Wand2, 
  Languages, 
  Settings as SettingsIcon,
  Mic,
  Zap,
  Film,
  Layers,
} from 'lucide-react';
import type { VideoDuration, TargetVideoLength } from '../types/index.ts';
import { VoiceInputController } from './VoiceInputController.tsx';

interface StoryInputSectionProps {
  storyText: string;
  onStoryTextChange: (val: string) => void;
  duration: VideoDuration;
  onDurationChange: (dur: VideoDuration) => void;
  targetVideoLength: TargetVideoLength;
  onTargetVideoLengthChange: (len: TargetVideoLength) => void;
  customSceneCount: number;
  onCustomSceneCountChange: (count: number) => void;
  onAnalyze: () => void;
  onRunFullPipeline: () => void;
  onFastGenerate?: () => void;
  isProcessing: boolean;
  currentStepMessage?: string;
  voiceLanguage: string;
  onVoiceLanguageChange: (lang: string) => void;
  selectedModel: string;
  apiKey?: string;
  onOpenSettings?: () => void;
}

export const StoryInputSection: React.FC<StoryInputSectionProps> = ({
  storyText,
  onStoryTextChange,
  duration,
  onDurationChange,
  targetVideoLength,
  onTargetVideoLengthChange,
  customSceneCount,
  onCustomSceneCountChange,
  onAnalyze,
  onRunFullPipeline,
  onFastGenerate,
  isProcessing,
  currentStepMessage,
  voiceLanguage,
  onVoiceLanguageChange,
  selectedModel,
  apiKey,
  onOpenSettings,
}) => {
  // Detect Bengali script
  const hasBengaliScript = /[\u0980-\u09FF]/.test(storyText);

  // Compute calculated scene count
  const getComputedSceneCount = () => {
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

  const calculatedSceneCount = getComputedSceneCount();

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

  return (
    <section className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md mb-8">
      {/* Top Header - Single Clean Row with Horizontal Alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Left Side: Title & Badges */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
            <Clapperboard className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider uppercase text-rose-200">
                Story Input & Video Engine
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                বাংলা • Banglish • English
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Paste or speak your raw narrative. AI creates character-locked USA cinematic scenes.
            </p>
          </div>
        </div>

        {/* Right Side: Length Selector & Settings Button (Horizontal on same line) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Duration Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
            <button
              type="button"
              onClick={() => onDurationChange('8s')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                duration === '8s'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              8 SECONDS
            </button>
            <button
              type="button"
              onClick={() => onDurationChange('10s')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                duration === '10s'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              10 SECONDS
            </button>
          </div>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
              title="Open Gemini API & Model Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-xs">সেটিংস</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact Voice & Tools Bar */}
      <div className="mt-3">
        <VoiceInputController
          currentStoryText={storyText}
          onUpdateStoryText={onStoryTextChange}
          voiceLanguage={voiceLanguage}
          onVoiceLanguageChange={onVoiceLanguageChange}
          selectedModel={selectedModel}
          apiKey={apiKey}
          disabled={isProcessing}
        />
      </div>

      {/* Target Video Runtime & Prompt Count Calculator Bar */}
      <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-inner">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span>মোট ভিডিওর দৈর্ঘ্য (Target Video Length):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: '30s', label: '30s', count10: 3, count8: 4 },
                { id: '1m', label: '1 Min (১ মি)', count10: 6, count8: 8 },
                { id: '2m', label: '2 Min (২ মি)', count10: 12, count8: 15 },
                { id: '3m', label: '3 Min (৩ মি)', count10: 18, count8: 23 },
                { id: '5m', label: '5 Min (৫ মি)', count10: 30, count8: 38 },
                { id: '10m', label: '10 Min (১০ মি)', count10: 60, count8: 75 },
                { id: 'custom', label: 'কাস্টম', count10: customSceneCount, count8: customSceneCount },
              ] as const
            ).map((opt) => {
              const active = targetVideoLength === opt.id;
              const promptCount = duration === '10s' ? opt.count10 : opt.count8;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onTargetVideoLengthChange(opt.id as TargetVideoLength)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-rose-500 text-slate-950 shadow-md ring-1 ring-rose-400 font-extrabold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 hover:text-white'
                  }`}
                  title={`${opt.label} ভিডিওর জন্য ${promptCount}টি প্রম্পট`}
                >
                  <span>{opt.label}</span>
                  {opt.id !== 'custom' && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        active ? 'bg-slate-950 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {promptCount}p
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {targetVideoLength === 'custom' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">প্রম্পট সংখ্যা:</span>
              <input
                type="number"
                min={1}
                max={80}
                value={customSceneCount}
                onChange={(e) => onCustomSceneCountChange(Math.max(1, Math.min(80, Number(e.target.value) || 1)))}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold focus:border-rose-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Real-time Calculation Display Badge */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-amber-500/40 shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="text-[11px] text-slate-200">
            <span>ভিডিও: <strong className="text-rose-300 font-bold">{getTargetLengthLabel()}</strong></span>
            <span className="mx-1.5 text-slate-600">•</span>
            <span>ক্লিপ: <strong className="text-amber-400 font-bold">{duration}</strong></span>
            <span className="mx-1.5 text-slate-600">•</span>
            <span className="text-emerald-300 font-mono font-bold text-xs bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
              {calculatedSceneCount}টি ভিডিও প্রম্পট
            </span>
          </div>
        </div>
      </div>

      {/* Main Story Textarea Box */}
      <div className="mt-2.5 relative">
        <textarea
          rows={6}
          placeholder="এখানে বাংলা, বাংলিশ বা ইংরেজিতে আপনার গল্প লিখুন, অথবা উপরের 'ভয়েস ইনপুট' বাটনে ক্লিক করে সরাসরি কথা বলুন... (e.g. ব্রুকলিনের বৃষ্টিভেজা সন্ধ্যায় একটি ছোট্ট কমলা বিড়ালছানা... অথবা Ekta chotto biral bacha...)"
          value={storyText}
          onChange={(e) => onStoryTextChange(e.target.value)}
          disabled={isProcessing}
          className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none leading-relaxed transition-colors font-sans resize-y"
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[11px] text-slate-500 font-mono pointer-events-none">
          {hasBengaliScript && (
            <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px]">
              বাংলা লিপি
            </span>
          )}
          <span>
            {storyText.length} ch • {storyText.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      </div>

      {/* Bottom Action Buttons Row */}
      <div className="mt-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Target Clip Duration: <strong className="text-amber-400">{duration}</strong> • Cinematic Live-Action USA
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Analyze Story Step-by-Step */}
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!storyText.trim() || isProcessing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs tracking-wider uppercase border border-slate-700 hover:border-slate-600 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Step-by-step Story Breakdown"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ধাপে ধাপে (Step-by-Step)</span>
          </button>

          {/* Full Pipeline Button */}
          <button
            type="button"
            onClick={onRunFullPipeline}
            disabled={!storyText.trim() || isProcessing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 font-bold text-xs tracking-wider uppercase border border-slate-700 hover:border-slate-600 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Generate Full Director Suite"
          >
            <Wand2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Full Suite</span>
          </button>

          {/* Primary High-Speed Action: Fast Prompts */}
          <button
            type="button"
            onClick={onFastGenerate || onRunFullPipeline}
            disabled={!storyText.trim() || isProcessing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 hover:from-amber-300 hover:via-rose-400 hover:to-indigo-400 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-xl shadow-amber-950/40 active:scale-95 disabled:opacity-50 cursor-pointer ring-2 ring-amber-400/40"
            title="Ultra-fast Character Image Prompt and Video Prompts in seconds"
          >
            <Zap className="w-4 h-4 fill-slate-950 text-slate-950 animate-bounce" />
            <div className="flex flex-col items-start text-left">
              <span className="leading-tight">⚡ Fast Prompts (তাত্ক্ষণিক প্রম্পট)</span>
              <span className="text-[9px] font-bold text-slate-900 opacity-90 lowercase font-mono">ক্যারেক্টার ও ভিডিও প্রম্পট সাথে সাথে</span>
            </div>
          </button>
        </div>
      </div>

      {/* Ongoing processing banner */}
      {isProcessing && (
        <div className="mt-3.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center gap-3 animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
          <div className="text-xs text-indigo-200">
            <span className="font-semibold text-indigo-300">
              {currentStepMessage || 'Processing cinematic pipeline with Gemini API...'}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
