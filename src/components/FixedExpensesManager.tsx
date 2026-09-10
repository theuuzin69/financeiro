import React, { useState } from 'react';
import { FixedExpense } from '@/types';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import { CategoryIcon } from './CategoryIcon';
import { 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  X,
  CreditCard,
  Building2
} from 'lucide-react';

interface FixedExpensesManagerProps {
  fixedExpenses: FixedExpense[];
  income: number;
  onRefresh: () => void;
}

export function FixedExpensesManager({
  fixedExpenses,
  income,
  onRefresh,
}: FixedExpensesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [dueDay, setDueDay] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalFixed = fixedExpenses
    .filter(f => f.active)
    .reduce((acc, f) => acc + f.amount, 0);

  const fixedPercentage = income > 0 ? ((totalFixed / income) * 100).toFixed(0) : '0';

  const handleAddFixed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/fixed-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount.replace(',', '.')),
          category,
          dueDay: parseInt(dueDay, 10) || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setName('');
        setAmount('');
        setIsAdding(false);
        onRefresh();
      } else {
        setError(data.error || 'Erro ao adicionar gasto fixo');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFixed = async (id: string, expenseName: string) => {
    if (confirm(`Remover gasto fixo "${expenseName}"?`)) {
      try {
        const res = await fetch(`/api/fixed-expenses/${id}`, { method: 'DELETE' });
        if (res.ok) {
          onRefresh();
        }
      } catch (err) {
        console.error('Erro ao deletar:', err);
      }
    }
  };

  return (
    <div className="bg-[#121216] border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-lg space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            Seus Gastos Fixos Mensais
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compromissos obrigatórios que se repetem todo mês
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
            isAdding
              ? 'bg-zinc-800 text-zinc-300'
              : 'bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-md shadow-sky-500/20'
          }`}
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Fechar' : 'Novo Fixo'}
        </button>
      </div>

      {/* Resumo do Comprometimento */}
      <div className="bg-sky-950/30 border border-sky-800/40 rounded-2xl p-3.5 flex items-center justify-between text-xs">
        <div>
          <span className="text-sky-300 font-semibold block">Total Comprometido</span>
          <span className="text-zinc-400 text-[11px]">
            {fixedPercentage}% do seu salário de R$ {income.toFixed(0)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-base font-black text-white block">
            R$ {totalFixed.toFixed(2)}
          </span>
          <span className="text-[10px] text-sky-400 font-medium">
            {fixedExpenses.length} contas fixas ativas
          </span>
        </div>
      </div>

      {/* Formulário de Adicionar Novo Gasto Fixo */}
      {isAdding && (
        <form onSubmit={handleAddFixed} className="bg-zinc-900 border border-zinc-700/80 p-4 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Adicionar Nova Despesa Fixa
            </h4>
            <span className="text-[10px] text-zinc-500">Ex: Internet, Aluguel, Academia</span>
          </div>

          {error && (
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Nome da Conta
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Internet Claro"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Valor Mensal (R$)
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 99,90"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              >
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Dia do Vencimento (1 a 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 10"
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold shadow-md"
            >
              {loading ? 'Salvando...' : 'Cadastrar Gasto Fixo'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Gastos Fixos */}
      <div className="space-y-2.5">
        {fixedExpenses.map(item => (
          <div
            key={item.id}
            className="bg-zinc-900/60 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-950/60 text-sky-400 border border-sky-800/40 flex items-center justify-center shrink-0">
                <CategoryIcon name={item.category} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-white truncate">
                    {item.name}
                  </h4>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                  {item.dueDay && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      Vence todo dia {item.dueDay}
                    </span>
                  )}
                  <span>•</span>
                  <span>{((item.amount / income) * 100).toFixed(1)}% do salário</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-bold text-white block">
                R$ {item.amount.toFixed(2)}
              </span>
              <button
                onClick={() => handleDeleteFixed(item.id, item.name)}
                className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Remover gasto fixo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {fixedExpenses.length === 0 && (
          <div className="text-center py-6 text-zinc-500 text-xs">
            Nenhum gasto fixo cadastrado. Clique em "+ Novo Fixo" acima para começar.
          </div>
        )}
      </div>
    </div>
  );
}
