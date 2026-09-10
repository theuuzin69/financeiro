import React, { useState } from 'react';
import { DynamicAdvice, AdviceCategory } from '@/types';
import { 
  Sparkles, 
  Lightbulb, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  PiggyBank,
  Compass
} from 'lucide-react';

interface DynamicAdviceProps {
  adviceList: DynamicAdvice[];
  income: number;
}

export function DynamicAdviceSection({ adviceList, income }: DynamicAdviceProps) {
  const [filter, setFilter] = useState<'all' | AdviceCategory>('all');

  const filtered = filter === 'all' 
    ? adviceList 
    : adviceList.filter(a => a.category === filter);

  const getCategoryIcon = (cat: AdviceCategory) => {
    switch (cat) {
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'emergency_fund':
        return <ShieldCheck className="w-4 h-4 text-sky-400" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getCardTone = (level: 'good' | 'attention' | 'urgent') => {
    switch (level) {
      case 'urgent':
        return 'border-rose-800/80 bg-rose-950/30 text-rose-100';
      case 'attention':
        return 'border-amber-800/80 bg-amber-950/30 text-amber-100';
      default:
        return 'border-zinc-800/80 bg-zinc-900/60 text-zinc-200';
    }
  };

  return (
    <div className="bg-[#121216] border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-lg space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            Consultoria Financeira Pessoal
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
            Dicas & Investimentos para o seu Momento
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Calculadas matematicamente com base na sua renda de R$ {income.toFixed(0)}, faculdade e compras reais
          </p>
        </div>
      </div>

      {/* Filtros em Abas Leves */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
            filter === 'all'
              ? 'bg-zinc-100 text-zinc-900 shadow'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Todas as Dicas ({adviceList.length})
        </button>
        <button
          onClick={() => setFilter('saving')}
          className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center gap-1 transition-all ${
            filter === 'saving'
              ? 'bg-yellow-400 text-zinc-950 shadow'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Lightbulb className="w-3 h-3" /> Economia Real
        </button>
        <button
          onClick={() => setFilter('investment')}
          className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center gap-1 transition-all ${
            filter === 'investment'
              ? 'bg-emerald-500 text-zinc-950 shadow'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3 h-3" /> Investimentos
        </button>
        <button
          onClick={() => setFilter('alert')}
          className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center gap-1 transition-all ${
            filter === 'alert'
              ? 'bg-rose-500 text-white shadow'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3 h-3" /> Alertas
        </button>
      </div>

      {/* Lista de Dicas */}
      <div className="space-y-3.5">
        {filtered.map(advice => (
          <div
            key={advice.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${getCardTone(advice.level)} space-y-2.5`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-black/40">
                  {getCategoryIcon(advice.category)}
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white">
                  {advice.title}
                </h4>
              </div>

              {advice.impactAmount && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/50 text-amber-300 shrink-0 border border-amber-500/20">
                  Impacto: R$ {advice.impactAmount.toFixed(0)}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-zinc-200">
              {advice.summary}
            </p>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {advice.detailedAdvice}
            </p>

            {/* Ação Prática */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-start gap-2 bg-black/25 p-3 rounded-xl text-xs text-zinc-100">
              <span className="font-bold text-emerald-400 shrink-0 flex items-center gap-1">
                👉 O que fazer:
              </span>
              <span className="leading-relaxed">
                {advice.suggestedAction}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-xs">
            Nenhuma recomendação nesta categoria no momento. Suas finanças estão tranquilas!
          </div>
        )}
      </div>
    </div>
  );
}
