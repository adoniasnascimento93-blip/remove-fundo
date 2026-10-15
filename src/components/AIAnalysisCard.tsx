import React from 'react';
import { Sparkles, Users, Award, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';
import { AIAnalysis } from '../types';

interface AIAnalysisCardProps {
  analysis: AIAnalysis | null;
  isLoading: boolean;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-500/30 rounded-full" />
          <div className="h-4 bg-slate-700 rounded w-1/3" />
        </div>
        <div className="h-3 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
      </div>
    );
  }

  if (!analysis) return null;

  const hairBadges: Record<string, { label: string; color: string }> = {
    simple: { label: 'Cabelo Liso / Curto', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    medium: { label: 'Ondulado / Médio', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    high: { label: 'Cachos / Volumoso', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    'curly/flyaway': { label: 'Mechas Finas / Cachos', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  };

  const hairInfo = hairBadges[analysis.hairComplexity] || hairBadges.medium;

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/30 border border-indigo-500/20 rounded-2xl p-4.5 space-y-3.5 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans'] flex items-center gap-1.5">
              Diagnóstico de Retrato por IA
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </h4>
            <span className="text-[11px] text-slate-400">Reconhecimento anatômico avançado</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <Award className="w-3 h-3" />
          <span>{analysis.confidenceScore || 96}% Precisão</span>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* People count */}
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center gap-2.5">
          <Users className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Pessoas no Enquadramento</span>
            <span className="font-bold text-white">
              {analysis.peopleCount === 1 ? '1 Indivíduo' : `${analysis.peopleCount} Pessoas`}
            </span>
          </div>
        </div>

        {/* Hair style */}
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Textura de Cabelo</span>
            <span className="font-bold text-white text-[11px]">{hairInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Subjects detected */}
      {analysis.detectedSubjects && analysis.detectedSubjects.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Elementos Identificados:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.detectedSubjects.map((sub, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                {sub}
              </span>
            ))}
            {analysis.edgesAssessment?.translucentElements &&
              analysis.edgesAssessment.translucentElements !== 'nenhum' && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {analysis.edgesAssessment.translucentElements}
                </span>
              )}
          </div>
        </div>
      )}

      {/* Advice quote */}
      {analysis.portraitAdvice && (
        <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-indigo-200/90 leading-relaxed italic">
          <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span>"{analysis.portraitAdvice}"</span>
        </div>
      )}
    </div>
  );
};
