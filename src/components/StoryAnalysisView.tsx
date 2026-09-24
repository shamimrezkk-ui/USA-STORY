import React from 'react';
import {
  FileSearch,
  Compass,
  Users,
  Flame,
  CloudSun,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Box,
} from 'lucide-react';
import type { StoryAnalysis } from '../types/index.ts';

interface StoryAnalysisViewProps {
  analysis: StoryAnalysis;
  onProceedToNextStep: () => void;
  onReAnalyze: () => void;
  isProcessing: boolean;
}

export const StoryAnalysisView: React.FC<StoryAnalysisViewProps> = ({
  analysis,
  onProceedToNextStep,
  onReAnalyze,
  isProcessing,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-md mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-wider uppercase text-blue-300">
                Story Analysis Engine
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                Deep Analysis Complete
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracted narrative architecture, emotional beats, character relationships, and USA setting requirements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReAnalyze}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Re-Analyze</span>
          </button>

          <button
            type="button"
            onClick={onProceedToNextStep}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span>Generate Improved Story & Bible</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main storyline banner */}
      <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-blue-500/30">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          <span>Core Premise & Storyline</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {analysis.mainStoryline}
        </p>
      </div>

      {/* Three-column grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Dramatic Structure */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4.5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Flame className="w-4 h-4" />
            <span>Dramatic Arc</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                Beginning / Setup
              </span>
              <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {analysis.beginning}
              </p>
            </div>

            <div>
              <span className="font-bold text-rose-400 uppercase text-[10px] tracking-wider block mb-1">
                Inciting Conflict
              </span>
              <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {analysis.conflict}
              </p>
            </div>

            <div>
              <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block mb-1">
                Rising Action
              </span>
              <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {analysis.risingAction}
              </p>
            </div>

            <div>
              <span className="font-bold text-purple-400 uppercase text-[10px] tracking-wider block mb-1">
                Dramatic Climax
              </span>
              <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {analysis.climax}
              </p>
            </div>

            <div>
              <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block mb-1">
                Resolution & Aftermath
              </span>
              <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {analysis.resolution}
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: Characters Identified & Relationships */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4.5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Users className="w-4 h-4" />
            <span>Characters & Relationships</span>
          </h3>

          <div className="space-y-2.5">
            {analysis.charactersIdentified.map((char, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{char.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                      {char.type}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                      {char.role}
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">{char.briefSummary}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Dynamic Relationships
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/40 p-2 rounded-lg">
                {analysis.characterRelationships}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Emotional Progression
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/40 p-2 rounded-lg">
                {analysis.emotionalProgression}
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: USA Environment, Continuity & Visual Opportunities */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4.5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <MapPin className="w-4 h-4" />
            <span>USA Environment & Continuity</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                USA Setting Opportunities
              </span>
              <ul className="space-y-1">
                {analysis.usaEnvironmentOpportunities.map((loc, i) => (
                  <li
                    key={i}
                    className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-900/50 text-indigo-200 text-[11px] flex items-start gap-1.5"
                  >
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{loc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                  <CloudSun className="w-3 h-3 text-amber-400" />
                  Weather
                </span>
                <p className="text-slate-300 text-[11px]">{analysis.weatherConditions}</p>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Time Flow
                </span>
                <p className="text-slate-300 text-[11px]">{analysis.timeProgression}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-1">
                <Box className="w-3.5 h-3.5" />
                Tracked Important Objects
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.importantObjects.map((obj, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-700 text-[10px] font-medium"
                  >
                    {obj}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Locked Continuity Directives
              </span>
              <ul className="space-y-1">
                {analysis.continuityRequirements.map((req, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-emerald-200/90 bg-emerald-950/20 border border-emerald-900/40 p-1.5 rounded flex items-start gap-1"
                  >
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
