import React from 'react';
import {
  FileText,
  FileSearch,
  BookOpen,
  Users,
  Film,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';

export type PipelineStage =
  | 'input'
  | 'analysis'
  | 'improvedStory'
  | 'characters'
  | 'scenes'
  | 'package';

interface WorkflowNavProps {
  currentStage: PipelineStage;
  onSelectStage: (stage: PipelineStage) => void;
  hasAnalysis: boolean;
  hasImprovedStory: boolean;
  hasCharacters: boolean;
  hasScenes: boolean;
  hasPackage: boolean;
}

export const WorkflowNav: React.FC<WorkflowNavProps> = ({
  currentStage,
  onSelectStage,
  hasAnalysis,
  hasImprovedStory,
  hasCharacters,
  hasScenes,
  hasPackage,
}) => {
  const steps: Array<{
    id: PipelineStage;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    isAvailable: boolean;
  }> = [
    {
      id: 'input',
      label: '1. Story Input',
      sublabel: 'Raw narrative & duration',
      icon: <FileText className="w-4 h-4" />,
      isAvailable: true,
    },
    {
      id: 'analysis',
      label: '2. Story Analysis',
      sublabel: 'Dramatic beats & USA setting',
      icon: <FileSearch className="w-4 h-4" />,
      isAvailable: hasAnalysis,
    },
    {
      id: 'improvedStory',
      label: '3. Improved Story',
      sublabel: 'Cinematic adaptation',
      icon: <BookOpen className="w-4 h-4" />,
      isAvailable: hasImprovedStory,
    },
    {
      id: 'characters',
      label: '4. Character Bible',
      sublabel: 'Locked identities & anatomy',
      icon: <Users className="w-4 h-4" />,
      isAvailable: hasCharacters,
    },
    {
      id: 'scenes',
      label: '5. Scene Prompts',
      sublabel: '8/10s video prompts',
      icon: <Film className="w-4 h-4" />,
      isAvailable: hasScenes,
    },
    {
      id: 'package',
      label: '6. Release Package',
      sublabel: 'Titles, SEO & Thumbnail',
      icon: <PackageCheck className="w-4 h-4" />,
      isAvailable: hasPackage,
    },
  ];

  return (
    <nav className="mb-8 overflow-x-auto pb-2 scrollbar-thin">
      <div className="flex items-center min-w-max gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        {steps.map((step) => {
          const isActive = currentStage === step.id;
          const isEnabled = step.isAvailable;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isEnabled}
              onClick={() => onSelectStage(step.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold shadow-lg shadow-amber-950/40'
                  : isEnabled
                  ? 'bg-slate-950/70 hover:bg-slate-800 text-slate-200 border border-slate-800/80'
                  : 'bg-slate-950/30 text-slate-600 border border-slate-900 cursor-not-allowed opacity-60'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive
                    ? 'bg-slate-950 text-amber-400'
                    : isEnabled
                    ? 'bg-slate-800 text-amber-400'
                    : 'bg-slate-900 text-slate-700'
                }`}
              >
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-wide">{step.label}</span>
                  {isEnabled && step.id !== 'input' && (
                    <CheckCircle2
                      className={`w-3 h-3 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] block leading-tight ${
                    isActive ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}
                >
                  {step.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
