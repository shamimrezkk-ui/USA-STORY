import React, { useState } from 'react';
import {
  Users,
  Lock,
  Copy,
  Check,
  Camera,
  Heart,
  Activity,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  PawPrint,
  User,
  Eye,
  Tag,
  ImageIcon,
} from 'lucide-react';
import type { CharacterBibleEntry } from '../types/index.ts';

interface CharacterBibleViewProps {
  characters: CharacterBibleEntry[];
  onProceedToScenes: () => void;
  onRegenerateCharacters?: () => void;
  isProcessing: boolean;
}

export const CharacterBibleView: React.FC<CharacterBibleViewProps> = ({
  characters,
  onProceedToScenes,
  isProcessing,
}) => {
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedLockId, setCopiedLockId] = useState<string | null>(null);

  const activeChar = characters[selectedCharacterIndex] || characters[0];

  const handleCopyPrompt = (id: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  const handleCopyLock = (id: string, lockSummary: string) => {
    navigator.clipboard.writeText(lockSummary);
    setCopiedLockId(id);
    setTimeout(() => setCopiedLockId(null), 2500);
  };

  const isAnimal =
    activeChar &&
    (activeChar.type === 'Cat' ||
      activeChar.type === 'Dog' ||
      activeChar.type === 'Other Animal');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-md mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-wider uppercase text-emerald-300">
                Character Bible & Consistency Lock
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {characters.length} Character{characters.length !== 1 ? 's' : ''} Locked
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanent visual identities and locked reference prompts ensuring zero drift across all 8-10s scenes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceedToScenes}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <span>Generate Scene Prompts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Character Tab Bar */}
      <div className="mt-5 flex flex-wrap gap-2 pb-2 border-b border-slate-800/80">
        {characters.map((char, idx) => {
          const isSelected = selectedCharacterIndex === idx;
          const charIsAnimal =
            char.type === 'Cat' || char.type === 'Dog' || char.type === 'Other Animal';

          return (
            <button
              key={char.id}
              type="button"
              onClick={() => setSelectedCharacterIndex(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {charIsAnimal ? <PawPrint className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              <span>{char.id} — {char.name}</span>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                  isSelected ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {char.type}
              </span>
            </button>
          );
        })}
      </div>

      {activeChar && (
        <div className="mt-6 space-y-6">
          {/* Active Character Identity Hero Box & Visual Image */}
          <div className="p-5 rounded-xl bg-slate-950 border border-emerald-500/40 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left Column: Information and Lock Token */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/30">
                      {activeChar.id}
                    </span>
                    <h3 className="text-xl font-bold text-slate-100">{activeChar.name}</h3>
                    <span className="text-xs text-slate-400">({activeChar.speciesBreed || activeChar.type})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Age: <strong className="text-slate-200">{activeChar.age || '8 weeks'}</strong></span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">Gender: <strong className="text-slate-200">{activeChar.gender || 'Not specified'}</strong></span>
                  </div>
                </div>

                {/* Permanent Consistency Lock Banner */}
                <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{activeChar.id} — LOCKED VISUAL IDENTITY TOKEN</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLock(activeChar.id, activeChar.lockedIdentitySummary)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      {copiedLockId === activeChar.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied Lock Token!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Lock Token</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-200 font-mono leading-relaxed bg-slate-950/80 p-2.5 rounded border border-emerald-900/60">
                    {activeChar.lockedIdentitySummary}
                  </p>
                  <div className="mt-2 text-[10px] text-emerald-400/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    This identical token is systematically embedded into every scene video prompt below.
                  </div>
                </div>

                {/* Specialized Animal Lock Notice if Animal */}
                {isAnimal && (
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">Animal Consistency Lock Engaged:</strong> Fur color, stripe pattern, eye color, collar, ear shape, and white paw markings are permanently locked. No random mutations will occur between scenes.
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Character Visual Portrait */}
              <div className="w-full lg:w-72 shrink-0 flex flex-col items-center">
                <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 relative shadow-2xl group">
                  {activeChar.imageUrl ? (
                    <img
                      src={activeChar.imageUrl}
                      alt={activeChar.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-950">
                      <ImageIcon className="w-12 h-12 text-slate-600 mb-2" />
                      <span className="text-xs font-semibold text-slate-400">Master Reference Portrait</span>
                      <span className="text-[10px] text-slate-500 mt-1">Prompt Generated Below</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
                    MASTER VISUAL LOCK
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] text-slate-200 text-center font-medium">
                    {activeChar.name} ({activeChar.type})
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 text-center font-medium">
                  Reference portrait for Midjourney / Flux / Imagen
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Visual Specs */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Anatomy & Visual Appearance</span>
              </h4>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Body Type</span>
                <p className="text-slate-200 mt-0.5">{activeChar.bodyType || 'Lean, natural build'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Face & Eyes</span>
                <p className="text-slate-200 mt-0.5">Face: {activeChar.face || 'Expressive features'}</p>
                <p className="text-slate-200 mt-0.5">Eyes: <strong className="text-cyan-300">{activeChar.eyes || 'Luminous eyes'}</strong></p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  {isAnimal ? 'Fur & Stripe Pattern' : 'Hair & Hairstyle'}
                </span>
                <p className="text-slate-200 mt-0.5">{activeChar.hairFur || 'Natural coat'}</p>
                {activeChar.furPattern && (
                  <p className="text-amber-300/90 mt-0.5 font-medium">Pattern: {activeChar.furPattern}</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Skin / Paw Pads</span>
                <p className="text-slate-200 mt-0.5">{activeChar.skin || 'Natural'}</p>
              </div>
            </div>

            {/* Clothing & Accessories */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Wardrobe & Locked Accessories</span>
              </h4>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Clothing / Layers</span>
                <p className="text-slate-200 mt-0.5">{activeChar.clothing || 'None'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Locked Accessories</span>
                <p className="text-amber-200 font-medium mt-0.5">{activeChar.accessories || 'Collar or signature accessory'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Distinctive Markings</span>
                <p className="text-slate-200 mt-0.5">{activeChar.distinctiveMarkings || 'Unique identification features'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Critical Visual Details</span>
                <p className="text-slate-200 mt-0.5">{activeChar.importantVisualDetails || activeChar.lockedIdentitySummary}</p>
              </div>
            </div>

            {/* Behavior & Movement Style */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Personality & Motion Realism</span>
              </h4>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Personality</span>
                <p className="text-slate-200 mt-0.5">{activeChar.personality || 'Grounded and observant'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Emotional Behavior</span>
                <p className="text-slate-200 mt-0.5">{activeChar.emotionalBehavior || 'Subtle emotional expressions'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Movement Style & Physics</span>
                <p className="text-slate-200 mt-0.5">{activeChar.movementStyle || 'Realistic 24fps organic movement'}</p>
              </div>
            </div>
          </div>

          {/* Master Character Reference Image Prompt Box */}
          <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/40 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Master Character Image Prompt (For Midjourney / Flux / Imagen)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopyPrompt(activeChar.id, activeChar.masterImagePrompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                {copiedPromptId === activeChar.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied Master Prompt!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Master Prompt</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-indigo-100 font-mono leading-relaxed bg-indigo-950/30 p-3.5 rounded-lg border border-indigo-900/50 select-all">
              {activeChar.masterImagePrompt}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Generate this reference portrait first. Use it as the image-to-video or reference-image anchor to ensure 100% character face and fur continuity across all generated video scenes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
