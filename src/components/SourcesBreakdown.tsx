import React from 'react';
import { TransactionSource } from '@/types';
import { Smartphone, Zap, CreditCard, PenLine, Sparkles } from 'lucide-react';

interface SourceItem {
  source: TransactionSource;
  label: string;
  amount: number;
  count: number;
}

interface SourcesBreakdownProps {
  sources: SourceItem[];
  totalSpent: number;
}

export function SourcesBreakdown({ sources, totalSpent }: SourcesBreakdownProps) {
  const getSourceDetails = (source: TransactionSource) => {
    switch (source) {
      case 'apple_pay':
        return {
          icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
          badge: 'Automação Apple Wallet',
          badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
        };
      case 'santander_pix':
        return {
          icon: <Zap className="w-4 h-4 text-teal-400" />,
          badge: 'PIX Santander',
          badgeColor: 'bg-teal-950/60 text-teal-300 border-teal-800/40',
        };
      case 'santander_card':
        return {
          icon: <CreditCard className="w-4 h-4 text-rose-400" />,
          badge: 'Cartão Santander',
          badgeColor: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
        };
      default:
        return {
          icon: <PenLine className="w-4 h-4 text-zinc-400" />,
          badge: 'Manual / Outros',
          badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  const automatedTotal = sources
    .filter(s => s.source !== 'manual')
    .reduce((acc, s) => acc + s.amount, 0);

  const autoPct = totalSpent > 0 ? Math.round((automatedTotal / totalSpent) * 100) : 100;

  return (
    <div className="bg-[#121216] border border-zinc-800/80 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Canais de Pagamento & Automação
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            <strong className="text-emerald-400">{autoPct}% dos gastos</strong> registrados de forma automática
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sources.map(item => {
          const { icon, badge, badgeColor } = getSourceDetails(item.source);
          const pct = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;

          return (
            <div
              key={item.source}
              className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-2xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                    {icon}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {item.count} {item.count === 1 ? 'lançamento' : 'lançamentos'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-baseline justify-between border-t border-zinc-800/80 pt-2">
                <span className="text-sm font-bold text-white">
                  R$ {item.amount.toFixed(2)}
                </span>
                <span className="text-[11px] font-semibold text-zinc-400">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
