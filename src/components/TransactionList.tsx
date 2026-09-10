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
  TrendingUp,
  Plus
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
  onOpenAddModal: () => void;
}

export function TransactionList({
  transactions,
  onDelete,
  onRefresh,
  onOpenAddModal,
}: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
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
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-950/70 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/50">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          Renda Extra
        </span>
      );
    }

    switch (source) {
      case 'apple_pay':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700">
            <Smartphone className="w-3 h-3 text-emerald-400" />
            Apple Pay
          </span>
        );
      case 'santander_pix':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-teal-950/60 text-teal-300 px-2 py-0.5 rounded-full border border-teal-800/40">
            <Zap className="w-3 h-3 text-teal-400" />
            Santander PIX
          </span>
        );
      case 'santander_card':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800/40">
            <CreditCard className="w-3 h-3 text-rose-400" />
            Cartão Santander
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            <PenLine className="w-3 h-3" />
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-[#121216] border border-zinc-800/80 rounded-3xl p-5 shadow-lg space-y-4">
      {/* Cabeçalho do Extrato */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Extrato de Lançamentos
          </h3>
          <p className="text-xs text-zinc-400">
            {filtered.length} {filtered.length === 1 ? 'registro encontrado' : 'registros encontrados'}
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por loja, categoria ou nota..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros em abas leves */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-full shrink-0 font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-zinc-200 text-zinc-900 font-bold'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
            }`}
          >
            Tudo
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1 rounded-full shrink-0 flex items-center gap-1 font-medium transition-colors ${
              selectedType === 'expense'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
            }`}
          >
            <TrendingDown className="w-3 h-3" /> Despesas
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1 rounded-full shrink-0 flex items-center gap-1 font-medium transition-colors ${
              selectedType === 'income'
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Rendas Extras
          </button>
          <button
            onClick={() => setSelectedSource(selectedSource === 'apple_pay' ? 'all' : 'apple_pay')}
            className={`px-3 py-1 rounded-full shrink-0 flex items-center gap-1 font-medium transition-colors ${
              selectedSource === 'apple_pay'
                ? 'bg-zinc-700 text-white font-bold'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
            }`}
          >
            <Smartphone className="w-3 h-3" /> Apple Pay
          </button>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="space-y-2 pt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs">
            Nenhum lançamento encontrado para os filtros selecionados.
          </div>
        ) : (
          filtered.map(tx => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                onClick={() => setEditingTx(tx)}
                className="bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome 
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {isIncome ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <CategoryIcon name={tx.category} className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs sm:text-sm text-white truncate group-hover:text-sky-300 transition-colors">
                        {tx.merchant}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {tx.category}
                      </span>
                      <span className="text-zinc-600 text-[10px]">•</span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
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
                      isIncome ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {isIncome ? '+ ' : '- '}R$ {tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate max-w-[110px]">
                      {tx.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTx(tx);
                      }}
                      className="text-zinc-400 hover:text-sky-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Editar lançamento (ajustar valor ou categoria)"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(tx.id, e)}
                      disabled={deletingId === tx.id}
                      className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
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
