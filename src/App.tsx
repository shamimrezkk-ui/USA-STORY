/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Clapperboard,
  RotateCcw,
  Settings as SettingsIcon,
  Tv
} from 'lucide-react';
import { SettingsModal } from './components/SettingsModal.tsx';
import { StreamlinedStoryApp } from './components/StreamlinedStoryApp.tsx';
import { SAMPLE_STORIES } from './data/sampleStories.ts';
import {
  apiAnalyzeStory,
  apiFastGenerate,
} from './services/apiClient.ts';
import type {
  StoryAnalysis,
  ImprovedStory,
  CharacterBibleEntry,
  SceneItem,
  VideoPackage,
  VideoDuration,
  TargetVideoLength,
  TargetPlatform,
} from './types/index.ts';

export default function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [rawStory, setRawStory] = useState<string>(SAMPLE_STORIES[0].content);
  const [duration, setDuration] = useState<VideoDuration>('10s');
  const [targetVideoLength, setTargetVideoLength] = useState<TargetVideoLength>('1m');
  const [platform, setPlatform] = useState<TargetPlatform>('youtube');
  const [customSceneCount, setCustomSceneCount] = useState<number>(6);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Voice Language state (Defaults to bn-BD for accurate Bangla voice input)
  const [voiceLanguage, setVoiceLanguage] = useState<string>(() => {
    return localStorage.getItem('story_voice_language') || 'bn-BD';
  });

  const handleVoiceLanguageChange = (lang: string) => {
    setVoiceLanguage(lang);
    localStorage.setItem('story_voice_language', lang);
  };

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepMessage, setStepMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load custom api key from local storage on mount if present
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key_custom');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Pipeline Data State
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [improvedStory, setImprovedStory] = useState<ImprovedStory | null>(null);
  const [characters, setCharacters] = useState<CharacterBibleEntry[]>([]);
  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [videoPackage, setVideoPackage] = useState<VideoPackage | null>(null);

  // Calculate target scene count based on duration and target video length
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

  // Analyze Story Only
  const handleAnalyzeOnly = async () => {
    if (!rawStory.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStepMessage('গল্পের গঠন, ক্যারেক্টার ও আমেরিকান সিনেমাটিক উপাদান বিশ্লেষণ করা হচ্ছে...');
    try {
      const result = await apiAnalyzeStory(rawStory, selectedModel, apiKey);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'গল্প অ্যানালাইজ করতে সমস্যা হয়েছে। দয়া করে সেটিংস থেকে Gemini API Key চেক করুন।');
    } finally {
      setIsProcessing(false);
      setStepMessage('');
    }
  };

  // Generate All Prompts in One Single Fast Pass!
  const handleGenerateAll = async () => {
    if (!rawStory.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    const sceneCount = getComputedSceneCount();
    const platformLabel = platform === 'facebook' ? 'Facebook (Watch/Viral)' : 'YouTube (16:9)';
    setStepMessage(`ক্যারেক্টার ইমেজ প্রম্পট এবং ${targetVideoLength} (${sceneCount}টি ভিডিও প্রম্পট) [${platformLabel}] তৈরি হচ্ছে...`);

    try {
      const res = await apiFastGenerate(rawStory, duration, sceneCount, targetVideoLength, selectedModel, apiKey, platform);
      setAnalysis(res.analysis);
      setImprovedStory(res.improvedStory);
      setCharacters(res.characters);
      setScenes(res.scenes);
      setVideoPackage(res.videoPackage);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'প্রম্পট জেনারেশন ব্যর্থ হয়েছে। দয়া করে সেটিংস থেকে আপনার Gemini API Key চেক করুন।');
    } finally {
      setIsProcessing(false);
      setStepMessage('');
    }
  };

  const handleResetAll = () => {
    if (confirm('নতুন গল্প শুরু করতে চান? বর্তমান ফলাফল ক্লিয়ার করা হবে।')) {
      setAnalysis(null);
      setImprovedStory(null);
      setCharacters([]);
      setScenes([]);
      setVideoPackage(null);
      setErrorMessage(null);
    }
  };

  const hasOutput = characters.length > 0 || scenes.length > 0 || !!videoPackage;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white font-sans antialiased">
      {/* Top Ambient Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 bg-gradient-to-b from-rose-900/15 via-amber-900/10 to-transparent pointer-events-none blur-3xl z-0" />

      {/* Main Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-indigo-600 p-0.5 shadow-lg shadow-rose-950/40">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-rose-400">
                <Clapperboard className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-rose-300 via-amber-200 to-indigo-200 bg-clip-text text-transparent uppercase">
                  USA Story Cinematic AI
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 hidden sm:inline-block">
                  Direct Prompt Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                ক্যারেক্টার ইমেজ প্রম্পট • ধারাবাহিক ভিডিও প্রম্পট • ইউটিউব টাইটেল ও ট্যাগ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">আমেরিকান অডিয়েন্স ({duration})</span>
            </div>

            {/* Dedicated Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-md active:scale-95"
              title="Open Gemini API & Model Settings"
            >
              <SettingsIcon className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold tracking-wider uppercase">সেটিংস</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  apiKey ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-amber-400'
                }`}
                title={apiKey ? 'Custom Gemini API Key active' : 'Using default environment Gemini configuration'}
              />
            </button>

            {hasOutput && (
              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition-all cursor-pointer"
                title="Start a new project"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">নতুন গল্প</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Single-Page Streamlined Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8">
        <StreamlinedStoryApp
          rawStory={rawStory}
          onRawStoryChange={setRawStory}
          duration={duration}
          onDurationChange={setDuration}
          targetVideoLength={targetVideoLength}
          onTargetVideoLengthChange={setTargetVideoLength}
          platform={platform}
          onPlatformChange={setPlatform}
          customSceneCount={customSceneCount}
          onCustomSceneCountChange={setCustomSceneCount}
          isProcessing={isProcessing}
          stepMessage={stepMessage}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
          analysis={analysis}
          improvedStory={improvedStory}
          characters={characters}
          scenes={scenes}
          videoPackage={videoPackage}
          onGenerateAll={handleGenerateAll}
          onAnalyzeOnly={handleAnalyzeOnly}
          voiceLanguage={voiceLanguage}
          onVoiceLanguageChange={handleVoiceLanguageChange}
          selectedModel={selectedModel}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onResetAll={handleResetAll}
        />
      </main>

      {/* Settings Modal (Contains Gemini API Key, Model Selector & Voice Config) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        voiceLanguage={voiceLanguage}
        onVoiceLanguageChange={handleVoiceLanguageChange}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 px-4 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            USA Story Cinematic AI • ক্যারেক্টার ও ভিডিও প্রম্পট স্টুডিও
          </p>
          <p className="text-[11px] text-slate-600 font-mono">
            Powered by Google Gemini 3.8 Flash & Pro • Locked Continuity Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}
