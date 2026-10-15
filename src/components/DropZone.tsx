import React, { useRef, useState, useEffect } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Camera, CheckCircle2, User, Flame, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { SAMPLE_PORTRAITS, SamplePortrait } from '../data/samplePortraits';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: (sample: SamplePortrait) => void;
  isLoading: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  onSampleSelect,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            onFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>IA Especializada em Recorte de Retratos e Pessoas</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans'] leading-[1.15]">
          Remova o fundo da foto e deixe{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            apenas as pessoas
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Algoritmo neural inteligente que reconhece cada detalhe anatômico, mechas de cabelo, roupas e contornos com{' '}
          <strong className="text-white font-semibold">fundo 100% transparente</strong> em altíssima definição.
        </p>
      </div>

      {/* Main Upload Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-3xl p-8 sm:p-12 transition-all duration-300 cursor-pointer text-center border-2 border-dashed ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01] shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-500/20'
            : 'border-slate-700/80 hover:border-indigo-500/70 bg-slate-900/50 hover:bg-slate-900/80 shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={handleInputChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Ambient background glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none" />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform duration-300 ring-4 ring-white/10">
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce duration-1000" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
              Arraste sua foto aqui ou{' '}
              <span className="text-indigo-400 group-hover:underline">clique para selecionar</span>
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Suporta fotos de pessoas em JPG, PNG, WEBP em resolução original. Você também pode colar com{' '}
              <kbd className="px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">
                Ctrl + V
              </kbd>
            </p>
          </div>

          {/* Quick upload buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-colors cursor-pointer flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Escolher Foto
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-pink-400" />
              Tirar Foto
            </button>
          </div>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Foco em Pessoas</h4>
            <p className="text-[11px] text-slate-400">Isola silhueta humana</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Cabelos Fio a Fio</h4>
            <p className="text-[11px] text-slate-400">Preserva mechas finas</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Fundo Transparente</h4>
            <p className="text-[11px] text-slate-400">Canal alfa PNG limpo</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Alta Definição</h4>
            <p className="text-[11px] text-slate-400">Sem perda de resolução</p>
          </div>
        </div>
      </div>

      {/* Sample Portraits Showcase */}
      <div className="mt-12 pt-8 border-t border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-['Plus_Jakarta_Sans']">
              Ou teste agora com um exemplo pronto:
            </h3>
          </div>
          <span className="text-xs text-slate-400">Clique para testar a IA instantaneamente</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SAMPLE_PORTRAITS.map((sample) => (
            <button
              key={sample.id}
              disabled={isLoading}
              onClick={() => onSampleSelect(sample)}
              className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500 transition-all duration-300 text-left cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="aspect-[4/5] w-full overflow-hidden relative">
                <img
                  src={sample.thumbnail}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-600/90 text-white backdrop-blur-sm">
                  {sample.tag}
                </span>
              </div>
              <div className="p-3">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {sample.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
