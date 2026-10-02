import React, { useState, useRef } from 'react';
import {
  Video,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Film,
  X,
  FileVideo,
  Layers,
  ArrowRight,
  Clock,
  User,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { apiAnalyzeVideo, type VideoStoryExtraction } from '../services/apiClient.ts';

interface VideoUploadAnalyzerProps {
  onStoryExtracted: (storyText: string) => void;
  onGenerateAllPrompts?: () => void;
  selectedModel?: string;
  apiKey?: string;
  disabled?: boolean;
}

export const VideoUploadAnalyzer: React.FC<VideoUploadAnalyzerProps> = ({
  onStoryExtracted,
  onGenerateAllPrompts,
  selectedModel = 'gemini-3.8-flash',
  apiKey,
  disabled = false,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [isSamplingFrames, setIsSamplingFrames] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<VideoStoryExtraction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoGenerateAfterAnalysis, setAutoGenerateAfterAnalysis] = useState<boolean>(true);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  // Extract representative keyframe snapshots across the video duration
  const sampleKeyframesFromVideo = async (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      const frames: string[] = [];
      const numFrames = 6;

      video.onloadedmetadata = async () => {
        const duration = video.duration || 10;
        setVideoDuration(Math.round(duration));

        const canvas = document.createElement('canvas');
        // Cap canvas resolution for fast base64 encoding and optimal AI vision
        const maxW = 640;
        const scale = Math.min(1, maxW / (video.videoWidth || 640));
        canvas.width = Math.round((video.videoWidth || 640) * scale);
        canvas.height = Math.round((video.videoHeight || 360) * scale);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve([]);
          return;
        }

        const intervals = Array.from({ length: numFrames }, (_, i) =>
          Math.min(duration - 0.2, Math.max(0.1, (duration / (numFrames + 1)) * (i + 1)))
        );

        for (const time of intervals) {
          await new Promise<void>((resSeek) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                frames.push(dataUrl);
              } catch {}
              resSeek();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;
          });
        }

        URL.revokeObjectURL(url);
        resolve(frames);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    setAnalysisResult(null);
    setVideoFile(file);

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);

    // Sample keyframes in background for visual timeline strip
    setIsSamplingFrames(true);
    try {
      const frames = await sampleKeyframesFromVideo(file);
      setExtractedFrames(frames);
    } catch {
      console.warn('Could not extract video frames');
    } finally {
      setIsSamplingFrames(false);
    }
  };

  const handleClearVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoDuration(null);
    setExtractedFrames([]);
    setAnalysisResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!videoFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisProgress('ভিডিও ফ্রেম ও দৃশ্যপট বিশ্লেষণ করা হচ্ছে...');

    try {
      let videoBase64: string | undefined = undefined;

      // If file is smaller than 25MB, encode base64 for direct multimodal audio/visual
      if (videoFile.size <= 25 * 1024 * 1024) {
        setAnalysisProgress('ভিডিও ডেটা এআই ইঞ্জিনে আপলোড হচ্ছে (~' + (videoFile.size / (1024 * 1024)).toFixed(1) + ' MB)...');
        videoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(videoFile);
        });
      }

      setAnalysisProgress('Gemini AI ভিডিওর মূল সারাংশ, চরিত্র ও গল্প বিশ্লেষণ করছে...');

      const result = await apiAnalyzeVideo(
        {
          videoBase64,
          mimeType: videoFile.type || 'video/mp4',
          keyframes: extractedFrames,
          fileName: videoFile.name,
        },
        selectedModel,
        apiKey
      );

      setAnalysisResult(result);

      // Automatically populate story text into story input box
      const formattedStoryText = `${result.bengaliStory}\n\n[ENGLISH SCREENPLAY ADAPTATION]:\n${result.fullStory}`;
      onStoryExtracted(formattedStoryText);

      setAnalysisProgress('');

      // If auto-generate is active, trigger generation of all prompts immediately
      if (autoGenerateAfterAnalysis && onGenerateAllPrompts) {
        setTimeout(() => {
          onGenerateAllPrompts();
        }, 400);
      }
    } catch (err: any) {
      console.error('Video analysis failed:', err);
      setErrorMessage(err.message || 'ভিডিও বিশ্লেষণ ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন বা অন্য ফরম্যাট আপলোড করুন।');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const handleCopySummary = () => {
    if (!analysisResult?.summary) return;
    navigator.clipboard.writeText(analysisResult.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 shrink-0 shadow-sm">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wider uppercase text-teal-300">
                ভিডিও আপলোড: সারাংশ বের করে সম্পূর্ণ প্রম্পট তৈরি (Video to Story)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 font-mono font-bold">
                Multimodal AI Vision
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              যেকোনো ভিডিও আপলোড করুন। AI ভিডিও দেখে মূল সারাংশ বের করবে এবং সেই গল্প দিয়েই হলিউড-মানের সব ভিডিও ও ইমেজ প্রম্পট বানাবে।
            </p>
          </div>
        </div>

        {videoFile && (
          <button
            type="button"
            onClick={handleClearVideo}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold transition-all cursor-pointer shadow self-start sm:self-auto"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>নতুন ভিডিও দিন</span>
          </button>
        )}
      </div>

      {/* Main Upload Dropzone or Video Preview */}
      {!videoFile ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 border-2 border-dashed border-slate-700/80 hover:border-teal-400/80 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950/90 transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-teal-500/10 group-hover:bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 transition-all shadow-md group-hover:scale-105">
            <Upload className="w-6 h-6" />
          </div>

          <h4 className="text-sm font-bold text-slate-200 group-hover:text-white">
            ভিডিও ফাইল নির্বাচন করুন অথবা এখানে ড্র্যাগ করে ফেলুন
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            সাপোর্টেড ফরম্যাট: <span className="text-teal-300 font-semibold">MP4, WebM, MOV</span> (মোবাইল বা ক্যামেরা ফুটেজ)
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-teal-950/50">
            <FileVideo className="w-4 h-4" />
            <span>Select Video from Device (ভিডিও আপলোড)</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Video Preview & File Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
            {/* Left: Video Player */}
            <div className="md:col-span-5 rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center relative aspect-video">
              {videoPreviewUrl && (
                <video
                  ref={videoPlayerRef}
                  src={videoPreviewUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Right: File details & Action */}
            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-100 truncate" title={videoFile.name}>
                    {videoFile.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>দৈর্ঘ্য: {videoDuration ? `${videoDuration}s` : 'ক্যালকুলেট হচ্ছে...'}</span>
                  </span>
                  <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                    সাইজ: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 uppercase font-mono text-[10px] text-teal-300">
                    {videoFile.type || 'Video'}
                  </span>
                </div>

                {/* Keyframes Strip Preview */}
                {extractedFrames.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5">
                      <Layers className="w-3 h-3 text-teal-400" />
                      <span>ভিডিও টাইমলাইন দৃশ্যপট ({extractedFrames.length}টি কি-ফ্রেম):</span>
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                      {extractedFrames.map((frame, idx) => (
                        <img
                          key={idx}
                          src={frame}
                          alt={`Keyframe ${idx + 1}`}
                          className="w-14 h-9 object-cover rounded-lg border border-slate-700/80 shrink-0 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                {/* Auto-generate checkbox */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoGenerateAfterAnalysis}
                    onChange={(e) => setAutoGenerateAfterAnalysis(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>ভিডিওর সারাংশ বের হওয়ার সাথে সাথেই স্বয়ংক্রিয়ভাবে সব প্রম্পট তৈরি করুন</span>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleAnalyzeVideo}
                  disabled={isAnalyzing || disabled}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-teal-950/60 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{analysisProgress || 'ভিডিও বিশ্লেষণ হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                      <span>📹 এই ভিডিও থেকে সারাংশ বের করুন ও সবকিছু বানান (Extract Story &amp; Build Everything)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 shadow">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Analysis Result Highlight Box */}
          {analysisResult && (
            <div className="p-4 sm:p-5 rounded-2xl bg-teal-950/40 border border-teal-500/50 shadow-2xl space-y-3.5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-teal-800/60">
                <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ভিডিওর সারাংশ সফলভাবে বের হয়েছে এবং ইনপুট বক্সে গল্প সেট করা হয়েছে!</span>
                </div>
                {onGenerateAllPrompts && (
                  <button
                    type="button"
                    onClick={onGenerateAllPrompts}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>🚀 এই গল্প দিয়ে সবকিছু তৈরি করুন (Generate All)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Summary Highlight Box */}
              <div className="bg-slate-950/90 p-4 rounded-xl border border-teal-500/40 shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📌</span>
                    <span>ভিডিওর মূল সারাংশ (Extracted Core Summary):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-700/60 text-teal-300 text-[11px] font-medium transition cursor-pointer"
                  >
                    {copiedSummary ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSummary ? 'কপি হয়েছে' : 'সারাংশ কপি'}</span>
                  </button>
                </div>
                <p className="text-sm text-slate-100 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Character & Setting Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {analysisResult.identifiedCharacters.length > 0 && (
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1.5">
                      <User className="w-3 h-3 text-amber-400" />
                      <span>ভিডিওতে চিহ্নিত চরিত্রসমূহ:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.identifiedCharacters.map((char, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-amber-200 text-[11px] font-medium">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.setting && (
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>ভিডিওর দৃশ্যপট ও পরিবেশ:</span>
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {analysisResult.setting}
                    </p>
                  </div>
                )}
              </div>

              {/* Key Events Chronology */}
              {analysisResult.keyEvents && analysisResult.keyEvents.length > 0 && (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-[11px] font-bold text-slate-300 block mb-1">
                    🎬 ভিডিওর ক্রমানুযায়ী ঘটনাবলি (Key Events):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {analysisResult.keyEvents.map((evt, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                        <span className="font-mono text-teal-400 font-bold">{idx + 1}.</span>
                        <span>{evt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

