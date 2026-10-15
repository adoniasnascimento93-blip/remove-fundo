import React, { useRef } from 'react';
import {
  X,
  Layers,
  Upload,
  Play,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  FileArchive,
} from 'lucide-react';
import JSZip from 'jszip';
import { ImageItem } from '../types';
import { downloadBlob } from '../utils/imageProcessing';

interface BatchQueueModalProps {
  items: ImageItem[];
  onClose: () => void;
  onAddFiles: (files: FileList) => void;
  onProcessAll: () => void;
  onSelectActive: (item: ImageItem) => void;
  onRemoveItem: (id: string) => void;
  isProcessing: boolean;
}

export const BatchQueueModal: React.FC<BatchQueueModalProps> = ({
  items,
  onClose,
  onAddFiles,
  onProcessAll,
  onSelectActive,
  onRemoveItem,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doneCount = items.filter((i) => i.status === 'done').length;

  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((i) => i.status === 'done' && i.cutoutBlob);
    if (doneItems.length === 0) return;

    const zip = new JSZip();
    for (const item of doneItems) {
      if (item.cutoutBlob) {
        const cleanName = item.name.replace(/\.[^/.]+$/, '');
        zip.file(`${cleanName}-sem-fundo.png`, item.cutoutBlob);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, 'recortes-pessoas-hd.zip');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                Fila de Processamento em Lote
              </h3>
              <p className="text-xs text-slate-400">
                {items.length} {items.length === 1 ? 'imagem na fila' : 'imagens na fila'} • {doneCount} processadas com sucesso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && onAddFiles(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Adicionar Mais Fotos
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onProcessAll}
              disabled={isProcessing || items.every((i) => i.status === 'done')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isProcessing ? 'Processando Lote...' : 'Recortar Fundo de Todas'}</span>
            </button>

            {doneCount > 0 && (
              <button
                onClick={handleDownloadAllZip}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>Baixar Tudo (.ZIP)</span>
              </button>
            )}
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">Nenhuma foto na fila de lote.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                Clique para selecionar fotos
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                {/* Thumbnails */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-checkerboard-dark shrink-0 border border-slate-800">
                  <img
                    src={item.cutoutUrl || item.originalUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.status === 'done' && (
                    <span className="absolute bottom-1 right-1 p-0.5 bg-emerald-500 text-white rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 truncate pr-2">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(item.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>

                  {/* Progress or status */}
                  {item.status === 'processing' && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-indigo-400 truncate">
                        {item.progressMessage || 'Processando mechas e silhueta...'}
                      </p>
                    </div>
                  )}

                  {item.status === 'done' && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Fundo removido em alta resolução
                    </span>
                  )}

                  {item.status === 'idle' && (
                    <span className="text-[11px] text-slate-400">Aguardando início</span>
                  )}

                  {item.status === 'error' && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {item.error || 'Erro ao processar'}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {item.status === 'done' && item.cutoutBlob && (
                    <>
                      <button
                        onClick={() => {
                          onSelectActive(item);
                          onClose();
                        }}
                        className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                        title="Abrir no editor principal"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (item.cutoutBlob) {
                            downloadBlob(item.cutoutBlob, `${item.name}-sem-fundo.png`);
                          }
                        }}
                        className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Baixar PNG Transparente"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remover da fila"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
