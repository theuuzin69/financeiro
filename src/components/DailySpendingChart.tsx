import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DailyData {
  date: string;
  dayLabel: string;
  amount: number;
}

interface DailySpendingChartProps {
  data: DailyData[];
  dailyAverage: number;
}

export function DailySpendingChart({ data, dailyAverage }: DailySpendingChartProps) {
  const [activeDay, setActiveDay] = useState<DailyData | null>(null);

  if (!data || data.length === 0) return null;

  const maxAmount = Math.max(...data.map(d => d.amount), dailyAverage, 50);

  return (
    <div className="bg-[#121216] border border-zinc-800/80 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            Evolução Diária de Gastos
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Média diária: <strong className="text-sky-300">R$ {dailyAverage.toFixed(2)}/dia</strong>
          </p>
        </div>

        {activeDay ? (
          <div className="text-right bg-zinc-800/90 px-2.5 py-1 rounded-xl border border-zinc-700">
            <span className="text-[10px] text-zinc-400 block">{activeDay.dayLabel}</span>
            <span className="text-xs font-bold text-white">R$ {activeDay.amount.toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-500">Toque na barra para ver</span>
        )}
      </div>

      {/* Gráfico de Barras SVG Interativo */}
      <div className="h-36 w-full flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-1 border-b border-zinc-800/80">
        {data.map((item, idx) => {
          const heightPercent = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
          const isOverAverage = item.amount > dailyAverage * 1.5;
          const isSelected = activeDay?.date === item.date;

          return (
            <div
              key={item.date}
              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
              onClick={() => setActiveDay(item)}
              onMouseEnter={() => setActiveDay(item)}
            >
              <div
                style={{ height: `${Math.max(4, heightPercent)}%` }}
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isSelected
                    ? 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                    : isOverAverage
                    ? 'bg-rose-500/80 hover:bg-rose-400'
                    : item.amount > 0
                    ? 'bg-zinc-600 hover:bg-zinc-400'
                    : 'bg-zinc-800/40 hover:bg-zinc-700'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Linha do tempo com dias principais */}
      <div className="flex justify-between text-[10px] text-zinc-500 px-1">
        <span>Dia 1</span>
        <span>Dia 10</span>
        <span>Dia 20</span>
        <span>Hoje</span>
      </div>
    </div>
  );
}
