import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Languages,
  Sparkles,
  BookOpen,
  ChevronDown,
  Trash2,
  Volume2,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SAMPLE_STORIES } from '../data/sampleStories.ts';
import { apiFormatVoiceTranscript } from '../services/apiClient.ts';

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [sessionTranscript, setSessionTranscript] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [insertMode, setInsertMode] = useState<'append' | 'replace'>('append');
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  const [formatSuccessMessage, setFormatSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSampleMenu, setShowSampleMenu] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    if (isListening) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isListening]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinal += transcriptPiece + ' ';
          } else {
            currentInterim += transcriptPiece;
          }
        }

        setInterimTranscript(currentInterim);

        if (currentFinal.trim()) {
          setSessionTranscript((prev) => (prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim()));

          // Update parent state based on insert mode
          if (insertMode === 'replace') {
            onUpdateStoryText(currentFinal.trim());
          } else {
            // Append mode
            const baseText = currentStoryText.trim();
            const newText = baseText
              ? `${baseText} ${currentFinal.trim()}`
              : currentFinal.trim();
            onUpdateStoryText(newText);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permissions in your browser.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [voiceLanguage, insertMode, currentStoryText, onUpdateStoryText]);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (recognitionRef.current) {
      try {
        setErrorMessage(null);
        setInterimTranscript('');
        recognitionRef.current.lang = voiceLanguage;
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Recognition start error:', err);
        if (err.message && err.message.includes('already started')) {
          recognitionRef.current.stop();
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFormatSpokenStory = async () => {
    const textToFormat = (currentStoryText || sessionTranscript).trim();
    if (!textToFormat) {
      setErrorMessage('No story text available to format.');
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
        setFormatSuccessMessage(`✓ Polished: ${res.detectedLanguage || 'English'}`);
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
            title="Start / Stop Voice Dictation"
          >
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Listening ({formatTimer(recordingSeconds)}) • Stop</span>
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
                <span>Voice Input</span>
              </>
            )}
          </button>

          {/* Voice Language Selector: 1-Click Bengali / English-Banglish Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onVoiceLanguageChange('bn-BD');
                if (isListening) stopListening();
              }}
              disabled={isListening || disabled}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                voiceLanguage === 'bn-BD'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="বাংলা ভয়েস ইনপুট (Bengali - Bangladesh)"
            >
              🇧🇩 বাংলা
            </button>
            <button
              type="button"
              onClick={() => {
                onVoiceLanguageChange('en-US');
                if (isListening) stopListening();
              }}
              disabled={isListening || disabled}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                voiceLanguage === 'en-US'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English / Banglish Voice Input (US)"
            >
              🇺🇸 English / বাংলিশ
            </button>
            <button
              type="button"
              onClick={() => {
                onVoiceLanguageChange('bn-IN');
                if (isListening) stopListening();
              }}
              disabled={isListening || disabled}
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
              title="Append speech to end of current story"
            >
              +Append
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
              New
            </button>
          </div>

          {/* AI Polish Button */}
          <button
            type="button"
            onClick={handleFormatSpokenStory}
            disabled={isFormatting || isListening || (!currentStoryText.trim() && !sessionTranscript.trim())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
            title="Clean up grammar and format spoken transcript with Gemini"
          >
            {isFormatting ? (
              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-indigo-400" />
            )}
            <span>Polish Narrative</span>
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
              onClick={() => {
                onUpdateStoryText('');
                setSessionTranscript('');
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Clear input text"
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
            <span className="text-slate-400 font-medium">Listening:</span> &quot;{interimTranscript}&quot;
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
