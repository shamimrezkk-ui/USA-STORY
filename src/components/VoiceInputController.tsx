import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Languages, 
  Loader2,
  Volume2,
  Trash2,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { apiFormatVoiceTranscript } from '../services/apiClient.ts';
import { SAMPLE_STORIES } from '../data/sampleStories.ts';

// Type definitions for Web Speech API
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface CompactVoiceToolbarProps {
  currentStoryText: string;
  onUpdateStoryText: (newText: string) => void;
  voiceLanguage: string;
  onVoiceLanguageChange: (lang: string) => void;
  selectedModel: string;
  apiKey?: string;
  disabled?: boolean;
}

export const VoiceInputController: React.FC<CompactVoiceToolbarProps> = ({
  currentStoryText,
  onUpdateStoryText,
  voiceLanguage,
  onVoiceLanguageChange,
  selectedModel,
  apiKey,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sessionTranscript, setSessionTranscript] = useState('');
  const [insertMode, setInsertMode] = useState<'append' | 'replace'>('append');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatSuccessMessage, setFormatSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const timerRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Timer counter when recording
  useEffect(() => {
    if (isListening) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  // Keep ref updated
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Click outside to close sample menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSampleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    setFormatSuccessMessage(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Speech recognition requires Chrome, Edge, or Safari. You can still type directly in Bangla, Banglish or English.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLanguage || 'bn-BD';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + ' ';
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalChunk.trim()) {
          const cleanFinal = finalChunk.trim();
          setSessionTranscript((prev) => (prev ? `${prev} ${cleanFinal}` : cleanFinal));
          setInterimTranscript('');

          if (insertMode === 'replace') {
            onUpdateStoryText(cleanFinal);
          } else {
            onUpdateStoryText(
              currentStoryText.trim()
                ? `${currentStoryText.trim()}\n\n${cleanFinal}`
                : cleanFinal
            );
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permission in your browser.');
          stopListening();
        } else if (event.error === 'network') {
          setErrorMessage('Speech network error. Please verify internet connection.');
          stopListening();
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage(err.message || 'Microphone activation failed.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setInterimTranscript('');
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // AI Polish & Format for Spoken Bangla & Banglish
  const handleFormatSpokenStory = async () => {
    const textToFormat = sessionTranscript.trim() || currentStoryText.trim();
    if (!textToFormat) {
      setErrorMessage('Please type or record a story first.');
      return;
    }

    setIsFormatting(true);
    setErrorMessage(null);
    setFormatSuccessMessage(null);

    try {
      const res = await apiFormatVoiceTranscript(
        textToFormat,
        voiceLanguage.startsWith('bn') ? 'bn' : 'auto',
        selectedModel,
        apiKey
      );

      if (res.formattedText) {
        onUpdateStoryText(res.formattedText);
        setFormatSuccessMessage(`✓ পরিমার্জিত: ${res.detectedLanguage}`);
        setTimeout(() => setFormatSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Formatting failed.');
    } finally {
      setIsFormatting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoadSample = (content: string) => {
    onUpdateStoryText(content);
    setShowSampleMenu(false);
  };

  return (
    <div className="w-full space-y-2">
      {/* Sleek, Compact Unified Toolbar (Single Row) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
        {/* Left Side: Voice & Speech Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Main Voice Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 ring-2 ring-rose-400 animate-pulse'
                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 hover:border-rose-500/60'
            }`}
            title="Start / Stop Voice-to-Text in Bangla"
          >
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>শুনছি ({formatTimer(recordingSeconds)}) • থামুন</span>
                {/* Mini audio wave */}
                <div className="flex items-center gap-0.5 ml-0.5">
                  <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>ভয়েস ইনপুট (Voice)</span>
              </>
            )}
          </button>

          {/* Voice Language Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px]">
            <Languages className="w-3 h-3 text-amber-400 shrink-0" />
            <select
              value={voiceLanguage}
              onChange={(e) => {
                onVoiceLanguageChange(e.target.value);
                if (isListening) stopListening();
              }}
              disabled={isListening || disabled}
              className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="bn-BD" className="bg-slate-900 text-slate-200">
                বাংলা (BD)
              </option>
              <option value="bn-IN" className="bg-slate-900 text-slate-200">
                বাংলা (IN)
              </option>
              <option value="en-US" className="bg-slate-900 text-slate-200">
                English (US)
              </option>
            </select>
          </div>

          {/* Insert Mode Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-medium">
            <button
              type="button"
              onClick={() => setInsertMode('append')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                insertMode === 'append'
                  ? 'bg-slate-800 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Append speech to end of story"
            >
              +যুক্ত
            </button>
            <button
              type="button"
              onClick={() => setInsertMode('replace')}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                insertMode === 'replace'
                  ? 'bg-slate-800 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Replace entire story with speech"
            >
              নতুন
            </button>
          </div>

          {/* AI Polish Button */}
          <button
            type="button"
            onClick={handleFormatSpokenStory}
            disabled={isFormatting || isListening || (!currentStoryText.trim() && !sessionTranscript.trim())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
            title="Clean up and format spoken transcript with Gemini"
          >
            {isFormatting ? (
              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-indigo-400" />
            )}
            <span className="hidden sm:inline">পরিমার্জন (Polish)</span>
            <span className="sm:hidden">Polish</span>
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
              <span>নমুনা গল্প (Samples)</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSampleMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Select a test story:
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

          {/* Quick Clear Button */}
          {currentStoryText.trim() && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear current story text?')) {
                  onUpdateStoryText('');
                  setSessionTranscript('');
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Interim Transcript Strip (Only when user is speaking) */}
      {isListening && interimTranscript && (
        <div className="px-3 py-2 rounded-lg bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <div className="truncate flex-1">
            <span className="text-slate-400 font-medium">লাইভ শুনছি:</span> &quot;{interimTranscript}&quot;
          </div>
        </div>
      )}

      {/* Error or Success notification toast */}
      {errorMessage && (
        <div className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px]">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {formatSuccessMessage && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px]">{formatSuccessMessage}</span>
        </div>
      )}
    </div>
  );
};
