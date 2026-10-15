import React, { useRef } from 'react';
import {
  Palette,
  Sliders,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Droplet,
  Layers,
  ShieldCheck,
  Zap,
  Scissors,
  Wand2,
} from 'lucide-react';
import { BackgroundSettings, EdgeSettings } from '../types';

interface StudioSettingsProps {
  bgSettings: BackgroundSettings;
  onBgSettingsChange: (settings: BackgroundSettings) => void;
  edgeSettings: EdgeSettings;
  onEdgeSettingsChange: (settings: EdgeSettings) => void;
  onResetEdges: () => void;
  onOpenManualBrush: () => void;
  hasCutout: boolean;
}

const SOLID_COLORS = [
  { name: 'Branco Estúdio', value: '#FFFFFF', border: true },
  { name: 'Preto Profundo', value: '#000000' },
  { name: 'Cinza Fotográfico', value: '#475569' },
  { name: 'Cinza Claro', value: '#E2E8F0', border: true },
  { name: 'Azul Executivo', value: '#1D4ED8' },
  { name: 'Azul Céu', value: '#38BDF8' },
  { name: 'Chroma Key Verde', value: '#00FF00' },
  { name: 'Vermelho Paixão', value: '#E11D48' },
  { name: 'Amarelo Criativo', value: '#F59E0B' },
  { name: 'Rosa Pastel', value: '#F472B6' },
  { name: 'Roxo Moderno', value: '#7C3AED' },
  { name: 'Esmeralda', value: '#059669' },
];

const GRADIENTS = [
  { id: 'studio-gray', name: 'Estúdio Gray', preview: 'from-slate-700 to-slate-950' },
  { id: 'sunset', name: 'Sunset Glow', preview: 'from-amber-500 to-rose-600' },
  { id: 'ocean', name: 'Ocean Depth', preview: 'from-sky-500 to-blue-700' },
  { id: 'cyber', name: 'Cyberpunk', preview: 'from-purple-500 to-pink-500' },
  { id: 'emerald', name: 'Emerald Soft', preview: 'from-emerald-600 to-teal-800' },
  { id: 'luxury-gold', name: 'Luxury Gold', preview: 'from-amber-600 to-amber-950' },
  { id: 'soft-pastel', name: 'Pastel Light', preview: 'from-pink-200 to-sky-200' },
  { id: 'neon-night', name: 'Neon Night', preview: 'from-slate-900 to-indigo-950' },
];

export const StudioSettings: React.FC<StudioSettingsProps> = ({
  bgSettings,
  onBgSettingsChange,
  edgeSettings,
  onEdgeSettingsChange,
  onResetEdges,
  onOpenManualBrush,
  hasCutout,
}) => {
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onBgSettingsChange({
        ...bgSettings,
        type: 'custom-image',
        customImageUrl: url,
      });
    }
  };

  // Quick 1-click preset handlers
  const applyAntiWhiteHaloPreset = () => {
    onEdgeSettingsChange({
      ...edgeSettings,
      removeWhiteHalo: true,
      whiteHaloIntensity: 90,
      shift: -1.5,
      alphaCutoff: 30,
      feather: 0.5,
      defringe: true,
      contrast: 1.1,
    });
  };

  const applyUltraCrispPreset = () => {
    onEdgeSettingsChange({
      ...edgeSettings,
      removeWhiteHalo: true,
      whiteHaloIntensity: 100,
      shift: -2.5,
      alphaCutoff: 40,
      feather: 0,
      defringe: true,
      contrast: 1.2,
    });
  };

  const applySoftHairPreset = () => {
    onEdgeSettingsChange({
      ...edgeSettings,
      removeWhiteHalo: true,
      whiteHaloIntensity: 80,
      shift: -0.5,
      alphaCutoff: 15,
      feather: 1,
      defringe: true,
      contrast: 1.0,
    });
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-6 backdrop-blur-sm">
      {/* Quick Anti-Halo Presets Banner */}
      <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-pink-500/10 border border-amber-500/20 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            Ajustes Rápidos para Bordas Brancas:
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={applyAntiWhiteHaloPreset}
            className="py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
          >
            <Zap className="w-3 h-3 text-amber-300" /> Eliminar Halos
          </button>
          <button
            type="button"
            onClick={applyUltraCrispPreset}
            className="py-1.5 px-2.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
          >
            <Scissors className="w-3 h-3 text-indigo-300" /> Corte Rente
          </button>
        </div>
      </div>

      {/* Edge Perfection & White Halo Elimination Sliders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
              Refinamento Avançado de Bordas
            </h3>
          </div>
          <button
            type="button"
            onClick={onResetEdges}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            title="Resetar parâmetros recomendados"
          >
            <RefreshCw className="w-3 h-3" /> Padrão
          </button>
        </div>

        {/* 1. White Halo Eliminator Toggle & Intensity */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Eliminar Bordas & Halos Brancos
              </span>
              <p className="text-[10px] text-slate-400">
                Substitui a luz branca vazada do fundo pela cor natural dos cabelos e pele.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onEdgeSettingsChange({
                  ...edgeSettings,
                  removeWhiteHalo: !edgeSettings.removeWhiteHalo,
                })
              }
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                edgeSettings.removeWhiteHalo
                  ? 'bg-amber-500 justify-end'
                  : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {edgeSettings.removeWhiteHalo && (
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Intensidade Anti-Halo</span>
                <span className="font-mono text-amber-400 font-bold">
                  {edgeSettings.whiteHaloIntensity ?? 80}%
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={edgeSettings.whiteHaloIntensity ?? 80}
                onChange={(e) =>
                  onEdgeSettingsChange({
                    ...edgeSettings,
                    whiteHaloIntensity: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* 2. Edge Shift (Choke: Contraction) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Contração de Borda (Comer Borda Branca)
            </span>
            <span className="font-mono text-pink-400 font-bold">
              {edgeSettings.shift > 0 ? `+${edgeSettings.shift}` : edgeSettings.shift}px
            </span>
          </div>
          <input
            type="range"
            min={-4}
            max={3}
            step={0.5}
            value={edgeSettings.shift}
            onChange={(e) =>
              onEdgeSettingsChange({ ...edgeSettings, shift: Number(e.target.value) })
            }
            className="w-full accent-pink-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">
            Valores negativos (-1px a -3px) comem o contorno branco externo com precisão cirúrgica.
          </p>
        </div>

        {/* 3. Alpha Cutoff (Corte de névoa esbranquiçada) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Corte de Névoa Translúcida (Alpha Cutoff)
            </span>
            <span className="font-mono text-indigo-400 font-bold">
              {edgeSettings.alphaCutoff ?? 20}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={edgeSettings.alphaCutoff ?? 20}
            onChange={(e) =>
              onEdgeSettingsChange({ ...edgeSettings, alphaCutoff: Number(e.target.value) })
            }
            className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">
            Elimina o pó/haze transparente que causa a impressão de fumaça branca ao redor da pessoa.
          </p>
        </div>

        {/* 4. Feathering */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Suavização da Máscara (Feather)</span>
            <span className="font-mono text-slate-300 font-bold">{edgeSettings.feather}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={4}
            step={0.5}
            value={edgeSettings.feather}
            onChange={(e) =>
              onEdgeSettingsChange({ ...edgeSettings, feather: Number(e.target.value) })
            }
            className="w-full accent-slate-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Manual Brush Entry Button */}
        {hasCutout && (
          <button
            type="button"
            onClick={onOpenManualBrush}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Abrir Pincel Mágico de Retoque Manual</span>
          </button>
        )}
      </div>

      <div className="h-px bg-slate-800" />

      {/* Background Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
              Fundo da Imagem
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {bgSettings.type === 'transparent' ? 'Transparente (Padrão PNG)' : 'Fundo Aplicado'}
          </span>
        </div>

        {/* Primary Type Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onBgSettingsChange({ ...bgSettings, type: 'transparent' })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              bgSettings.type === 'transparent'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <div className="w-6 h-6 rounded border border-white/20 bg-checkerboard mb-1" />
            <span>Transparente</span>
          </button>

          <button
            type="button"
            onClick={() => onBgSettingsChange({ ...bgSettings, type: 'color' })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              bgSettings.type === 'color'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <div
              className="w-6 h-6 rounded border border-white/20 mb-1"
              style={{ backgroundColor: bgSettings.color }}
            />
            <span>Cores Sólidas</span>
          </button>

          <button
            type="button"
            onClick={() => onBgSettingsChange({ ...bgSettings, type: 'gradient' })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              bgSettings.type === 'gradient'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-purple-500 to-pink-500 mb-1" />
            <span>Gradientes</span>
          </button>

          <button
            type="button"
            onClick={() => onBgSettingsChange({ ...bgSettings, type: 'blur-original' })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              bgSettings.type === 'blur-original'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <Droplet className="w-5 h-5 text-sky-400 mb-1" />
            <span>Desfoque Bokeh</span>
          </button>
        </div>

        {/* Sub-panel for Colors */}
        {bgSettings.type === 'color' && (
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Paleta de Estúdio:</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">{bgSettings.color}</span>
                <input
                  type="color"
                  value={bgSettings.color}
                  onChange={(e) =>
                    onBgSettingsChange({ ...bgSettings, color: e.target.value })
                  }
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  title="Escolher cor personalizada"
                />
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {SOLID_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    onBgSettingsChange({ ...bgSettings, color: c.value })
                  }
                  className={`w-full aspect-square rounded-lg transition-transform hover:scale-110 cursor-pointer flex items-center justify-center shadow-sm ${
                    c.border ? 'border border-slate-500/40' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {bgSettings.color.toLowerCase() === c.value.toLowerCase() && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        c.value === '#FFFFFF' || c.value === '#E2E8F0' || c.value === '#00FF00'
                          ? 'text-slate-900'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-panel for Gradients */}
        {bgSettings.type === 'gradient' && (
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs text-slate-400 font-medium block">Estilos Modernos:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    onBgSettingsChange({ ...bgSettings, gradient: g.id })
                  }
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer transition-all ${
                    bgSettings.gradient === g.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${g.preview} shrink-0`} />
                  <span className="text-[11px] font-semibold truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-panel for Bokeh Blur */}
        {bgSettings.type === 'blur-original' && (
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Intensidade do Desfoque (Bokeh DSLR)</span>
              <span className="font-mono text-indigo-400 font-bold">{bgSettings.blurRadius}px</span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              value={bgSettings.blurRadius}
              onChange={(e) =>
                onBgSettingsChange({ ...bgSettings, blurRadius: Number(e.target.value) })
              }
              className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Mantém o cenário original desfocado em profundidade de campo cinematográfica.
            </p>
          </div>
        )}

        {/* Custom background image upload */}
        <div className="flex items-center justify-between pt-1">
          <input
            ref={customBgInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => customBgInputRef.current?.click()}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Fazer upload de imagem de fundo customizada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
