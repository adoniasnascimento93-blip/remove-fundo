export interface SamplePortrait {
  id: string;
  title: string;
  category: string;
  tag: string;
  thumbnail: string;
  url: string;
  description: string;
}

export const SAMPLE_PORTRAITS: SamplePortrait[] = [
  {
    id: 'curly-hair-woman',
    title: 'Retrato Cachos & Detalhes',
    category: 'Cabelos Complexos',
    tag: 'Fios Finos',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    description: 'Excelente para testar mechas de cabelo soltas, textura e brincos.',
  },
  {
    id: 'business-man',
    title: 'Retrato Executivo Masculino',
    category: 'Perfil Profissional',
    tag: 'Terno & Barba',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85',
    description: 'Bordas nítidas de ombros, gola de camisa e recorte facial.',
  },
  {
    id: 'windy-hair',
    title: 'Retrato ao Ar Livre com Vento',
    category: 'Desafio Extremo',
    tag: 'Fios ao Vento',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85',
    description: 'Testa preservação de cabelos esvoaçantes contra fundo claro.',
  },
  {
    id: 'couple-portrait',
    title: 'Duas Pessoas / Casal',
    category: 'Múltiplos Indivíduos',
    tag: '2 Pessoas',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    description: 'Valida a detecção de mais de um indivíduo e espaço entre eles.',
  },
];
