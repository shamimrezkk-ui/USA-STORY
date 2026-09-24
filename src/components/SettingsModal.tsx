import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Key, 
  Cpu, 
  Mic, 
  Sliders, 
  Check, 
  Sparkles,
  ShieldCheck,
  Languages
} from 'lucide-react';
import { ApiKeyConfig } from './ApiKeyConfig.tsx';
import { ModelSelector } from './ModelSelector.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  voiceLanguage: string;
  onVoiceLanguageChange: (lang: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  selectedModel,
  onModelSelect,
  voiceLanguage,
  onVoiceLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'api' | 'model' | 'voice'>('all');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md transition-all animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div 
        className="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-rose-950/30 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500/20 via-amber-500/20 to-indigo-500/20 border border-rose-500/30 rounded-xl text-amber-400">
              <SettingsIcon className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                  Settings & Configuration
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-medium">
                  সেটিংস ও এআই মডেল
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage Gemini API Key, AI Models, and Bangla Voice-to-Text preferences.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Close Settings (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>All Settings (সব সেটিংস)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'api'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Gemini API Key</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'model'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Model Selector</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Voice & Language (ভয়েস)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: API Key Config */}
          {(activeTab === 'all' || activeTab === 'api') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  1. Gemini API Key Configuration
                </span>
                <span className="text-[11px] text-slate-500">
                  (Browser-side secure storage & proxy)
                </span>
              </div>
              <ApiKeyConfig
                apiKey={apiKey}
                onApiKeyChange={onApiKeyChange}
                selectedModel={selectedModel}
              />
            </div>
          )}

          {/* Section 2: Model Selector */}
          {(activeTab === 'all' || activeTab === 'model') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  2. Gemini Model Selection
                </span>
                <span className="text-[11px] text-slate-500">
                  (Choose between speed and complex reasoning)
                </span>
              </div>
              <ModelSelector
                selectedModel={selectedModel}
                onModelSelect={onModelSelect}
                apiKey={apiKey}
              />
            </div>
          )}

          {/* Section 3: Voice & Language Preferences */}
          {(activeTab === 'all' || activeTab === 'voice') && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      Voice-to-Text & Language Settings
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        সঠিক বাংলা ভয়েস ইনপুট
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure accurate speech recognition for Bangla (বাংলাদেশ/ভারত), Banglish, and English.
                    </p>
                  </div>
                </div>
                <Languages className="w-5 h-5 text-amber-400 hidden sm:block" />
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Default Voice Recognition Language (ভয়েস রেকর্ডিং এর ভাষা):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onVoiceLanguageChange('bn-BD')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        voiceLanguage === 'bn-BD'
                          ? 'bg-rose-950/40 border-rose-500/80 text-rose-200 shadow-md shadow-rose-950/30 ring-1 ring-rose-500'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span>বাংলা (বাংলাদেশ)</span>
                        {voiceLanguage === 'bn-BD' && <Check className="w-4 h-4 text-rose-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        bn-BD • সবচেয়ে নিখুঁত ও দ্রুত বাংলা শব্দ সংগ্রহ
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onVoiceLanguageChange('bn-IN')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        voiceLanguage === 'bn-IN'
                          ? 'bg-rose-950/40 border-rose-500/80 text-rose-200 shadow-md shadow-rose-950/30 ring-1 ring-rose-500'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span>বাংলা (ভারত / পশ্চিমবঙ্গ)</span>
                        {voiceLanguage === 'bn-IN' && <Check className="w-4 h-4 text-rose-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        bn-IN • পশ্চিমবঙ্গীয় উচ্চারণ ও বাংলা শব্দ
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onVoiceLanguageChange('en-US')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        voiceLanguage === 'en-US'
                          ? 'bg-rose-950/40 border-rose-500/80 text-rose-200 shadow-md shadow-rose-950/30 ring-1 ring-rose-500'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span>English (United States)</span>
                        {voiceLanguage === 'en-US' && <Check className="w-4 h-4 text-rose-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        en-US • Standard American English diction
                      </p>
                    </button>
                  </div>
                </div>

                {/* Bangla & Banglish Guide Box */}
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>বাংলা ও বাংলিশ বোঝাবুঝি নির্দেশিকা (How Bangla & Banglish are handled):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    <li>
                      <strong className="text-amber-300">বিশুদ্ধ বাংলা (Bengali Script):</strong> ভয়েস ইনপুট বা সরাসরি টেক্সটে বাংলা লিখলে এআই স্বয়ংক্রিয়ভাবে গল্পের চরিত্র, আবেগ ও ঘটনা বিশ্লেষণ করে আমেরিকান সিনেমাটিক চিত্রনাট্যে রূপান্তর করবে।
                    </li>
                    <li>
                      <strong className="text-amber-300">বাংলিশ (Romanized Bengali):</strong> যেমন: <em>&quot;Ekta chotto biral bacha rain er moddhe porch er niche kaapchilo...&quot;</em> — সিস্টেম সম্পূর্ণ বুঝে নিয়ে সঠিক প্রম্পট তৈরি করবে।
                    </li>
                    <li>
                      <strong className="text-amber-300">ভয়েস স্পিচ পলিশিং:</strong> কথা বলার পর যদি অসম্পূর্ণ বাক্য বা অপ্রয়োজনীয় বিরতি থাকে, &quot;Format Spoken Story&quot; বাটনে ক্লিক করলেই এআই গল্পটি সুন্দরভাবে সাজিয়ে দেবে।
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Settings saved automatically to local storage</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Done (সম্পন্ন)
          </button>
        </div>
      </div>
    </div>
  );
};
