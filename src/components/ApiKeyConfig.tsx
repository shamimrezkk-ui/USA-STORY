import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, XCircle, Eye, EyeOff, Save, Trash2, RefreshCw, ShieldAlert, Sparkles, Check, Server } from 'lucide-react';
import { testGeminiApiKey } from '../services/apiClient.ts';

interface ApiKeyConfigProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  selectedModel: string;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ apiKey, onApiKeyChange, selectedModel }) => {
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [canRevertToDefault, setCanRevertToDefault] = useState(false);

  const sanitizeKey = (val: string): string => {
    let cleaned = val.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    if (cleaned.startsWith('GEMINI_API_KEY=')) {
      cleaned = cleaned.replace(/^GEMINI_API_KEY=/, '').trim();
    }
    if (cleaned.startsWith('export GEMINI_API_KEY=')) {
      cleaned = cleaned.replace(/^export GEMINI_API_KEY=/, '').trim();
    }
    return cleaned.replace(/^["']|["']$/g, '').trim();
  };

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key_custom');
    if (saved) {
      const sanitized = sanitizeKey(saved);
      setInputValue(sanitized);
      onApiKeyChange(sanitized);
    }
  }, []);

  const handleSave = () => {
    const sanitized = sanitizeKey(inputValue);
    if (!sanitized) {
      handleUseDefault();
      return;
    }
    localStorage.setItem('gemini_api_key_custom', sanitized);
    setInputValue(sanitized);
    onApiKeyChange(sanitized);
    setTestStatus('idle');
    setCanRevertToDefault(false);
    setStatusMessage('✓ কাস্টম API Key ব্রাউজারে সংরক্ষিত হয়েছে (Key saved).');
    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  };

  const handleUseDefault = () => {
    localStorage.removeItem('gemini_api_key_custom');
    setInputValue('');
    onApiKeyChange('');
    setTestStatus('success');
    setCanRevertToDefault(false);
    setStatusMessage('✓ সিস্টেমের অন্তর্নির্মিত Gemini AI সক্রিয় করা হয়েছে (Using Built-in System AI - Ready).');
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setCanRevertToDefault(false);
    const sanitized = sanitizeKey(inputValue);
    setStatusMessage(sanitized ? 'কাস্টম API Key কানেকশন যাচাই করা হচ্ছে...' : 'সিস্টেমের অন্তর্নির্মিত Gemini AI কানেকশন টেস্ট করা হচ্ছে...');
    try {
      const res = await testGeminiApiKey(sanitized || undefined, selectedModel);
      setTestStatus('success');
      setStatusMessage(res.message || '✓ Gemini AI সফলভাবে সংযুক্ত হয়েছে!');
    } catch (err: any) {
      setTestStatus('failed');
      setCanRevertToDefault(true);
      const msg = err.message || 'কানেকশন সমস্যা হয়েছে।';
      setStatusMessage(`✕ কানেকশন ব্যর্থ: ${msg}`);
    }
  };

  const getMaskedKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}••••••••••••••••${key.slice(-4)}`;
  };

  const isUsingCustomKey = Boolean(apiKey && apiKey.trim());

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md mb-8">
      {/* Top Header & Active Status Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider uppercase text-amber-400">
                Gemini AI সংযোগ ও কনফিগারেশন
              </h2>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Secure Proxy
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              অ্যাপটিতে স্বয়ংক্রিয়ভাবে শক্তিশালী অন্তর্নির্মিত Gemini AI যুক্ত আছে। আপনি চাইলে আপনার নিজস্ব কী-ও দিতে পারেন।
            </p>
          </div>
        </div>

        {/* Current Active Mode Display */}
        <div className="flex items-center gap-2">
          {isUsingCustomKey ? (
            <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-amber-400 font-medium">কাস্টম কী:</span>
              <code className="font-mono text-amber-300 tracking-wider font-semibold">
                {getMaskedKey(apiKey)}
              </code>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/50 px-3.5 py-1.5 rounded-lg text-xs">
              <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-semibold">
                ✓ বিল্ট-ইন সার্ভার AI সক্রিয় (Built-in AI Ready)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Advice Notice */}
      <div className="mt-3.5 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>টিপস:</strong> কোনো নিজস্ব API Key না থাকলেও আপনি সরাসরি গল্প তৈরি করতে পারবেন। সার্ভারের অন্তর্নির্মিত AI সবসময় প্রস্তুত!
          </span>
        </div>
        {isUsingCustomKey && (
          <button
            type="button"
            onClick={handleUseDefault}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold shrink-0 cursor-pointer transition-all shadow"
          >
            ডিফল্ট AI ব্যবহার করুন
          </button>
        )}
      </div>

      {/* Input and Buttons Row */}
      <div className="mt-4 flex flex-col lg:flex-row items-stretch gap-3">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="আপনার নিজস্ব Gemini API Key থাকলে এখানে দিন (ঐচ্ছিক / Optional)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-mono transition-colors"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Hide key' : 'Show key'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>কী সেভ করুন</span>
          </button>

          <button
            type="button"
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs tracking-wider uppercase rounded-lg transition-all border border-slate-700 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin text-amber-400' : ''}`} />
            <span>{testStatus === 'testing' ? 'যাচাই হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
          </button>

          <button
            type="button"
            onClick={handleUseDefault}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-xs rounded-lg transition-all border border-emerald-500/30 active:scale-95 cursor-pointer"
            title="Use Built-in System AI"
          >
            <Check className="w-4 h-4" />
            <span>বিল্ট-ইন AI ব্যবহার করুন</span>
          </button>

          {isUsingCustomKey && (
            <button
              type="button"
              onClick={handleUseDefault}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-xs rounded-lg transition-all border border-rose-500/20 active:scale-95 cursor-pointer"
              title="Clear custom key"
            >
              <Trash2 className="w-4 h-4" />
              <span>কী মুছুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`mt-3.5 px-4 py-2.5 rounded-lg text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
            testStatus === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-200'
              : testStatus === 'failed'
              ? 'bg-rose-950/70 border border-rose-500/50 text-rose-200'
              : 'bg-slate-800/60 border border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {testStatus === 'failed' && <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
            {testStatus === 'idle' && <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />}
            {testStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />}
            <span className="leading-relaxed">{statusMessage}</span>
          </div>

          {canRevertToDefault && (
            <button
              type="button"
              onClick={handleUseDefault}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold shrink-0 cursor-pointer transition-all shadow"
            >
              বিল্ট-ইন AI নির্বাচন করুন
            </button>
          )}
        </div>
      )}

      {/* Security notice */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          নিরাপত্তা নীতি: API Key ব্যাকএন্ড প্রক্সির মাধ্যমে সুরক্ষিত থাকে এবং প্রম্পট, স্টোরি টেক্সট বা এক্সপোর্টে প্রকাশ পায় না।
        </span>
      </div>
    </section>
  );
};
