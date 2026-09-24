export type VideoDuration = '8s' | '10s';

export type TargetVideoLength = '30s' | '1m' | '2m' | '3m' | '5m' | '10m' | 'custom';

export type TargetPlatform = 'youtube' | 'facebook';

export type CharacterType = 'Human' | 'Cat' | 'Dog' | 'Other Animal' | 'Object' | 'Other';

export interface CharacterBibleEntry {
  id: string; // e.g. "CHARACTER_01"
  name: string;
  type: CharacterType;
  age: string;
  gender: string;
  speciesBreed: string;
  bodyType: string;
  face: string;
  eyes: string;
  hairFur: string;
  furPattern: string;
  skin: string;
  clothing: string;
  accessories: string;
  distinctiveMarkings: string;
  personality: string;
  emotionalBehavior: string;
  movementStyle: string;
  importantVisualDetails: string;
  lockedIdentitySummary: string; // The locked visual identity token
  masterImagePrompt: string; // Master reference prompt for Midjourney/Flux/Imagen
  masterGridImagePrompt?: string; // Single master multi-panel storyboard grid prompt (all scenes in 1 image)
  imageUrl?: string; // Visual reference image
}

export interface StoryAnalysis {
  mainStoryline: string;
  beginning: string;
  conflict: string;
  risingAction: string;
  climax: string;
  resolution: string;
  charactersIdentified: {
    name: string;
    role: string;
    type: string;
    briefSummary: string;
  }[];
  characterRelationships: string;
  characterActions: string;
  characterEmotions: string;
  locations: string[];
  usaEnvironmentOpportunities: string[];
  weatherConditions: string;
  timeProgression: string;
  importantObjects: string[];
  importantEvents: string[];
  sceneTransitions: string[];
  emotionalProgression: string;
  visualOpportunities: string;
  continuityRequirements: string[];
}

export interface ImprovedStory {
  title: string;
  logline: string;
  fullStory: string;
  bengaliStory?: string; // সুন্দর করে বাংলায় সাজিয়ে লেখা সম্পূর্ণ গল্প
  cinematicTone: string;
  emotionalPacing: string;
  usaSettingAdaptation: string;
  continuityGuidelines: string[];
}

export interface CameraPlan {
  framing: string; // e.g. "Medium Close-Up", "Low-Angle Tracking"
  movement: string; // e.g. "Smooth Dolly Push-In", "Slow Steadicam Pan"
  lens: string; // e.g. "50mm anamorphic prime lens"
  depthOfField: string; // e.g. "Shallow depth of field with soft bokeh background"
  lighting: string; // e.g. "Warm afternoon sun rays breaking through autumn maple trees"
}

export interface SceneActionSystem {
  startState: string; // What the character/scene starts with
  actionMiddle: string; // What happens during the 8-10 seconds
  endState: string; // Exact end position/state that becomes next scene's start state
}

export interface SceneItem {
  sceneNumber: number;
  sceneTitle: string;
  duration: VideoDuration;
  storyPurpose: string;
  charactersPresent: string[]; // e.g. ["CHARACTER_01", "CHARACTER_03"]
  location: string;
  usaEnvironmentDetails: string;
  timeOfDay: string;
  weather: string;
  actionSystem: SceneActionSystem;
  emotion: string;
  importantObjects: string[];
  cameraPlan: CameraPlan;
  continuityNotes: string; // Wet fur, collar, bandages, vehicle placement
  fullVideoPrompt: string; // Photorealistic video generation prompt
  negativeConstraints: string; // Specific negative prompt
}

export interface VideoPackage {
  platform?: TargetPlatform;
  suggestedTitles: {
    category: 'Cinematic' | 'Clickable / High CTR' | 'Emotional / Viral';
    title: string;
  }[];
  seoDescription: string;
  tags: string[];
  hashtags: string[];
  masterThumbnailPrompt: string;
  masterGridImagePrompt?: string;
  youtubeChapters?: string;
  facebookPostCopy?: string;
}

export interface CompleteProjectState {
  rawStory: string;
  duration: VideoDuration;
  platform?: TargetPlatform;
  targetVideoLength?: TargetVideoLength;
  targetSceneCount?: number;
  selectedModel: string;
  analysis: StoryAnalysis | null;
  improvedStory: ImprovedStory | null;
  characters: CharacterBibleEntry[];
  scenes: SceneItem[];
  videoPackage: VideoPackage | null;
}
