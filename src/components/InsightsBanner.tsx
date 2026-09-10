import React from 'react';
import { FinancialInsight } from '@/types';
import { AlertTriangle, AlertCircle, Lightbulb, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react';

interface InsightsBannerProps {
  insights: FinancialInsight[];
}

export function InsightsBanner({ insights }: InsightsBannerProps) {
  if (!insights || insights.length === 0) return null;

  const getIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
    if (type === 'saving_tip') return <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />;
    if (severity === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
    return <TrendingUp className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />;
  };

  const getCardStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-950/40 border-rose-800/60 text-rose-100';
      case 'warning':
        return 'bg-amber-950/30 border-amber-800/50 text-amber-100';
      case 'success':
        return 'bg-emerald-950/30 border-emerald-800/50 text-emerald-100';
      default:
        return 'bg-indigo-950/30 border-indigo-800/50 text-indigo-100';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Inteligência Financeira & Alertas
        </h3>
        <span className="text-[11px] bg-zinc-800/80 px-2 py-0.5 rounded-full text-zinc-400">
          {insights.length} avisos
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {insights.map(item => (
          <div
            key={item.id}
            className={`p-3.5 rounded-2xl border backdrop-blur-sm transition-all ${getCardStyle(item.severity)}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(item.type, item.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight text-white">
                    {item.title}
                  </h4>
                  {item.impactAmount && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 text-amber-300 shrink-0">
                      ~R$ {item.impactAmount.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {item.description}
                </p>

                {item.actionableTip && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-xs text-zinc-200 flex items-start gap-1.5 bg-black/20 p-2 rounded-xl">
                    <span className="font-semibold text-amber-300 shrink-0">💡 Dica:</span>
                    <span>{item.actionableTip}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
