import React, { useState } from 'react';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import { TransactionType } from '@/types';
import { X, Check, PenLine, TrendingDown, TrendingUp } from 'lucide-react';

function parseAmountInput(val: string): number {
  if (!val) return 0;
  let cleaned = val.replace(/R\$\s*/i, '').replace(/[^\d.,]/g, '').trim();
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTx?: any) => void;
}

export function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [paymentMethod, setPaymentMethod] = useState('Apple Pay');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsedAmount = parseAmountInput(amount);
      if (parsedAmount <= 0) {
        setError('Por favor, digite um valor maior que zero.');
        setLoading(false);
        return;
      }

      // Constrói a data selecionada (meio-dia UTC para evitar problemas de fuso)
      const txDate = date ? new Date(date + 'T12:00:00.000Z').toISOString() : new Date().toISOString();

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: merchant.trim(),
          amount: parsedAmount,
          category: type === 'income' ? (category || 'Renda Extra') : category,
          type,
          paymentMethod: type === 'income' ? (paymentMethod || 'Depósito / Pix') : paymentMethod,
          source: paymentMethod.includes('Apple') ? 'apple_pay' : paymentMethod.includes('Pix') ? 'santander_pix' : 'manual',
          notes: notes.trim() || undefined,
          date: txDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMerchant('');
        setAmount('');
        setNotes('');
        onSuccess(data.transaction);
        onClose();
      } else {
        setError(data.error || 'Falha ao salvar lançamento');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-700/80 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PenLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Novo Lançamento
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Alternador Despesa vs Renda Extra */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-zinc-900 p-1 border border-slate-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory(DEFAULT_CATEGORIES[0].name);
              }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Renda Extra');
              }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Renda Extra
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
              {type === 'income' ? 'Origem do Ganho / Descrição' : 'Estabelecimento / Onde gastou'}
            </label>
            <input
              type="text"
              required
              placeholder={type === 'income' ? 'Ex: Freela design, Venda de item...' : 'Ex: Supermercado Pão de Açúcar'}
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                Valor (R$)
              </label>
              <input
                type="text"
                required
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              >
                {type === 'income' ? (
                  <>
                    <option value="Renda Extra">Renda Extra</option>
                    <option value="Freela / Trabalho">Freela / Trabalho</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Investimentos">Investimentos</option>
                    <option value="Outros Ganhos">Outros Ganhos</option>
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

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                Forma de Pagamento / Canal
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
              >
                {type === 'income' ? (
                  <>
                    <option value="Pix Recebido">Pix Recebido</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Outro">Outro</option>
                  </>
                ) : (
                  <>
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="Santander PIX">Santander PIX</option>
                    <option value="Cartão Santander Débito">Cartão Santander Débito</option>
                    <option value="Cartão Santander Crédito">Cartão Santander Crédito</option>
                    <option value="Dinheiro / Manual">Dinheiro / Manual</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
              Notas / Observação (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pagamento adiantado, compra com amigo..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
            />
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs border border-slate-200 dark:border-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              {loading ? 'Salvando...' : type === 'income' ? 'Lançar Renda Extra' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
