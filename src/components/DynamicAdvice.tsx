import React, { useState } from 'react';
import { DynamicAdvice, AdviceCategory } from '@/types';
import { 
  Lightbulb, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
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
        return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'emergency_fund':
        return <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getCardTone = (level: 'good' | 'attention' | 'urgent') => {
    switch (level) {
      case 'urgent':
        return 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30';
      case 'attention':
        return 'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30';
      default:
        return 'border-emerald-200/80 dark:border-zinc-800/80 bg-emerald-50/40 dark:bg-zinc-900/60';
    }
  };

  return (
    <div className="bg-white dark:bg-[#121216] border border-slate-200/90 dark:border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-lg space-y-5 transition-colors">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          Consultoria Financeira Pessoal
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
          Dicas & Investimentos para o seu Momento
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Calculadas matematicamente com base na sua renda de R$ {income.toFixed(0)}, faculdade e compras reais
        </p>
      </div>

      {/* Filtros em Abas Leves (sem botões pretos no tema claro) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
            filter === 'all'
              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-sm'
              : 'bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
          }`}
        >
          Todas as Dicas ({adviceList.length})
        </button>
        <button
          onClick={() => setFilter('saving')}
          className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center gap-1 transition-all ${
            filter === 'saving'
              ? 'bg-amber-500 text-white font-bold shadow-sm'
              : 'bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
          }`}
        >
          <Lightbulb className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Economia Real
        </button>
        <button
          onClick={() => setFilter('investment')}
          className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center gap-1 transition-all ${
            filter === 'investment'
              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-sm'
              : 'bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
          }`}
        >
          <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Investimentos
        </button>
        <button
          onClick={() => setFilter('alert')}
          className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center gap-1 transition-all ${
            filter === 'alert'
              ? 'bg-rose-500 text-white font-bold shadow-sm'
              : 'bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-rose-500" /> Alertas
        </button>
      </div>

      {/* Lista de Dicas */}
      <div className="space-y-3.5">
        {filtered.map(advice => (
          <div
            key={advice.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${getCardTone(advice.level)} space-y-2.5 shadow-sm dark:shadow-none`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 shadow-xs">
                  {getCategoryIcon(advice.category)}
                </div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {advice.title}
                </h4>
              </div>

              {advice.impactAmount && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-black/50 dark:text-amber-300 shrink-0 border border-amber-300 dark:border-amber-500/20">
                  Impacto: R$ {advice.impactAmount.toFixed(0)}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              {advice.summary}
            </p>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              {advice.detailedAdvice}
            </p>

            {/* Ação Prática */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-start gap-2 bg-white/90 dark:bg-black/30 p-3 rounded-xl text-xs text-slate-800 dark:text-zinc-200 border border-slate-200/70 dark:border-transparent shadow-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                👉 O que fazer:
              </span>
              <span className="leading-relaxed font-medium text-slate-700 dark:text-zinc-200">
                {advice.suggestedAction}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
            Nenhuma recomendação nesta categoria no momento. Suas finanças estão tranquilas!
          </div>
        )}
      </div>
    </div>
  );
}
