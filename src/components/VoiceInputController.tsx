import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  BookOpen,
  ChevronDown,
  Trash2,
  Volume2,
  Check,
  AlertCircle,
  Loader2,
  Upload,
  FileAudio,
  Radio,
  Zap,
} from 'lucide-react';
import { SAMPLE_STORIES } from '../data/sampleStories.ts';
import { apiFormatVoiceTranscript, apiTranscribeVoiceAudio } from '../services/apiClient.ts';

interface VoiceInputControllerProps {
  currentStoryText: string;
  onUpdateStoryText: (text: string) => void;
  voiceLanguage: string;
  onVoiceLanguageChange: (lang: string) => void;
  selectedModel: string;
  apiKey: string;
  disabled?: boolean;
}

export const VoiceInputController: React.FC<VoiceInputControllerProps> = ({
  currentStoryText,
  onUpdateStoryText,
  voiceLanguage,
  onVoiceLanguageChange,
  selectedModel,
  apiKey,
  disabled = false,
}) => {
  // MediaRecorder state (Universal across all browsers)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [liveInterimSpeech, setLiveInterimSpeech] = useState<string>('');
  const [insertMode, setInsertMode] = useState<'append' | 'replace'>('append');

  // AI Polish state
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSampleMenu, setShowSampleMenu] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Close sample menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSampleMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Professional Voice Recording (Universal across all browsers via MediaRecorder & Gemini AI)
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLiveInterimSpeech('');
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('আপনার ব্রাউজারে মাইক্রোফোন সাপোর্ট পাওয়া যায়নি। দয়া করে অডিও ফাইল আপলোড অপশনটি ব্যবহার করুন।');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Select optimal audio mime type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });
        if (audioBlob.size > 0) {
          await processRecordedAudioBlob(audioBlob, recorder.mimeType || mimeType);
        }
        // Stop audio tracks to release microphone icon
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start(250); // Slice data every 250ms
      setIsRecording(true);

      // Optional: If browser supports SpeechRecognition, run it alongside for live visual interim preview
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const liveSpeech = new SpeechRecognition();
          liveSpeech.continuous = true;
          liveSpeech.interimResults = true;
          liveSpeech.lang = voiceLanguage;
          liveSpeech.onresult = (ev: any) => {
            let interim = '';
            for (let i = ev.resultIndex; i < ev.results.length; i++) {
              interim += ev.results[i][0].transcript;
            }
            if (interim) {
              setLiveInterimSpeech(interim);
            }
          };
          liveSpeech.onerror = () => {};
          liveSpeech.start();
          speechRecognitionRef.current = liveSpeech;
        }
      } catch {}
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'মাইক্রোফোনের অনুমতি পাওয়া যায়নি। দয়া করে ব্রাউজারের অ্যাড্রেস বারের লক বা মাইক্রোফোন আইকনে ক্লিক করে Permission Allow করুন।'
        );
      } else {
        setErrorMessage(`মাইক্রোফোন চালু করা যায়নি: ${err.message || err}`);
      }
      setIsRecording(false);
    }
  };

  // Stop Recording and trigger Gemini Audio Intelligence
  const handleStopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Cancel Recording without processing
  const handleCancelRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null; // Detach processing
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setLiveInterimSpeech('');
    setErrorMessage(null);
  };

  // Send Recorded Audio to Gemini Speech Intelligence (Handles disorganized, mumbled, colloquial speech)
  const processRecordedAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsProcessingAudio(true);
    setProcessingStatus('Gemini AI আপনার কণ্ঠ বিশ্লেষণ করছে এবং এলোমেলো কথা ঠিক করে গল্প সাজাচ্ছে...');
    setErrorMessage(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const langPref = voiceLanguage.startsWith('bn') ? 'bn' : voiceLanguage.startsWith('en') ? 'en' : 'auto';
      const result = await apiTranscribeVoiceAudio(
        base64Data,
        mimeType || 'audio/webm',
        langPref,
        selectedModel,
        apiKey
      );

      const generatedStory = (result.polishedStory || result.rawTranscript || '').trim();

      if (generatedStory) {
        if (insertMode === 'replace') {
          onUpdateStoryText(generatedStory);
        } else {
          const base = currentStoryText.trim();
          onUpdateStoryText(base ? `${base}\n\n${generatedStory}` : generatedStory);
        }

        const summaryNote = result.summary ? ` (${result.summary})` : '';
        setSuccessMessage(`✓ আপনার কথা সফলভাবে গৃহীত হয়েছে এবং এলোমেলো অংশ সংশোধন করে সাজানো হয়েছে!${summaryNote}`);
        setTimeout(() => setSuccessMessage(null), 6000);
      } else {
        setErrorMessage('কোনো স্পষ্ট কথা শোনা যায়নি। দয়া করে আবার বলুন।');
      }
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      setErrorMessage(err.message || 'ভয়েস প্রসেসিং ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsProcessingAudio(false);
      setProcessingStatus('');
      setLiveInterimSpeech('');
    }
  };

  // Handle Audio File Upload (.mp3, .m4a, .wav, .ogg, .webm)
  const handleAudioFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAudio(true);
    setProcessingStatus(`'${file.name}' অডিও ফাইল থেকে কথা বিশ্লেষণ ও গল্প সাজানো হচ্ছে...`);
    setErrorMessage(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const langPref = voiceLanguage.startsWith('bn') ? 'bn' : 'auto';
      const result = await apiTranscribeVoiceAudio(
        base64Data,
        file.type || 'audio/mp4',
        langPref,
        selectedModel,
        apiKey
      );

      const generatedStory = (result.polishedStory || result.rawTranscript || '').trim();
      if (generatedStory) {
        if (insertMode === 'replace') {
          onUpdateStoryText(generatedStory);
        } else {
          const base = currentStoryText.trim();
          onUpdateStoryText(base ? `${base}\n\n${generatedStory}` : generatedStory);
        }
        setSuccessMessage(`✓ '${file.name}' অডিও থেকে গল্প সফলভাবে তৈরি হয়েছে! (${result.summary})`);
        setTimeout(() => setSuccessMessage(null), 6000);
      } else {
        setErrorMessage('অডিও ফাইল থেকে স্পষ্ট কথা পাওয়া যায়নি।');
      }
    } catch (err: any) {
      console.error('File audio transcription error:', err);
      setErrorMessage(err.message || 'অডিও ফাইল প্রসেসিং ব্যর্থ হয়েছে।');
    } finally {
      setIsProcessingAudio(false);
      setProcessingStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // AI Polish: Format already typed/spoken text into a coherent story
  const handleFormatSpokenStory = async () => {
    const textToFormat = currentStoryText.trim();
    if (!textToFormat) {
      setErrorMessage('সংশোধন করার মতো কোনো গল্প বা লেখা পাওয়া যায়নি।');
      return;
    }

    setIsFormatting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiFormatVoiceTranscript(
        textToFormat,
        voiceLanguage.startsWith('bn') ? 'bn' : 'auto',
        selectedModel,
        apiKey
      );

      if (res.formattedText) {
        onUpdateStoryText(res.formattedText);
        setSuccessMessage(`✓ এলোমেলো কথা ঠিক করে সাজানো হয়েছে: ${res.detectedLanguage || 'বাংলা'}`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'গল্প পলিশিং ব্যর্থ হয়েছে।');
    } finally {
      setIsFormatting(false);
    }
  };

  const handleLoadSample = (content: string) => {
    onUpdateStoryText(content);
    setShowSampleMenu(false);
    setSuccessMessage('✓ নমুনা গল্প লোড করা হয়েছে');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-2">
      {/* Hidden File Input for Audio File Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm,.aac"
        onChange={handleAudioFileSelected}
        className="hidden"
      />

      {/* Main Voice Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/90 border border-slate-800 shadow-sm">
        {/* Left Side: Voice Recording Buttons & Language */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Professional Voice Record Button */}
          {!isRecording ? (
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={disabled || isProcessingAudio}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-rose-950/40 active:scale-95 cursor-pointer disabled:opacity-50"
              title="মাইক্রোফোন অন করে কথা বলুন। এআই আপনার এলোমেলো কথা ঠিক করে গল্প বানিয়ে দেবে।"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>🎙️ কথা বলুন (ভয়েস ইনপুট)</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              {/* Active Recording State */}
              <button
                type="button"
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs tracking-wide transition-all shadow-lg shadow-rose-950 ring-2 ring-rose-400 animate-pulse cursor-pointer"
                title="রেকর্ডিং শেষ করুন এবং এআই দিয়ে সংশোধন ও গল্প তৈরি করুন"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>বলা শেষ ({formatTimer(recordingSeconds)}) • তৈরি করুন</span>
                {/* Audio Waves Animation */}
                <div className="flex items-center gap-0.5 ml-1">
                  <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-0.5 h-4.5 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleCancelRecording}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 cursor-pointer"
                title="রেকর্ডিং বাতিল করুন"
              >
                বাতিল
              </button>
            </div>
          )}

          {/* Upload Voice / Audio File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isRecording || isProcessingAudio}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 text-xs font-medium transition cursor-pointer disabled:opacity-40"
            title="রেকর্ড করা অডিও ফাইল (.mp3, .m4a, .wav) আপলোড করুন"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">অডিও ফাইল</span>
          </button>

          {/* Voice Language Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onVoiceLanguageChange('bn-BD');
                if (isRecording) handleStopRecording();
              }}
              disabled={isRecording || disabled}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                voiceLanguage === 'bn-BD'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="বাংলা ভাষায় ভয়েস ইনপুট (Bangladesh)"
            >
              🇧🇩 বাংলা
            </button>
            <button
              type="button"
              onClick={() => {
                onVoiceLanguageChange('en-US');
                if (isRecording) handleStopRecording();
              }}
              disabled={isRecording || disabled}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                voiceLanguage === 'en-US'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English or Banglish Voice Input"
            >
              🇺🇸 English / বাংলিশ
            </button>
            <button
              type="button"
              onClick={() => {
                onVoiceLanguageChange('bn-IN');
                if (isRecording) handleStopRecording();
              }}
              disabled={isRecording || disabled}
              className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                voiceLanguage === 'bn-IN'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="বাংলা (ভারত / IN)"
            >
              🇮🇳 IN
            </button>
          </div>

          {/* Insert Mode Toggle: Append or Replace */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-medium">
            <button
              type="button"
              onClick={() => setInsertMode('append')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                insertMode === 'append'
                  ? 'bg-slate-800 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="নতুন কথা বর্তমান লেখার শেষে যুক্ত হবে"
            >
              +যুক্ত করুন
            </button>
            <button
              type="button"
              onClick={() => setInsertMode('replace')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                insertMode === 'replace'
                  ? 'bg-slate-800 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="নতুন কথা দিয়ে পুরো লেখা প্রতিস্থাপন হবে"
            >
              নতুন গল্প
            </button>
          </div>

          {/* AI Polish Button: Fix messy speech in textarea */}
          <button
            type="button"
            onClick={handleFormatSpokenStory}
            disabled={isFormatting || isRecording || !currentStoryText.trim()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 hover:text-indigo-100 border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
            title="বর্তমান লেখার এলোমেলো কথা ঠিক করে ব্যাকরণসম্মত গল্প তৈরি করুন"
          >
            {isFormatting ? (
              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-indigo-400" />
            )}
            <span>✨ এলোমেলো কথা ঠিক করুন</span>
          </button>
        </div>

        {/* Right Side: Quick Samples Dropdown & Clear */}
        <div className="flex items-center gap-1.5">
          {/* Quick Samples Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowSampleMenu((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-slate-100 border border-slate-800 text-xs font-medium transition-all cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>Sample Stories</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSampleMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Select a sample story:
                </div>
                {SAMPLE_STORIES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleLoadSample(sample.content)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex flex-col gap-0.5 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-100 truncate">{sample.title}</span>
                    <span className="text-[10px] text-amber-400 font-mono">({sample.language})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Clear Input Text Button */}
          {currentStoryText.trim() && (
            <button
              type="button"
              onClick={() => onUpdateStoryText('')}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Clear input text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Live Speech Recognition Interim Strip (Only while speaking) */}
      {isRecording && (
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-rose-500/50 text-rose-300 text-xs flex items-center justify-between gap-2 shadow animate-fadeIn">
          <div className="flex items-center gap-2 overflow-hidden">
            <Radio className="w-4 h-4 text-rose-400 shrink-0 animate-ping" />
            <div className="truncate">
              <span className="font-bold text-slate-200 mr-1.5">🎙️ মাইকে কথা বলুন:</span>
              <span className="text-amber-300 italic">
                {liveInterimSpeech ? `"${liveInterimSpeech}"` : 'আপনার কথা শোনা হচ্ছে... এলোমেলো হলেও এআই স্বয়ংক্রিয়ভাবে গুছিয়ে নেবে।'}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-rose-400 font-bold shrink-0">
            {formatTimer(recordingSeconds)}
          </span>
        </div>
      )}

      {/* Audio Processing Indicator */}
      {isProcessingAudio && (
        <div className="px-3.5 py-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/60 text-indigo-200 text-xs flex items-center gap-2.5 shadow-lg animate-pulse">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
          <span className="font-medium">{processingStatus || 'Gemini AI আপনার কণ্ঠ বিশ্লেষণ করছে...'}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="px-3.5 py-2 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-2 shadow">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 font-bold px-1.5 py-0.5 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-relaxed font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold px-1.5 py-0.5 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
