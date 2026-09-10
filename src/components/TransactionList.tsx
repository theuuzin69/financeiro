import React, { useState } from 'react';
import { Transaction, TransactionSource } from '@/types';
import { CategoryIcon } from './CategoryIcon';
import { EditTransactionModal } from './EditTransactionModal';
import { 
  Search, 
  Trash2, 
  Edit3,
  Smartphone, 
  Zap, 
  CreditCard, 
  PenLine, 
  Clock,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export function TransactionList({
  transactions,
  onDelete,
  onRefresh,
}: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtragem local
  const filtered = transactions.filter(tx => {
    const matchesSearch = 
      tx.merchant.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === 'all' || (tx.type || 'expense') === selectedType;
    const matchesSource = selectedSource === 'all' || tx.source === selectedSource;

    return matchesSearch && matchesType && matchesSource;
  });

  const getSourceBadge = (source: TransactionSource, type?: string) => {
    if (type === 'income') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800/50">
          <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Renda Extra
        </span>
      );
    }

    switch (source) {
      case 'apple_pay':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/40">
            <Smartphone className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            Apple Pay
          </span>
        );
      case 'santander_pix':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800/40">
            <Zap className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            Santander PIX
          </span>
        );
      case 'santander_card':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/40">
            <CreditCard className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Cartão Santander
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
            <PenLine className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
            Manual
          </span>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month} às ${hours}:${mins}`;
    } catch {
      return isoStr;
    }
  };

  const openDeleteConfirm = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setTxToDelete(tx);
  };

  return (
    <div className="bg-white dark:bg-[#121216] border border-slate-200/90 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm dark:shadow-lg space-y-4 transition-colors">
      {/* Cabeçalho do Extrato */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Extrato de Lançamentos
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {filtered.length} {filtered.length === 1 ? 'registro encontrado' : 'registros encontrados'}
          </p>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por loja, categoria ou nota..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900 transition-colors shadow-sm dark:shadow-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros em abas leves (sem botões pretos no tema claro) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-full shrink-0 font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-sm'
                : 'bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
            }`}
          >
            Tudo
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 font-medium transition-colors ${
              selectedType === 'expense'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
            }`}
          >
            <TrendingDown className="w-3 h-3" /> Despesas
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 font-medium transition-colors ${
              selectedType === 'income'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-sm'
                : 'bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Rendas Extras
          </button>
          <button
            onClick={() => setSelectedSource(selectedSource === 'apple_pay' ? 'all' : 'apple_pay')}
            className={`px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 font-medium transition-colors ${
              selectedSource === 'apple_pay'
                ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-zinc-950 font-bold shadow-sm'
                : 'bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
            }`}
          >
            <Smartphone className="w-3 h-3" /> Apple Pay
          </button>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="space-y-2 pt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-xs">
            Nenhum lançamento encontrado para os filtros selecionados.
          </div>
        ) : (
          filtered.map(tx => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                onClick={() => setEditingTx(tx)}
                className="bg-white hover:bg-slate-50 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer group shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
                      : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/60 dark:border-transparent'
                  }`}>
                    {isIncome ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <CategoryIcon name={tx.category} className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                        {tx.merchant}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                        {tx.category}
                      </span>
                      <span className="text-slate-300 dark:text-zinc-600 text-[10px]">•</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(tx.date)}
                      </span>
                    </div>
                    <div className="mt-1">
                      {getSourceBadge(tx.source, tx.type)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <span className={`text-xs sm:text-sm font-bold block ${
                      isIncome 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {isIncome ? '+ ' : '- '}R$ {tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate max-w-[110px]">
                      {tx.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTx(tx);
                      }}
                      className="text-slate-400 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors"
                      title="Editar lançamento (ajustar valor ou categoria)"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => openDeleteConfirm(tx, e)}
                      disabled={deletingId === tx.id}
                      className="text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmação de Exclusão (100% nativo e livre de bugs do iOS confirm) */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-700/80 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Excluir este lançamento?
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/70 rounded-2xl border border-slate-100 dark:border-zinc-800 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white truncate text-sm">
                {txToDelete.merchant}
              </div>
              <div className="text-slate-500 dark:text-zinc-400 flex justify-between items-center">
                <span>{txToDelete.category}</span>
                <span className={`font-bold ${txToDelete.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {txToDelete.type === 'income' ? '+ ' : '- '}R$ {txToDelete.amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingId === txToDelete.id}
                onClick={async () => {
                  setDeletingId(txToDelete.id);
                  const id = txToDelete.id;
                  setTxToDelete(null);
                  try {
                    await onDelete(id);
                  } finally {
                    setDeletingId(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {deletingId === txToDelete.id ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Lançamento */}
      <EditTransactionModal
        transaction={editingTx}
        isOpen={editingTx !== null}
        onClose={() => setEditingTx(null)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
