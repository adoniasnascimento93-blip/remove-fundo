import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  Copy,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ChevronDown,
  Layers,
  ShieldCheck,
  FileDown,
} from 'lucide-react';

import {
  ImageItem,
  AIAnalysis,
  EdgeSettings,
  BackgroundSettings,
  ViewMode,
} from './types';
import { SAMPLE_PORTRAITS, SamplePortrait } from './data/samplePortraits';
import { removePhotoBackground, analyzePortraitAI } from './services/aiRemovalService';
import {
  loadImage,
  blobToDataURL,
  processCutoutEdges,
  renderCompositedCanvas,
  generateAlphaMaskCanvas,
  downloadBlob,
  copyBlobToClipboard,
} from './utils/imageProcessing';

import { Navbar } from './components/Navbar';
import { DropZone } from './components/DropZone';
import { ComparisonSlider } from './components/ComparisonSlider';
import { StudioSettings } from './components/StudioSettings';
import { AIAnalysisCard } from './components/AIAnalysisCard';
import { RefinementEditor } from './components/RefinementEditor';
import { BatchQueueModal } from './components/BatchQueueModal';

const DEFAULT_EDGE_SETTINGS: EdgeSettings = {
  feather: 0.5,
  shift: -1.5, // Eats 1.5px into the boundary to remove white background bleed
  defringe: true,
  removeWhiteHalo: true,
  whiteHaloIntensity: 85,
  alphaCutoff: 25, // Cuts the faint translucent white ghost perimeter
  smoothing: true,
  contrast: 1.05,
};

const DEFAULT_BG_SETTINGS: BackgroundSettings = {
  type: 'transparent',
  color: '#FFFFFF',
  gradient: 'studio-gray',
  blurRadius: 20,
  checkerboardDark: true,
};

export default function App() {
  // Active primary image state
  const [activeItem, setActiveItem] = useState<ImageItem | null>(null);
  const [rawCutoutCanvas, setRawCutoutCanvas] = useState<HTMLCanvasElement | null>(null);
  const [processedCanvasUrl, setProcessedCanvasUrl] = useState<string | null>(null);
  const [alphaMaskUrl, setAlphaMaskUrl] = useState<string | null>(null);

  // Settings
  const [edgeSettings, setEdgeSettings] = useState<EdgeSettings>(DEFAULT_EDGE_SETTINGS);
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>(DEFAULT_BG_SETTINGS);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');

  // Modals & Tools
  const [showManualBrush, setShowManualBrush] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchItems, setBatchItems] = useState<ImageItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  // Loading & Toast UI
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ref cache for HTML image elements
  const originalImageElementRef = useRef<HTMLImageElement | null>(null);

  // Trigger floating toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  /**
   * Process a single image: run neural segmentation and Gemini AI analysis
   */
  const processImageFile = async (
    fileOrUrl: File | string,
    fileName: string,
    fileSize: number = 0
  ) => {
    try {
      setIsProcessing(true);
      setProcessingProgress(5);
      setProcessingMessage('Carregando foto em alta resolução...');

      let originalUrl: string;
      let blobSource: Blob;

      if (typeof fileOrUrl === 'string') {
        originalUrl = fileOrUrl;
        const res = await fetch(fileOrUrl);
        blobSource = await res.blob();
      } else {
        originalUrl = URL.createObjectURL(fileOrUrl);
        blobSource = fileOrUrl;
      }

      // Load original image to get native resolution
      const originalImg = await loadImage(originalUrl);
      originalImageElementRef.current = originalImg;

      const item: ImageItem = {
        id: Math.random().toString(36).substring(2, 9),
        name: fileName,
        size: fileSize || blobSource.size,
        originalUrl,
        originalWidth: originalImg.naturalWidth,
        originalHeight: originalImg.naturalHeight,
        cutoutBlob: null,
        cutoutUrl: null,
        status: 'processing',
        progress: 10,
        progressMessage: 'Iniciando IA neural...',
      };

      setActiveItem(item);

      // Start Gemini Portrait Analysis in background
      const base64Data = await blobToDataURL(blobSource);
      analyzePortraitAI(base64Data)
        .then((analysis) => {
          if (analysis) {
            setActiveItem((prev) => (prev ? { ...prev, analysis } : prev));
            if (analysis.recommendedSettings) {
              setEdgeSettings((prev) => ({
                ...prev,
                feather: analysis.recommendedSettings.featheringRadius ?? 0.5,
                shift: Math.min(-1, analysis.recommendedSettings.edgeShift ?? -1.5),
                defringe: true,
                removeWhiteHalo: true,
                whiteHaloIntensity: 85,
                alphaCutoff: 25,
                smoothing: true,
                contrast: 1.05,
              }));
            }
          }
        })
        .catch((e) => console.warn('Portrait analysis background note:', e));

      // Execute AI Neural Segmentation
      const cutoutBlob = await removePhotoBackground(blobSource, (state) => {
        setProcessingProgress(state.percent);
        setProcessingMessage(state.message);
      });

      const cutoutDataUrl = await blobToDataURL(cutoutBlob);
      const cutoutImg = await loadImage(cutoutDataUrl);

      // Store raw cutout canvas
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = cutoutImg.naturalWidth;
      rawCanvas.height = cutoutImg.naturalHeight;
      const ctx = rawCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(cutoutImg, 0, 0);
      }
      setRawCutoutCanvas(rawCanvas);

      // Update active item status
      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              cutoutBlob,
              cutoutUrl: cutoutDataUrl,
              status: 'done',
              progress: 100,
              progressMessage: 'Concluído com sucesso!',
            }
          : null
      );

      // Trigger Celebration Confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
      });

      showToast('Fundo removido com sucesso com IA!');
    } catch (err: any) {
      console.error('Error processing photo:', err);
      showToast('Erro ao remover fundo: ' + (err.message || 'Tente outra imagem'));
      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: err.message || 'Erro ao processar imagem',
            }
          : null
      );
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  /**
   * Re-composite and render whenever edge settings or background settings change
   */
  const updateRenderedCanvas = useCallback(async () => {
    if (!rawCutoutCanvas || !originalImageElementRef.current) return;

    // 1. Process edge adjustments on cutout
    const tunedCutout = processCutoutEdges(
      originalImageElementRef.current,
      rawCutoutCanvas as unknown as HTMLImageElement,
      edgeSettings
    );

    // 2. Generate black/white alpha mask
    const mask = generateAlphaMaskCanvas(tunedCutout);
    setAlphaMaskUrl(mask.toDataURL('image/png'));

    // 3. Composite with studio background
    const composited = await renderCompositedCanvas(
      originalImageElementRef.current,
      tunedCutout,
      bgSettings,
      false // preview mode with checkerboard if transparent
    );

    setProcessedCanvasUrl(composited.toDataURL('image/png'));
  }, [rawCutoutCanvas, edgeSettings, bgSettings]);

  useEffect(() => {
    updateRenderedCanvas();
  }, [updateRenderedCanvas]);

  /**
   * Export handlers
   */
  const handleDownloadTransparentPNG = async () => {
    if (!rawCutoutCanvas || !originalImageElementRef.current || !activeItem) return;

    // Produce clean cutout with active edge settings but 100% transparent background
    const tunedCutout = processCutoutEdges(
      originalImageElementRef.current,
      rawCutoutCanvas as unknown as HTMLImageElement,
      edgeSettings
    );

    const transparentCanvas = await renderCompositedCanvas(
      originalImageElementRef.current,
      tunedCutout,
      { ...bgSettings, type: 'transparent' },
      true // forExport = true (no checkerboard)
    );

    transparentCanvas.toBlob((blob) => {
      if (blob) {
        const cleanName = activeItem.name.replace(/\.[^/.]+$/, '');
        downloadBlob(blob, `${cleanName}-pessoas-transparente-hd.png`);
        showToast('Download do PNG Transparente em Alta Definição iniciado!');
      }
    }, 'image/png');
  };

  const handleDownloadWithStudioBackground = async () => {
    if (!rawCutoutCanvas || !originalImageElementRef.current || !activeItem) return;

    const tunedCutout = processCutoutEdges(
      originalImageElementRef.current,
      rawCutoutCanvas as unknown as HTMLImageElement,
      edgeSettings
    );

    const composited = await renderCompositedCanvas(
      originalImageElementRef.current,
      tunedCutout,
      bgSettings,
      true
    );

    composited.toBlob((blob) => {
      if (blob) {
        const cleanName = activeItem.name.replace(/\.[^/.]+$/, '');
        downloadBlob(blob, `${cleanName}-estudio.png`);
        showToast('Download da imagem de estúdio iniciado!');
      }
    }, 'image/png');
  };

  const handleCopyClipboard = async () => {
    if (!rawCutoutCanvas || !originalImageElementRef.current) return;

    const tunedCutout = processCutoutEdges(
      originalImageElementRef.current,
      rawCutoutCanvas as unknown as HTMLImageElement,
      edgeSettings
    );

    const transparentCanvas = await renderCompositedCanvas(
      originalImageElementRef.current,
      tunedCutout,
      { ...bgSettings, type: 'transparent' },
      true
    );

    transparentCanvas.toBlob(async (blob) => {
      if (blob) {
        const success = await copyBlobToClipboard(blob);
        if (success) {
          showToast('PNG Transparente copiado para a Área de Transferência!');
        } else {
          showToast('Não foi possível copiar automaticamente para este navegador.');
        }
      }
    }, 'image/png');
  };

  /**
   * Manual brush update
   */
  const handleApplyManualBrush = (updatedCanvas: HTMLCanvasElement) => {
    setRawCutoutCanvas(updatedCanvas);
    setShowManualBrush(false);
    showToast('Retoque manual aplicado com sucesso!');
  };

  /**
   * Batch Queue Processing
   */
  const handleAddBatchFiles = (files: FileList) => {
    const newItems: ImageItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      originalUrl: URL.createObjectURL(file),
      originalWidth: 0,
      originalHeight: 0,
      cutoutBlob: null,
      cutoutUrl: null,
      status: 'idle',
      progress: 0,
      progressMessage: 'Aguardando início',
    }));

    setBatchItems((prev) => [...prev, ...newItems]);
    setShowBatchModal(true);
  };

  const handleProcessBatchAll = async () => {
    setIsBatchProcessing(true);
    const queue = [...batchItems];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'done') continue;

      // Update item to processing
      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'processing', progress: 20 } : it
        )
      );

      try {
        const res = await fetch(item.originalUrl);
        const blob = await res.blob();
        const cutoutBlob = await removePhotoBackground(blob, (state) => {
          setBatchItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    progress: state.percent,
                    progressMessage: state.message,
                  }
                : it
            )
          );
        });

        const cutoutUrl = await blobToDataURL(cutoutBlob);

        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'done',
                  progress: 100,
                  cutoutBlob,
                  cutoutUrl,
                  progressMessage: 'Recorte finalizado',
                }
              : it
          )
        );
      } catch (err: any) {
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', error: err.message || 'Erro' }
              : it
          )
        );
      }
    }

    setIsBatchProcessing(false);
    showToast('Processamento do lote finalizado!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        onNewImage={() => {
          setActiveItem(null);
          setRawCutoutCanvas(null);
          setProcessedCanvasUrl(null);
          setAlphaMaskUrl(null);
        }}
        onOpenBatch={() => setShowBatchModal(true)}
        hasActiveImage={Boolean(activeItem)}
        batchCount={batchItems.length}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 text-xs font-semibold text-white animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!activeItem ? (
          /* Empty / Upload State */
          <DropZone
            onFileSelect={(file) => processImageFile(file, file.name, file.size)}
            onSampleSelect={(sample) =>
              processImageFile(sample.url, `${sample.title}.jpg`)
            }
            isLoading={isProcessing}
          />
        ) : (
          /* Active Editor State */
          <div className="space-y-6">
            {/* Top Info & Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Scissors className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    {activeItem.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>
                      {activeItem.originalWidth} × {activeItem.originalHeight} px
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> IA com Foco em Pessoas
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Download & Copy Actions */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleCopyClipboard}
                  disabled={!rawCutoutCanvas}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm"
                  title="Copiar PNG Transparente para colar direto no Photoshop, Canva ou Figma"
                >
                  <Copy className="w-4 h-4 text-indigo-400" />
                  <span>Copiar PNG</span>
                </button>

                {bgSettings.type !== 'transparent' && (
                  <button
                    onClick={handleDownloadWithStudioBackground}
                    disabled={!rawCutoutCanvas}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    <span>Baixar c/ Fundo</span>
                  </button>
                )}

                <button
                  onClick={handleDownloadTransparentPNG}
                  disabled={!rawCutoutCanvas}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PNG Transparente (HD)</span>
                </button>
              </div>
            </div>

            {/* Processing Progress Bar if running */}
            {isProcessing && (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-200 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    {processingMessage}
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">{processingProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Grid Layout: Visualizer on Left, Studio Tools on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Center / Left: Comparison & Viewer (7 cols on large screens) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <ComparisonSlider
                  originalUrl={activeItem.originalUrl}
                  processedCanvasUrl={processedCanvasUrl}
                  alphaMaskUrl={alphaMaskUrl}
                  width={activeItem.originalWidth}
                  height={activeItem.originalHeight}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  isCheckerboardDark={bgSettings.checkerboardDark}
                  onToggleCheckerboard={() =>
                    setBgSettings((prev) => ({
                      ...prev,
                      checkerboardDark: !prev.checkerboardDark,
                    }))
                  }
                  isLoading={isProcessing}
                />

                {/* Gemini AI Analysis Card */}
                <AIAnalysisCard
                  analysis={activeItem.analysis || null}
                  isLoading={isProcessing && !activeItem.analysis}
                />
              </div>

              {/* Right: Studio Controls (5 cols on large screens) */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-5">
                <StudioSettings
                  bgSettings={bgSettings}
                  onBgSettingsChange={setBgSettings}
                  edgeSettings={edgeSettings}
                  onEdgeSettingsChange={setEdgeSettings}
                  onResetEdges={() => setEdgeSettings(DEFAULT_EDGE_SETTINGS)}
                  onOpenManualBrush={() => setShowManualBrush(true)}
                  hasCutout={Boolean(rawCutoutCanvas)}
                />

                {/* Pro Tips Box */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dicas para Recorte Perfeito:</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                    <li>
                      Para <strong className="text-slate-300">cabelos crespos ou cacheados</strong>, ative o filtro <em>Defringe</em> para neutralizar contaminações de cor do fundo antigo.
                    </li>
                    <li>
                      Experimente a aba <strong className="text-slate-300">Desfoque Bokeh</strong> para manter o ambiente original com profundidade de estúdio profissional.
                    </li>
                    <li>
                      Copie o PNG e cole diretamente no Canva ou Photoshop mantendo a camada alfa pura.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Manual Brush Refinement Modal */}
      {showManualBrush && rawCutoutCanvas && originalImageElementRef.current && (
        <RefinementEditor
          originalImg={originalImageElementRef.current}
          currentCutoutCanvas={rawCutoutCanvas}
          onApply={handleApplyManualBrush}
          onClose={() => setShowManualBrush(false)}
        />
      )}

      {/* Batch Processing Modal */}
      {showBatchModal && (
        <BatchQueueModal
          items={batchItems}
          onClose={() => setShowBatchModal(false)}
          onAddFiles={handleAddBatchFiles}
          onProcessAll={handleProcessBatchAll}
          onSelectActive={(item) => {
            setActiveItem(item);
            if (item.cutoutBlob) {
              loadImage(item.cutoutUrl!).then((img) => {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                c.getContext('2d')?.drawImage(img, 0, 0);
                setRawCutoutCanvas(c);
              });
            }
          }}
          onRemoveItem={(id) => setBatchItems((prev) => prev.filter((i) => i.id !== id))}
          isProcessing={isBatchProcessing}
        />
      )}
    </div>
  );
}
