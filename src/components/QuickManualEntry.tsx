import React, { useState } from 'react';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import { TransactionType } from '@/types';
import { Plus, Check, Sparkles, PenLine, TrendingDown, TrendingUp } from 'lucide-react';

interface QuickManualEntryProps {
  onSuccess: () => void;
}

export function QuickManualEntry({ onSuccess }: QuickManualEntryProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim() || !amount) return;

    setLoading(true);
    try {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: merchant.trim(),
          amount: parsedAmount,
          category: type === 'income' ? 'Renda Extra' : category,
          type,
          source: 'manual',
          paymentMethod: type === 'income' ? 'Renda Extra Manual' : 'Lançamento Manual (Dinheiro/Pix)',
          date: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setMerchant('');
        setAmount('');
        setSuccessMsg(true);
        onSuccess();
        setTimeout(() => setSuccessMsg(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121216] border border-zinc-800/80 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <PenLine className="w-4 h-4 text-emerald-400" />
            Lançamento Rápido
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Adicione compras manuais ou novas rendas extras do mês
          </p>
        </div>

        {successMsg && (
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
            <Check className="w-3.5 h-3.5" /> Registrado!
          </span>
        )}
      </div>

      <form onSubmit={handleQuickSubmit} className="space-y-3">
        {/* Toggle Despesa vs Renda Extra */}
        <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs w-full sm:w-64">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory(DEFAULT_CATEGORIES[0].name);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> Despesa
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('Renda Extra');
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
              type === 'income'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Renda Extra
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Valor */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Valor (R$)
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 50,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Estabelecimento ou Origem */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              {type === 'income' ? 'Origem do Ganho' : 'Onde Gastou?'}
            </label>
            <input
              type="text"
              required
              placeholder={type === 'income' ? 'Ex: Freela, Venda...' : 'Ex: Feira, Padaria...'}
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {type === 'income' ? (
                <>
                  <option value="Renda Extra">Renda Extra</option>
                  <option value="Freela / Trabalho">Freela / Trabalho</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Investimentos">Investimentos</option>
                  <option value="Outros">Outros</option>
                </>
              ) : (
                DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
              type === 'income'
                ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10'
                : 'bg-zinc-100 hover:bg-white text-zinc-950'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {loading ? 'Salvando...' : type === 'income' ? 'Lançar Ganho Extra' : 'Adicionar Despesa'}
          </button>
        </div>
      </form>
    </div>
  );
}
