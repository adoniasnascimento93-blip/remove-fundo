import React from 'react';
import { Scissors, Sparkles, Layers, Image as ImageIcon, Zap, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onNewImage: () => void;
  onOpenBatch: () => void;
  hasActiveImage: boolean;
  batchCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewImage,
  onOpenBatch,
  hasActiveImage,
  batchCount,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Scissors className="w-5 h-5 text-white transform -rotate-45" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 font-['Plus_Jakarta_Sans']">
                CutoutPro <span className="text-indigo-400">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-indigo-400" /> Especialista em Pessoas
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Recorte ultrapreciso de cabelo, corpo e silhueta humana em HD
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {hasActiveImage && (
            <button
              onClick={onNewImage}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nova Imagem</span>
            </button>
          )}

          <button
            onClick={onOpenBatch}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 rounded-lg transition-all cursor-pointer relative shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Processamento em</span> Lote
            {batchCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-pink-500 text-white rounded-full font-bold">
                {batchCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
