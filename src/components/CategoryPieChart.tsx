import React from 'react';
import { CategoryIcon } from './CategoryIcon';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  budget: number;
  budgetPercentage: number;
  isOverBudget: boolean;
  color: string;
  icon: string;
}

interface CategoryBreakdownProps {
  categories: CategoryData[];
  totalSpent: number;
}

export function CategoryBreakdown({ categories, totalSpent }: CategoryBreakdownProps) {
  const activeCategories = categories.filter(c => c.amount > 0);

  return (
    <div className="bg-white dark:bg-[#121216] border border-slate-200/90 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm dark:shadow-lg space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Gastos por Categoria
        </h3>
        <span className="text-xs text-slate-500 dark:text-zinc-400">
          Total: <strong className="text-slate-900 dark:text-zinc-200">R$ {totalSpent.toFixed(2)}</strong>
        </span>
      </div>

      {/* Barra proporcional segmentada */}
      {activeCategories.length > 0 ? (
        <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-zinc-800">
          {activeCategories.map(cat => (
            <div
              key={cat.category}
              style={{
                width: `${cat.percentage}%`,
                backgroundColor: cat.color,
              }}
              title={`${cat.category}: ${cat.percentage}%`}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>
      ) : (
        <div className="h-3.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-slate-400 dark:text-zinc-500">
          Nenhuma despesa registrada
        </div>
      )}

      {/* Lista detalhada das categorias */}
      <div className="space-y-3 pt-1">
        {categories.map(cat => {
          const isOver = cat.budgetPercentage > 100;
          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.category} className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm block">
                      {cat.category}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                      Teto: R$ {cat.budget.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                    R$ {cat.amount.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-semibold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                    {cat.budgetPercentage}% do limite
                  </span>
                </div>
              </div>

              {/* Barra de progresso individual */}
              <div className="w-full bg-slate-100 dark:bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOver ? 'bg-rose-500' : cat.budgetPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, cat.budgetPercentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
