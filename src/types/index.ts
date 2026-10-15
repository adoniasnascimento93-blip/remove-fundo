export interface AIAnalysis {
  peopleCount: number;
  confidenceScore: number;
  detectedSubjects: string[];
  hairComplexity: 'simple' | 'medium' | 'high' | 'curly/flyaway';
  edgesAssessment: {
    hairDetail: string;
    contrastWithBackground: 'high' | 'medium' | 'low';
    motionBlurDetected: boolean;
    translucentElements: string;
  };
  recommendedSettings: {
    featheringRadius: number;
    edgeShift: number;
    defringe: boolean;
    smoothing: boolean;
  };
  portraitAdvice: string;
}

export interface EdgeSettings {
  feather: number;              // 0 to 8 px
  shift: number;                // -5 to +5 px (choke / contract edge to eat white fringe)
  defringe: boolean;            // remove color bleed from old background
  removeWhiteHalo: boolean;     // dedicated white halo / fringe suppression
  whiteHaloIntensity: number;   // 0 to 100% intensity of white fringe cleaning
  alphaCutoff: number;          // 0 to 60 (clean faint transparent ghost pixels)
  smoothing: boolean;           // smooth jagged contours
  contrast: number;             // alpha threshold steepness
}

export type BackgroundType = 'transparent' | 'color' | 'gradient' | 'blur-original' | 'custom-image';

export interface BackgroundSettings {
  type: BackgroundType;
  color: string;
  gradient: string;
  blurRadius: number; // 0 to 50 px
  customImageUrl?: string;
  checkerboardDark: boolean;
}

export type ViewMode = 'slider' | 'cutout' | 'original' | 'side-by-side' | 'mask';

export interface BrushState {
  enabled: boolean;
  mode: 'restore' | 'erase';
  size: number;        // 4 to 80 px
  hardness: number;    // 0 to 1
  opacity: number;     // 0 to 1
}

export interface ImageItem {
  id: string;
  name: string;
  size: number;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  cutoutBlob: Blob | null;
  cutoutUrl: string | null;
  status: 'idle' | 'analyzing' | 'processing' | 'done' | 'error';
  progress: number;
  progressMessage: string;
  error?: string;
  analysis?: AIAnalysis | null;
}
