import React, { useState, useEffect } from 'react';
import { Cpu, Check, RefreshCw, Sparkles, Layers } from 'lucide-react';
import { fetchAvailableModels } from '../services/apiClient.ts';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  apiKey?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelSelect, apiKey }) => {
  const [models, setModels] = useState<Array<{ id: string; name: string; description: string; isDefault: boolean }>>([
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      description: 'High-speed reasoning optimized for cinematic story analysis, scene breakdown, and 8-10s video prompts.',
      isDefault: true,
    },
    {
      id: 'gemini-flash-latest',
      name: 'Gemini Flash Latest (High Availability)',
      description: 'Extremely reliable high-speed model with proven uptime during regional demand spikes.',
      isDefault: false,
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro Preview',
      description: 'Deep reasoning power for intricate multi-character relationships and complex narrative continuity.',
      isDefault: false,
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      description: 'Ultra-low latency model for quick drafts and rapid character iterations.',
      isDefault: false,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const fetched = await fetchAvailableModels(apiKey);
      if (fetched && fetched.length > 0) {
        setModels(fetched);
      }
    } catch {
      // Keep existing list on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      handleRefresh();
    }
  }, [apiKey]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md mb-8">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-indigo-300 flex items-center gap-2">
              Gemini Model
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Active: {selectedModel}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Select the Gemini AI engine powering your cinematic story analysis and character locks.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          title="Refresh available models"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {models.map((model) => {
          const isSelected = selectedModel === model.id;
          return (
            <div
              key={model.id}
              onClick={() => onModelSelect(model.id)}
              className={`relative p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-slate-200">{model.name}</span>
                    {model.isDefault && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Default
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{model.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{model.id}</span>
                {isSelected ? (
                  <span className="text-indigo-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Selected
                  </span>
                ) : (
                  <span className="hover:text-slate-300">Click to select</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
