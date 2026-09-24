import React, { useState } from 'react';
import {
  Film,
  Camera,
  Copy,
  Check,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  Sliders,
  ChevronRight,
  SunMedium,
  Layers,
  Box,
  CornerDownRight,
  Ban,
  User,
  PawPrint,
  Lock,
  ImageIcon,
  Zap,
  Tag,
  Hash,
  FileText,
  Type,
} from 'lucide-react';
import type { SceneItem, CharacterBibleEntry, VideoPackage, ImprovedStory } from '../types/index.ts';

interface SceneBreakdownViewProps {
  scenes: SceneItem[];
  characters: CharacterBibleEntry[];
  onProceedToPackage: () => void;
  isProcessing: boolean;
  videoPackage?: VideoPackage | null;
  improvedStory?: ImprovedStory | null;
}

export const SceneBreakdownView: React.FC<SceneBreakdownViewProps> = ({
  scenes,
  characters,
  onProceedToPackage,
  isProcessing,
  videoPackage,
  improvedStory,
}) => {
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [copiedNegativeIndex, setCopiedNegativeIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCharPromptId, setCopiedCharPromptId] = useState<string | null>(null);
  const [selectedSceneFilter, setSelectedSceneFilter] = useState<number | 'all'>('all');

  // Metadata boxes copy states
  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedThumbnail, setCopiedThumbnail] = useState(false);

  const handleCopyTitle = (idx: number, title: string) => {
    navigator.clipboard.writeText(title);
    setCopiedTitleIndex(idx);
    setTimeout(() => setCopiedTitleIndex(null), 2500);
  };

  const handleCopyDesc = () => {
    if (!videoPackage?.seoDescription) return;
    navigator.clipboard.writeText(videoPackage.seoDescription);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2500);
  };

  const handleCopyTags = () => {
    if (!videoPackage?.tags) return;
    navigator.clipboard.writeText(videoPackage.tags.join(', '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2500);
  };

  const handleCopyHashtags = () => {
    if (!videoPackage?.hashtags) return;
    navigator.clipboard.writeText(videoPackage.hashtags.join(' '));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2500);
  };

  const handleCopyThumbnail = () => {
    if (!videoPackage?.masterThumbnailPrompt) return;
    navigator.clipboard.writeText(videoPackage.masterThumbnailPrompt);
    setCopiedThumbnail(true);
    setTimeout(() => setCopiedThumbnail(false), 2500);
  };

  const handleCopyPrompt = (index: number, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  const handleCopyCharPrompt = (id: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedCharPromptId(id);
    setTimeout(() => setCopiedCharPromptId(null), 2500);
  };

  const handleCopyNegative = (index: number, negativeText: string) => {
    navigator.clipboard.writeText(negativeText);
    setCopiedNegativeIndex(index);
    setTimeout(() => setCopiedNegativeIndex(null), 2500);
  };

  const handleCopyAllPrompts = () => {
    const allText = scenes
      .map(
        (s) =>
          `=== SCENE ${s.sceneNumber.toString().padStart(2, '0')}: ${s.sceneTitle.toUpperCase()} (${s.duration}) ===\nPROMPT:\n${s.fullVideoPrompt}\n\nNEGATIVE PROMPT:\n${s.negativeConstraints}\n\nCAMERA: ${s.cameraPlan?.framing || 'Medium Shot'}, ${s.cameraPlan?.movement || 'Dolly Push'}, ${s.cameraPlan?.lens || '50mm prime'}\nCONTINUITY: ${s.continuityNotes}\n`
      )
      .join('\n----------------------------------------\n\n');

    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const filteredScenes =
    selectedSceneFilter === 'all'
      ? scenes
      : scenes.filter((s) => s.sceneNumber === selectedSceneFilter);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-md mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-wider uppercase text-rose-300">
                Scene Breakdown & 8/10s Video Prompts
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                {scenes.length} Scenes Generated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready video prompts with Start State → Action → End State continuity linking and live-action camera directives.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAllPrompts}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">All Prompts Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy All Scene Prompts</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onProceedToPackage}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span>Generate Release Package</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Master Character Reference & Image Prompt Section */}
      {characters && characters.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Master Character Reference & Consistency Lock (ক্যারেক্টার ইমেজ ও রেফারেন্স প্রম্পট)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Generate this character image first in Midjourney / Flux / Imagen as your visual reference anchor.
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono self-start sm:self-auto">
              LOCKED VISUAL IDENTITY
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {characters.map((char) => {
              const isCopied = copiedCharPromptId === char.id;

              return (
                <div key={char.id} className="flex flex-col md:flex-row gap-4 items-start bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  {/* Portrait Thumbnail */}
                  <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-xl overflow-hidden border border-emerald-500/40 relative bg-slate-950">
                    {char.imageUrl ? (
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-2 text-center text-[10px]">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                        <span>{char.name}</span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1 bg-black/80 text-[9px] text-emerald-300 font-mono text-center rounded px-1 py-0.5">
                      {char.id}
                    </div>
                  </div>

                  {/* Character Master Prompt & Info */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{char.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800">
                          {char.type} • {char.speciesBreed || char.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCharPrompt(char.id, char.masterImagePrompt)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wide transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span>ইমেজ প্রম্পট কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Character Image Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-200 leading-relaxed select-all">
                      {char.masterImagePrompt}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{char.lockedIdentitySummary}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Metadata & Publishing Suite: Separate Distinct Boxes for Title, Description, Tags */}
      {videoPackage && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Video Metadata & Publishing Suite (আলাদা আলাদা বক্সে টাইটেল, ডেসক্রিপশন ও ট্যাগ)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ready-to-publish metadata for YouTube, TikTok, and Instagram Reels.
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono self-start sm:self-auto">
              SEPARATE COPY BOXES
            </span>
          </div>

          {/* Grid of Distinct Boxes: Titles & Thumbnail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Box 1: Video Titles (ভিডিও টাইটেল) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wide">
                    📌 ভিডিও টাইটেল (Video Titles)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {videoPackage.suggestedTitles.length} Options
                </span>
              </div>

              <div className="space-y-2">
                {videoPackage.suggestedTitles.map((item, idx) => {
                  const isCopied = copiedTitleIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-100 font-semibold truncate" title={item.title}>
                          {item.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyTitle(idx, item.title)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
                        title="Copy this title"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span className="text-[11px]">কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy Title</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Master 16:9 Thumbnail Prompt (থাম্বনেইল প্রম্পট) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 shadow-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-200 uppercase tracking-wide">
                      🎨 ইউটিউব থাম্বনেইল প্রম্পট (16:9 Thumbnail)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyThumbnail}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    {copiedThumbnail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-rose-200" />
                        <span className="text-[11px]">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy Thumbnail Prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-rose-200 leading-relaxed max-h-36 overflow-y-auto select-all">
                  {videoPackage.masterThumbnailPrompt}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Use in Midjourney / Flux with <code className="text-rose-300">--ar 16:9</code> for maximum Click-Through Rate (CTR).
              </p>
            </div>
          </div>

          {/* Grid of Distinct Boxes: Description & Tags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Box 3: Video Description (ভিডিও ডেসক্রিপশন) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 shadow-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                      📝 ভিডিও ডেসক্রিপশন (SEO Description)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyDesc}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    {copiedDesc ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-200" />
                        <span className="text-[11px]">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy Description</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                  {videoPackage.seoDescription}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Optimized with USA search terms and story background for YouTube search ranking.
              </p>
            </div>

            {/* Box 4: Tags & Hashtags (ট্যাগ ও হ্যাশট্যাগ) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/40 shadow-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-teal-200 uppercase tracking-wide">
                      🏷️ ট্যাগ ও হ্যাশট্যাগ (Tags & Hashtags)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyTags}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      {copiedTags ? (
                        <>
                          <Check className="w-3 h-3 text-teal-200" />
                          <span className="text-[10px]">Tags Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">Copy Tags</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyHashtags}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium cursor-pointer border border-teal-700 transition-all active:scale-95"
                    >
                      {copiedHashtags ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px]">Hashtags Copied!</span>
                        </>
                      ) : (
                        <>
                          <Hash className="w-3 h-3" />
                          <span className="text-[10px]">Copy Hashtags</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Comma-separated Tags Box */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 mb-2">
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">
                    YouTube Tags:
                  </span>
                  <p className="text-xs text-slate-300 font-mono select-all break-words leading-relaxed">
                    {videoPackage.tags.join(', ')}
                  </p>
                </div>

                {/* Hashtag Pills */}
                <div>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">
                    Hashtags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {videoPackage.hashtags.map((h, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-800/80 font-mono"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Copy and paste directly into YouTube Studio Tags and Social descriptions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter by Scene */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800/80">
        <span className="text-xs font-semibold text-slate-400 pr-2">Jump to Scene:</span>
        <button
          type="button"
          onClick={() => setSelectedSceneFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            selectedSceneFilter === 'all'
              ? 'bg-rose-500 text-slate-950 font-bold'
              : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
          }`}
        >
          All ({scenes.length})
        </button>
        {scenes.map((scene) => (
          <button
            key={scene.sceneNumber}
            type="button"
            onClick={() => setSelectedSceneFilter(scene.sceneNumber)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedSceneFilter === scene.sceneNumber
                ? 'bg-rose-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Scene {scene.sceneNumber.toString().padStart(2, '0')}
          </button>
        ))}
      </div>

      {/* Scenes List */}
      <div className="mt-6 space-y-8">
        {filteredScenes.map((scene) => {
          const isCopied = copiedPromptIndex === scene.sceneNumber;
          const isNegativeCopied = copiedNegativeIndex === scene.sceneNumber;

          return (
            <div
              key={scene.sceneNumber}
              className="bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all p-5 md:p-6 shadow-xl relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

              {/* Scene Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-mono font-black text-base shrink-0">
                    {scene.sceneNumber.toString().padStart(2, '0')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-100">
                        {scene.sceneTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/40">
                        {scene.duration}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Story Purpose: <span className="text-slate-300">{scene.storyPurpose}</span>
                    </p>
                  </div>
                </div>

                {/* Character Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500 mr-1 font-medium">Characters:</span>
                  {scene.charactersPresent.map((charId) => (
                    <span
                      key={charId}
                      className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold"
                    >
                      {charId}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action System: START STATE -> ACTION -> END STATE */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Scene Action Flow (Start State → Action → End State)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Start State */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                        1. Start State (0.0s)
                      </span>
                      <p className="text-slate-200 leading-relaxed">{scene.actionSystem?.startState || 'Initial position'}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-amber-500/30 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block mb-1">
                        2. Physical Action ({scene.duration})
                      </span>
                      <p className="text-amber-100 font-medium leading-relaxed">{scene.actionSystem?.actionMiddle || (scene.actionSystem as any)?.action || 'Physical movement unfolds'}</p>
                    </div>
                  </div>

                  {/* End State */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block mb-1 flex items-center gap-1">
                        3. End State (Bridge to Next Scene)
                        <CornerDownRight className="w-3 h-3 text-emerald-400" />
                      </span>
                      <p className="text-emerald-100 leading-relaxed">{scene.actionSystem?.endState || 'Ending posture for continuity'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Environment, Lighting & Camera Spec Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* USA Environment & Location */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    USA Environment & Setting
                  </span>
                  <p className="text-slate-200 font-medium">{scene.location || 'USA Setting'}</p>
                  <p className="text-slate-400 text-[11px]">{scene.usaEnvironmentDetails || scene.location || 'American suburban environment'}</p>
                </div>

                {/* Time, Weather & Lighting */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <SunMedium className="w-3.5 h-3.5" />
                    Atmosphere & Lighting
                  </span>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span>{scene.timeOfDay || 'Dusk'}</span>
                    <span>•</span>
                    <span>{scene.weather || 'Atmospheric'}</span>
                  </div>
                  <p className="text-amber-200/90 text-[11px] font-medium">{scene.cameraPlan?.lighting || 'Cinematic ambient light'}</p>
                </div>

                {/* Camera Plan */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    Cinematic Camera System
                  </span>
                  <div className="text-slate-200">
                    <strong>Framing:</strong> {scene.cameraPlan?.framing || 'Medium Shot'}
                  </div>
                  <div className="text-slate-200">
                    <strong>Movement:</strong> {scene.cameraPlan?.movement || 'Slow push-in'}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {scene.cameraPlan?.lens || '50mm prime'} | {scene.cameraPlan?.depthOfField || 'Shallow depth of field'}
                  </div>
                </div>
              </div>

              {/* Continuity Notes & Tracked Objects */}
              <div className="mt-3 flex flex-col sm:flex-row items-stretch gap-3 text-xs">
                <div className="flex-1 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                      Continuity Lock Check
                    </span>
                    <p className="text-emerald-200/90 text-[11px]">{scene.continuityNotes}</p>
                  </div>
                </div>

                {scene.importantObjects && scene.importantObjects.length > 0 && (
                  <div className="sm:w-64 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                      <Box className="w-3 h-3 text-amber-400" />
                      Tracked Objects
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {scene.importantObjects.map((obj, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px]">
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Master Full Video Prompt Output Box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-rose-500/40 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                      Scene {scene.sceneNumber.toString().padStart(2, '0')} — Video Prompt ({scene.duration})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(scene.sceneNumber, scene.fullVideoPrompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer active:scale-95 shadow"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-slate-950" />
                        <span>Copied Prompt!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-950" />
                        <span>Copy Video Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-rose-100 font-mono leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-slate-800 select-all">
                  {scene.fullVideoPrompt}
                </p>

                {/* Negative Constraints Prompt */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="font-semibold text-rose-400">Negative Prompt:</span>
                    <span className="text-slate-300 truncate max-w-xl">{scene.negativeConstraints}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyNegative(scene.sceneNumber, scene.negativeConstraints)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    {isNegativeCopied ? 'Copied Negative!' : 'Copy Negative'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
