import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, XCircle, Eye, EyeOff, Save, Trash2, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key_custom');
    if (saved) {
      setInputValue(saved);
      onApiKeyChange(saved);
    }
  }, []);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    localStorage.setItem('gemini_api_key_custom', trimmed);
    onApiKeyChange(trimmed);
    setTestStatus('idle');
    setStatusMessage('Key saved to local browser storage.');
    setTimeout(() => {
      if (statusMessage === 'Key saved to local browser storage.') setStatusMessage('');
    }, 3000);
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key_custom');
    setInputValue('');
    onApiKeyChange('');
    setTestStatus('idle');
    setStatusMessage('Custom key cleared. App will use environment default if configured.');
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setStatusMessage('Testing connection to Gemini API...');
    try {
      const res = await testGeminiApiKey(inputValue.trim() || undefined, selectedModel);
      setTestStatus('success');
      setStatusMessage(res.message || '✓ Gemini API Connected');
    } catch (err: any) {
      setTestStatus('failed');
      setStatusMessage(`✕ Gemini API Connection Failed: ${err.message || 'Invalid key or quota exceeded'}`);
    }
  };

  const getMaskedKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}••••••••••••••••${key.slice(-4)}`;
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider uppercase text-amber-400">
                Gemini API Configuration
              </h2>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Secure Client Proxy
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your Gemini API key. Keys are never exposed in prompts, logs, or exported video packages.
            </p>
          </div>
        </div>

        {/* Display Masked Version */}
        {apiKey && (
          <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Saved Key:</span>
            <code className="text-xs font-mono text-emerald-400 tracking-wider font-semibold">
              {getMaskedKey(apiKey)}
            </code>
          </div>
        )}
      </div>

      {/* Input and Buttons Row */}
      <div className="mt-4 flex flex-col lg:flex-row items-stretch gap-3">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="Paste your Gemini API Key (e.g. AIzaSy...)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-mono transition-colors"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Hide key' : 'Show key'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
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
            <span>Save API Key</span>
          </button>

          <button
            type="button"
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs tracking-wider uppercase rounded-lg transition-all border border-slate-700 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin text-amber-400' : ''}`} />
            <span>{testStatus === 'testing' ? 'Testing...' : 'Test API Key'}</span>
          </button>

          {inputValue && (
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-all border border-slate-700 active:scale-95 cursor-pointer"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showKey ? 'Hide Key' : 'Show Key'}</span>
            </button>
          )}

          {apiKey && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-xs rounded-lg transition-all border border-rose-500/20 active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Key</span>
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`mt-3 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            testStatus === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : testStatus === 'failed'
              ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              : 'bg-slate-800/60 border border-slate-700 text-slate-300'
          }`}
        >
          {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
          {testStatus === 'failed' && <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          {testStatus === 'idle' && <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />}
          {testStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Security notice */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Strict Security Policy: Your key is securely forwarded to the backend proxy via headers and is completely omitted from video prompts, story texts, and exports.
        </span>
      </div>
    </section>
  );
};
