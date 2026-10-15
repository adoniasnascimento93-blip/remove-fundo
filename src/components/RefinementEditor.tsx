import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  Undo2,
  Redo2,
  RotateCcw,
  Check,
  X,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

interface RefinementEditorProps {
  originalImg: HTMLImageElement;
  currentCutoutCanvas: HTMLCanvasElement;
  onApply: (updatedCanvas: HTMLCanvasElement) => void;
  onClose: () => void;
}

export const RefinementEditor: React.FC<RefinementEditorProps> = ({
  originalImg,
  currentCutoutCanvas,
  onApply,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'restore' | 'erase' | 'dehalo'>('dehalo');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [brushOpacity, setBrushOpacity] = useState<number>(100);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const width = currentCutoutCanvas.width;
  const height = currentCutoutCanvas.height;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(currentCutoutCanvas, 0, 0);
    const initialData = ctx.getImageData(0, 0, width, height);
    setHistory([initialData]);
    setHistoryIndex(0);
  }, [currentCutoutCanvas, width, height]);

  // Push new state to history
  const pushState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, width, height);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, data];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex, width, height]);

  const undo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && history[nextIndex]) {
        ctx.putImageData(history[nextIndex], 0, 0);
        setHistoryIndex(nextIndex);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && history[nextIndex]) {
        ctx.putImageData(history[nextIndex], 0, 0);
        setHistoryIndex(nextIndex);
      }
    }
  };

  const resetToInitial = () => {
    if (history[0]) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.putImageData(history[0], 0, 0);
        setHistory([history[0]]);
        setHistoryIndex(0);
      }
    }
  };

  // Painting stroke
  const paintAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);

    if (mode === 'erase') {
      // Erase: destination-out clears pixels
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${brushOpacity / 100})`;
      ctx.fill();
    } else if (mode === 'restore') {
      // Restore: draw pixels from originalImg in that circle
      ctx.globalCompositeOperation = 'source-over';
      ctx.clip();
      ctx.globalAlpha = brushOpacity / 100;
      ctx.drawImage(originalImg, 0, 0, width, height);
    } else if (mode === 'dehalo') {
      // Dehalo: Clean white haze and contaminated background inside brush circle
      const radius = brushSize / 2;
      const minX = Math.max(0, Math.floor(x - radius));
      const minY = Math.max(0, Math.floor(y - radius));
      const maxX = Math.min(width, Math.ceil(x + radius));
      const maxY = Math.min(height, Math.ceil(y + radius));
      const w = maxX - minX;
      const h = maxY - minY;

      if (w > 0 && h > 0) {
        const imgData = ctx.getImageData(minX, minY, w, h);
        const data = imgData.data;
        const factor = brushOpacity / 100;

        for (let py = 0; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const dx = (minX + px) - x;
            const dy = (minY + py) - y;
            if (dx * dx + dy * dy <= radius * radius) {
              const idx = (py * w + px) * 4;
              const alpha = data[idx + 3];

              // Clean faint white ghost pixels
              if (alpha < 35) {
                data[idx + 3] = 0;
                continue;
              }

              if (alpha > 0 && alpha < 240) {
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;

                // If high luminance (white background bleed)
                if (luma > 150) {
                  const suppress = Math.min(1, ((luma - 150) / 100) * factor);
                  data[idx] = Math.round(r * (1 - suppress * 0.45));
                  data[idx + 1] = Math.round(g * (1 - suppress * 0.45));
                  data[idx + 2] = Math.round(b * (1 - suppress * 0.45));
                  // Slightly tighten alpha to eliminate white edge
                  data[idx + 3] = Math.round(alpha * (1 - suppress * 0.25));
                }
              }
            }
          }
        }
        ctx.putImageData(imgData, minX, minY);
      }
    }

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    paintAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (isDrawing) {
      paintAt(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      pushState();
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      onApply(canvasRef.current);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Paintbrush className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
              Pincel Mágico de Retoque & Detalhes
            </h2>
            <p className="text-xs text-slate-400">
              Recupere mechas finas perdidas ou apague resquícios indesejados com precisão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Aplicar Retoque
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 pt-4 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 bg-checkerboard-dark rounded-2xl border border-slate-800 flex items-center justify-center overflow-auto p-4 relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsDrawing(false);
              setMousePos(null);
            }}
            className="max-h-[600px] w-auto max-w-full object-contain rounded-lg shadow-2xl cursor-crosshair"
          />

          {/* Custom brush circle preview cursor */}
          {mousePos && (
            <div
              className={`absolute pointer-events-none rounded-full border-2 -translate-x-1/2 -translate-y-1/2 ${
                mode === 'restore'
                  ? 'border-emerald-400 bg-emerald-500/20'
                  : mode === 'erase'
                  ? 'border-rose-400 bg-rose-500/20'
                  : 'border-amber-400 bg-amber-500/20'
              }`}
              style={{
                left: mousePos.x,
                top: mousePos.y,
                width: brushSize,
                height: brushSize,
              }}
            />
          )}
        </div>

        {/* Tools Panel */}
        <div className="w-full lg:w-80 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Mode selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                Modo do Pincel
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode('dehalo')}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer border ${
                    mode === 'dehalo'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Eliminar halos e bordas brancas preservando os cabelos"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Anti-Halo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('restore')}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer border ${
                    mode === 'restore'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('erase')}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer border ${
                    mode === 'erase'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Apagar</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {mode === 'dehalo'
                  ? 'Passe sobre as bordas esbranquiçadas ou cabelos para sugar o branco do fundo e recuperar a cor natural.'
                  : mode === 'restore'
                  ? 'Pinte sobre fios de cabelo ou detalhes do corpo para recuperá-los da imagem original.'
                  : 'Pinte sobre manchas ou sobras do fundo para apagá-las.'}
              </p>
            </div>

            {/* Brush Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Tamanho do Pincel</span>
                <span className="font-mono text-indigo-400 font-bold">{brushSize}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={100}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Brush Opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Opacidade / Intensidade</span>
                <span className="font-mono text-indigo-400 font-bold">{brushOpacity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={brushOpacity}
                onChange={(e) => setBrushOpacity(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Undo / Redo / Reset */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Histórico
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Desfazer
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
                >
                  <Redo2 className="w-3.5 h-3.5" /> Refazer
                </button>
                <button
                  type="button"
                  onClick={resetToInitial}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                  title="Reiniciar para o recorte inicial"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick tip */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
            <span>
              Dica: Use um pincel fino (6-12px) para restaurar mechas individuais de cabelo e anéis ou óculos.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
