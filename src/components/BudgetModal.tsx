import React, { useState, useEffect } from 'react';
import { BudgetGoal } from '@/types';
import { DEFAULT_CATEGORIES, calculateCategoryLimits, FIXED_EDUCATION_BUDGET } from '@/lib/categories';
import { X, Check, Target, DollarSign, Sparkles } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  onSuccess: () => void;
}

export function BudgetModal({ isOpen, onClose, month, onSuccess }: BudgetModalProps) {
  const [totalBudget, setTotalBudget] = useState<number>(3000);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/budget?month=${month}`)
        .then(res => res.json())
        .then(data => {
          if (data.budget) {
            const limit = data.budget.totalLimit || 3000;
            setTotalBudget(limit);
            // Se os limites não estiverem definidos ou Educação for o antigo 300, calcula os limites dinâmicos
            const incomingLimits = data.budget.categoryLimits || {};
            if (!incomingLimits['Educação'] || incomingLimits['Educação'] === 300) {
              setCategoryBudgets(calculateCategoryLimits(limit));
            } else {
              setCategoryBudgets(incomingLimits);
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, month]);

  if (!isOpen) return null;

  const handleCategoryChange = (catName: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCategoryBudgets(prev => ({
      ...prev,
      [catName]: num,
    }));
  };

  const handleAutoDistribute = () => {
    const dynamicLimits = calculateCategoryLimits(totalBudget);
    setCategoryBudgets(dynamicLimits);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          totalLimit: totalBudget,
          categoryLimits: categoryBudgets,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181b] border border-zinc-700/80 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              Metas de Orçamento ({month})
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tetos calculados proporcionalmente com Educação fixa em R$ 1.035,00.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Orçamento Geral */}
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-1.5">
            <label className="text-xs font-bold text-white block">
              Teto Máximo Mensal Geral / Renda (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">R$</span>
              <input
                type="number"
                value={totalBudget}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  setTotalBudget(val);
                }}
                className="w-full bg-black/60 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              O app avisará quando seu ritmo de compras indicar risco de estourar esse valor.
            </p>
          </div>

          {/* Orçamentos por Categoria */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                Limites por Categoria
              </h4>
              <button
                type="button"
                onClick={handleAutoDistribute}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-1 rounded-lg transition-colors"
                title="Recalcula os tetos com Educação fixa em R$ 1.035 e o restante proporcional à renda"
              >
                <Sparkles className="w-3 h-3" />
                Distribuir pela Renda
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_CATEGORIES.map(cat => {
                const isEdu = cat.name === 'Educação';
                const currentVal = categoryBudgets[cat.name] ?? (isEdu ? FIXED_EDUCATION_BUDGET : cat.defaultBudget);
                return (
                  <div key={cat.id} className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.name} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-zinc-200 truncate block">
                          {cat.name}
                        </span>
                        {isEdu && (
                          <span className="text-[10px] text-amber-400 font-medium block">
                            Fixo R$ 1.035
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        value={currentVal}
                        onChange={e => handleCategoryChange(cat.name, e.target.value)}
                        className="w-full bg-black/50 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold text-right text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé fixo */}
        <div className="pt-3 border-t border-zinc-800 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-400/20"
          >
            {saving ? 'Salvando...' : 'Salvar Metas'}
          </button>
        </div>
      </div>
    </div>
  );
}
