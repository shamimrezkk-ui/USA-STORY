import React, { useState } from 'react';
import {
  PackageCheck,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Tag,
  Hash,
  FileText,
  Sparkles,
  Share2,
  ListOrdered,
} from 'lucide-react';
import type { VideoPackage, SceneItem, CharacterBibleEntry, ImprovedStory } from '../types/index.ts';

interface VideoPackageViewProps {
  videoPackage: VideoPackage;
  improvedStory: ImprovedStory;
  scenes: SceneItem[];
  characters: CharacterBibleEntry[];
}

export const VideoPackageView: React.FC<VideoPackageViewProps> = ({
  videoPackage,
  improvedStory,
  scenes,
  characters,
}) => {
  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedThumbnail, setCopiedThumbnail] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedAllPackage, setCopiedAllPackage] = useState(false);

  const handleCopyTitle = (idx: number, title: string) => {
    navigator.clipboard.writeText(title);
    setCopiedTitleIndex(idx);
    setTimeout(() => setCopiedTitleIndex(null), 2500);
  };

  const handleCopyDesc = () => {
    navigator.clipboard.writeText(videoPackage.seoDescription);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2500);
  };

  const handleCopyThumbnail = () => {
    navigator.clipboard.writeText(videoPackage.masterThumbnailPrompt);
    setCopiedThumbnail(true);
    setTimeout(() => setCopiedThumbnail(false), 2500);
  };

  const handleCopyTags = () => {
    const combined = [...videoPackage.tags, ...videoPackage.hashtags].join(', ');
    navigator.clipboard.writeText(combined);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2500);
  };

  const generateFullMarkdown = () => {
    return `# USA STORY CINEMATIC AI — COMPLETE PRODUCTION BIBLE

## FILM TITLE: ${improvedStory.title}
**Logline:** ${improvedStory.logline}
**Cinematic Tone:** ${improvedStory.cinematicTone}
**USA Setting:** ${improvedStory.usaSettingAdaptation}

---

## 1. IMPROVED SCREENPLAY / STORY
${improvedStory.fullStory}

---

## 2. CHARACTER BIBLE & CONSISTENCY LOCKS
${characters
  .map(
    (c) => `### [${c.id}] ${c.name} (${c.type})
- **Species / Breed:** ${c.speciesBreed}
- **Age / Gender:** ${c.age} / ${c.gender}
- **Locked Visual Identity:** ${c.lockedIdentitySummary}
- **Master Reference Prompt:** ${c.masterImagePrompt}
`
  )
  .join('\n')}

---

## 3. SCENE BREAKDOWN & VIDEO PROMPTS
${scenes
  .map(
    (s) => `### SCENE ${s.sceneNumber.toString().padStart(2, '0')}: ${s.sceneTitle} (${s.duration})
- **Story Purpose:** ${s.storyPurpose}
- **Characters:** ${s.charactersPresent.join(', ')}
- **Location:** ${s.location} (${s.usaEnvironmentDetails})
- **Atmosphere:** ${s.timeOfDay} | ${s.weather}
- **Action Flow:**
  - Start State (0s): ${s.actionSystem.startState}
  - Physical Action: ${s.actionSystem.actionMiddle}
  - End State: ${s.actionSystem.endState}
- **Camera Plan:** ${s.cameraPlan.framing}, ${s.cameraPlan.movement}, ${s.cameraPlan.lens}
- **Continuity Lock:** ${s.continuityNotes}

**VIDEO PROMPT:**
\`\`\`
${s.fullVideoPrompt}
\`\`\`

**NEGATIVE PROMPT:**
\`\`\`
${s.negativeConstraints}
\`\`\`
`
  )
  .join('\n\n')}

---

## 4. MASTER THUMBNAIL PROMPT (16:9)
\`\`\`
${videoPackage.masterThumbnailPrompt}
\`\`\`

---

## 5. VIDEO RELEASE METADATA
### Suggested Titles:
${videoPackage.suggestedTitles.map((t) => `- [${t.category}] ${t.title}`).join('\n')}

### SEO Description:
${videoPackage.seoDescription}

### Tags:
${videoPackage.tags.join(', ')}

### Hashtags:
${videoPackage.hashtags.join(' ')}
`;
  };

  const handleDownloadMarkdown = () => {
    const md = generateFullMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${improvedStory.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_production_bible.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const data = {
      filmTitle: improvedStory.title,
      logline: improvedStory.logline,
      improvedStory,
      characters,
      scenes,
      videoPackage,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${improvedStory.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_project_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCompletePackage = () => {
    const full = generateFullMarkdown();
    navigator.clipboard.writeText(full);
    setCopiedAllPackage(true);
    setTimeout(() => setCopiedAllPackage(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-md mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-lg text-slate-950 font-bold">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-wider uppercase text-amber-300">
                Final Video Package & Release Kit
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                YouTube / TikTok Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-CTR titles, full SEO description with chapters, hashtags, master thumbnail prompt, and complete export options.
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCompletePackage}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            {copiedAllPackage ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Package!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Full Bible</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown (.md)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Separate Distinct Boxes for Title, Description, Tags, and Thumbnail Prompt */}
      <div className="mt-6 space-y-4">
        {/* Title Box */}
        <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>📌 ভিডিও টাইটেল (Title Box - 3 Categories)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              YouTube & Social Optimized
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {videoPackage.suggestedTitles.map((t, idx) => {
              const isCopied = copiedTitleIndex === idx;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 text-xs hover:border-indigo-500/40 transition-colors"
                >
                  <div>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mb-1.5 ${
                        t.category === 'Cinematic'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : t.category.includes('CTR')
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {t.category}
                    </span>
                    <p className="text-slate-100 font-semibold leading-snug">{t.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyTitle(idx, t.title)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all cursor-pointer active:scale-95 shadow-sm"
                    title="Copy title"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Title</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Thumbnail Prompt Box */}
        <div className="p-5 rounded-xl bg-slate-950 border border-rose-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                🎨 থাম্বনেইল প্রম্পট (Thumbnail Prompt Box - 16:9 Cinematic Composition)
              </h4>
            </div>
            <button
              type="button"
              onClick={handleCopyThumbnail}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold tracking-wider transition-all cursor-pointer active:scale-95 shadow"
            >
              {copiedThumbnail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rose-200" />
                  <span>কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Thumbnail Prompt</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-rose-100 font-mono leading-relaxed bg-rose-950/20 p-3.5 rounded-lg border border-rose-900/40 select-all">
            {videoPackage.masterThumbnailPrompt}
          </p>
          <p className="text-[11px] text-slate-400">
            Use in Midjourney (v6/v7) with <code className="text-rose-300 font-mono">--ar 16:9 --style raw</code> or Flux Pro for ultra-high-CTR cover art.
          </p>
        </div>

        {/* SEO Description Box & Tags Box (Side by Side Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Box 3: Description Box */}
          <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-5 space-y-3 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  📝 ভিডিও ডেসক্রিপশন (Description Box - SEO YouTube & TikTok)
                </span>
                <button
                  type="button"
                  onClick={handleCopyDesc}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  {copiedDesc ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-200" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Description</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto p-3 bg-slate-900/80 border border-slate-800 rounded-lg select-all">
                {videoPackage.seoDescription}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Full synopsis, emotional hooks, and USA setting background for YouTube search ranking.
            </p>
          </div>

          {/* Box 4: Tags & Hashtags Box */}
          <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-5 space-y-3 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-teal-400" />
                  🏷️ ট্যাগ ও হ্যাশট্যাগ (Tags & Hashtags Box)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTags}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    {copiedTags ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-200" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All Tags</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Comma-separated Tags Box */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 mb-3">
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">
                  YouTube Tags (কমা দিয়ে সাজানো):
                </span>
                <p className="text-xs text-slate-300 font-mono select-all break-words leading-relaxed">
                  {videoPackage.tags.join(', ')}
                </p>
              </div>

              {/* Hashtag Pills */}
              <div>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1.5">
                  Hashtags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {videoPackage.hashtags.map((h, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-800/80 text-xs font-mono font-medium"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {videoPackage.youtubeChapters && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1 flex items-center gap-1">
                  <ListOrdered className="w-3 h-3 text-amber-400" />
                  Video Chapters
                </span>
                <pre className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded">
                  {videoPackage.youtubeChapters}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
