import React, { useState } from 'react';
import { Film, Copy, Check, RefreshCw, Sparkles, MapPin, Gauge, ShieldCheck, ArrowRight } from 'lucide-react';
import type { ImprovedStory } from '../types/index.ts';

interface ImprovedStoryViewProps {
  improvedStory: ImprovedStory;
  onRegenerate: () => void;
  onProceedToCharacters: () => void;
  isProcessing: boolean;
}

export const ImprovedStoryView: React.FC<ImprovedStoryViewProps> = ({
  improvedStory,
  onRegenerate,
  onProceedToCharacters,
  isProcessing,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `# ${improvedStory.title}\n\nLogline: ${improvedStory.logline}\n\n${improvedStory.fullStory}\n\nSetting: ${improvedStory.usaSettingAdaptation}\nTone: ${improvedStory.cinematicTone}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-md mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-wider uppercase text-amber-300">
                Improved Story — USA Cinematic Adaptation
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                Hollywood Screenplay Grade
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Refined narrative with enhanced emotional impact, cinematic live-action transitions, and USA suburban context.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Story!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Improved Story</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRegenerate}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Regenerate Story</span>
          </button>

          <button
            type="button"
            onClick={onProceedToCharacters}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span>Lock Character Bible</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Logline Hero Box */}
      <div className="mt-5 p-5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 shadow-inner">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 block mb-1">
          Working Film Title
        </span>
        <h3 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
          {improvedStory.title}
        </h3>
        <p className="mt-2 text-xs md:text-sm text-amber-200/90 italic font-serif leading-relaxed">
          &ldquo;{improvedStory.logline}&rdquo;
        </p>
      </div>

      {/* Meta Indicators */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Cinematic Tone</span>
            <span className="text-xs text-slate-200 font-medium">{improvedStory.cinematicTone}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
          <Gauge className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Emotional Pacing</span>
            <span className="text-xs text-slate-200 font-medium">{improvedStory.emotionalPacing}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">USA Setting Adaptation</span>
            <span className="text-xs text-slate-200 font-medium">{improvedStory.usaSettingAdaptation}</span>
          </div>
        </div>
      </div>

      {/* Full Narrative Text */}
      <div className="mt-5 p-6 rounded-xl bg-slate-950 border border-slate-800 font-serif leading-relaxed text-slate-200 text-sm md:text-base space-y-4">
        {improvedStory.fullStory.split('\n\n').map((paragraph, index) => (
          <p key={index} className="indent-4 first:indent-0">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Continuity Guidelines */}
      {improvedStory.continuityGuidelines && improvedStory.continuityGuidelines.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Story Continuity Mandates</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald-200/90">
            {improvedStory.continuityGuidelines.map((guide, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold shrink-0">•</span>
                <span>{guide}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
