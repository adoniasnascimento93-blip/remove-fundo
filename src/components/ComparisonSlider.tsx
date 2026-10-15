import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Split,
  Eye,
  Columns,
  Grid,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { ViewMode } from '../types';

interface ComparisonSliderProps {
  originalUrl: string;
  processedCanvasUrl: string | null;
  alphaMaskUrl: string | null;
  width: number;
  height: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isCheckerboardDark: boolean;
  onToggleCheckerboard: () => void;
  isLoading?: boolean;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalUrl,
  processedCanvasUrl,
  alphaMaskUrl,
  width,
  height,
  viewMode,
  onViewModeChange,
  isCheckerboardDark,
  onToggleCheckerboard,
  isLoading = false,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle slider movement
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    setSliderPosition((clamped / rect.width) * 100);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // If zoomed and user is holding middle click or alt or in non-slider mode, allow pan
    if (zoom > 1 && (e.button === 1 || e.altKey || viewMode !== 'slider')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      } else if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
      setIsPanning(false);
    };

    if (isDragging || isPanning) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      window.addEventListener('touchmove', handleWindowTouchMove);
      window.addEventListener('touchend', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowMouseUp);
    };
  }, [isDragging, isPanning, handleMove, panStart]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(4, +(prev + 0.5).toFixed(1)));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1, +(prev - 0.5).toFixed(1));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const currentDisplayImage =
    viewMode === 'mask' && alphaMaskUrl
      ? alphaMaskUrl
      : processedCanvasUrl || originalUrl;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 text-xs">
        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onViewModeChange('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'slider'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Comparação dividida antes e depois"
          >
            <Split className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Slider Dividido</span>
          </button>

          <button
            onClick={() => onViewModeChange('cutout')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'cutout'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Apenas pessoa recortada"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Recorte</span>
          </button>

          <button
            onClick={() => onViewModeChange('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Lado a lado"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Lado a Lado</span>
          </button>

          <button
            onClick={() => onViewModeChange('mask')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'mask'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Visualizar máscara de silhueta (Preto e Branco)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Máscara Alfa</span>
          </button>
        </div>

        {/* Zoom & Inspect controls */}
        <div className="flex items-center gap-2">
          {/* Checkerboard toggle */}
          <button
            onClick={onToggleCheckerboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            title="Alternar xadrez claro/escuro para inspecionar cabelos"
          >
            {isCheckerboardDark ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">Xadrez {isCheckerboardDark ? 'Escuro' : 'Claro'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900 px-1 py-0.5 rounded-lg border border-slate-800">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-300 font-semibold min-w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Aumentar Zoom (Inspecionar mechas de cabelo)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom > 1 && (
              <button
                onClick={handleResetZoom}
                className="px-2 py-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`relative flex-1 w-full min-h-[420px] sm:min-h-[520px] max-h-[720px] flex items-center justify-center overflow-hidden select-none ${
          isCheckerboardDark ? 'bg-checkerboard-dark' : 'bg-checkerboard'
        } ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-ew-resize'}`}
      >
        {/* Loading overlay if re-processing */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-200">Refinando mechas e transparência com IA...</p>
          </div>
        )}

        {/* Transformed Stage */}
        <div
          className="relative max-w-full max-h-full transition-transform duration-75"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
        >
          {viewMode === 'slider' && (
            <div className="relative inline-block overflow-hidden rounded-lg shadow-2xl">
              {/* Processed (After) Image - Background layer */}
              <img
                src={processedCanvasUrl || originalUrl}
                alt="Depois (Pessoas Recortadas)"
                className="max-h-[500px] sm:max-h-[620px] w-auto object-contain pointer-events-none block"
                draggable={false}
              />

              {/* Original (Before) Image - Clipped foreground layer */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`,
                }}
              >
                <img
                  src={originalUrl}
                  alt="Antes (Original)"
                  className="max-h-[500px] sm:max-h-[620px] w-auto object-contain pointer-events-none block"
                  draggable={false}
                />
              </div>

              {/* Vertical Divider Line and Handle */}
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-0 bottom-0 -left-px w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-indigo-600 ring-2 ring-white/50">
                  <Split className="w-4 h-4 transform rotate-90" />
                </div>
              </div>

              {/* Badges for Before / After */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/10 pointer-events-none">
                Original
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600/90 text-white backdrop-blur-md border border-indigo-400/30 pointer-events-none flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Pessoas Isoladas
              </div>
            </div>
          )}

          {viewMode === 'cutout' && (
            <div className="relative inline-block overflow-hidden rounded-lg shadow-2xl">
              <img
                src={processedCanvasUrl || originalUrl}
                alt="Pessoas Recortadas em Alta Definição"
                className="max-h-[500px] sm:max-h-[620px] w-auto object-contain pointer-events-none block"
                draggable={false}
              />
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600/90 text-white backdrop-blur-md border border-indigo-400/30 pointer-events-none flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Fundo Removido
              </div>
            </div>
          )}

          {viewMode === 'side-by-side' && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-2">
              <div className="relative rounded-lg overflow-hidden border border-slate-700/60 shadow-xl">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-h-[250px] sm:max-h-[480px] w-auto object-contain block"
                  draggable={false}
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white">
                  Original
                </span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-indigo-500/40 shadow-xl">
                <img
                  src={processedCanvasUrl || originalUrl}
                  alt="Pessoas Isoladas"
                  className="max-h-[250px] sm:max-h-[480px] w-auto object-contain block"
                  draggable={false}
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                  Fundo Removido
                </span>
              </div>
            </div>
          )}

          {viewMode === 'mask' && (
            <div className="relative inline-block overflow-hidden rounded-lg shadow-2xl">
              <img
                src={alphaMaskUrl || processedCanvasUrl || originalUrl}
                alt="Máscara de Silhueta"
                className="max-h-[500px] sm:max-h-[620px] w-auto object-contain pointer-events-none block"
                draggable={false}
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-900/90 text-white backdrop-blur-md border border-slate-700 pointer-events-none">
                Máscara Binária (Branco = Pessoas, Preto = Fundo)
              </div>
            </div>
          )}
        </div>

        {/* Footer info tag */}
        <div className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{width} × {height} px</span>
          <span className="text-slate-600">•</span>
          <span>Transparência Alfa Ativa</span>
        </div>
      </div>
    </div>
  );
};
