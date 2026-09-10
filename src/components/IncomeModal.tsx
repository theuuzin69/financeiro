import React, { useState } from 'react';
import { X, DollarSign, Check } from 'lucide-react';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncome: number;
  onSuccess: () => void;
}

export function IncomeModal({
  isOpen,
  onClose,
  currentIncome,
  onSuccess,
}: IncomeModalProps) {
  const [income, setIncome] = useState(String(currentIncome));
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyIncome: parseFloat(income.replace(',', '.')) }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181b] border border-zinc-700/80 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Ajustar Salário Mensal Líquido
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              Renda Mensal (R$)
            </label>
            <input
              type="text"
              required
              value={income}
              onChange={e => setIncome(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2.5 text-lg font-black text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Usado para calcular seu saldo livre e limite diário seguro de gastos.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/10"
            >
              {loading ? 'Salvando...' : 'Salvar Renda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
