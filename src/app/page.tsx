'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MonthlyAnalytics, Transaction } from '@/types';
import { FriendlySummary } from '@/components/FriendlySummary';
import { FixedExpensesManager } from '@/components/FixedExpensesManager';
import { DynamicAdviceSection } from '@/components/DynamicAdvice';
import { CategoryBreakdown } from '@/components/CategoryPieChart';
import { TransactionList } from '@/components/TransactionList';
import { IphoneShortcutGuide } from '@/components/IphoneShortcutGuide';
import { IncomeModal } from '@/components/IncomeModal';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { BottomNav, TabType } from '@/components/BottomNav';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Sun,
  Moon,
  Database,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);
  const [secretKey] = useState('iphone_secret_key_santander_2026');

  // Inicialização e persistência do Tema Claro / Escuro
  useEffect(() => {
    const savedTheme = localStorage.getItem('financas_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('financas_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Verifica se o banco de dados na nuvem (Vercel KV) está conectado
  useEffect(() => {
    fetch('/api/sync')
      .then(res => res.json())
      .then(data => {
        if (typeof data.cloudConnected === 'boolean') {
          setIsCloudConnected(data.cloudConnected);
        }
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [resAnalytics, resTx] = await Promise.all([
        fetch(`/api/analytics?month=${currentMonth}`),
        fetch(`/api/transactions?month=${currentMonth}`),
      ]);

      const dataAnalytics = await resAnalytics.json();
      const dataTx = await resTx.json();

      let serverTransactions: Transaction[] = dataTx.transactions || [];

      // 🛡️ PROTEÇÃO CONTRA PERDA EM DEPLOYS DA VERCEL:
      // Se o servidor retornou dados válidos, salva um backup seguro no navegador
      if (serverTransactions.length > 0) {
        localStorage.setItem(`finance_backup_tx_${currentMonth}`, JSON.stringify(serverTransactions));
      } else {
        // Se o servidor voltou vazio (ex: deploy recente em container limpo sem KV conectado),
        // mas este aparelho possui dados locais salvos:
        try {
          const rawBackup = localStorage.getItem(`finance_backup_tx_${currentMonth}`);
          if (rawBackup) {
            const parsedBackup: Transaction[] = JSON.parse(rawBackup);
            if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
              console.log('Restaurando dados locais salvos para o servidor...');
              serverTransactions = parsedBackup;
              // Envia para o servidor persistir
              fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions: parsedBackup }),
              }).catch(console.error);
            }
          }
        } catch (e) {
          console.error('Erro ao restaurar backup local:', e);
        }
      }

      if (dataAnalytics.data) {
        setAnalytics(dataAnalytics.data);
      }
      setTransactions(serverTransactions);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeMonth = (offset: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${newYear}-${newMonth}`);
  };

  const formatMonthTitle = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleDeleteTransaction = async (id: string) => {
    // 1. Atualização Otimista Imediata na tela (sem delay ou engasgos)
    const previous = [...transactions];
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem(`finance_backup_tx_${currentMonth}`, JSON.stringify(updated));

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setTransactions(previous);
        localStorage.setItem(`finance_backup_tx_${currentMonth}`, JSON.stringify(previous));
      } else {
        loadData();
      }
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
      setTransactions(previous);
      localStorage.setItem(`finance_backup_tx_${currentMonth}`, JSON.stringify(previous));
    }
  };

  const handleAddTransactionSuccess = (newTx?: Transaction) => {
    if (newTx && newTx.date) {
      const txMonth = newTx.date.slice(0, 7);
      if (txMonth !== currentMonth) {
        setCurrentMonth(txMonth);
      } else {
        setTransactions(prev => {
          const updated = [newTx, ...prev];
          localStorage.setItem(`finance_backup_tx_${currentMonth}`, JSON.stringify(updated));
          return updated;
        });
      }
    }
    loadData();
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c] text-slate-500 dark:text-zinc-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Carregando suas finanças...</span>
        </div>
      </div>
    );
  }

  const topAdvice = analytics?.adviceList && analytics.adviceList.length > 0 
    ? analytics.adviceList[0] 
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 flex flex-col pb-24 selection:bg-emerald-500 selection:text-white transition-colors">
      {/* Barra de Topo */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 px-4 py-3 pt-safe transition-colors shadow-sm dark:shadow-none">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-xs shadow-md">
              FP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Finanças Pro
                </h1>
                <button
                  onClick={toggleTheme}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-600 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-300 transition-colors"
                  title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-sky-600" />
                  )}
                </button>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Automação iPhone Ativa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors shadow-xs"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            </button>

            {/* ÚNICO PONTO DE LANÇAMENTO DA APLICAÇÃO */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Lançar
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-xl mx-auto w-full px-4 pt-3.5 space-y-4 flex-1">
        {/* Alerta de Banco em Nuvem (se Vercel KV não estiver conectado) */}
        {isCloudConnected === false && (
          <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-zinc-200 space-y-1 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
              <Database className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Banco em Nuvem não conectado (Dados protegidos neste celular)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              O Vercel apaga o disco temporário em cada deploy de código. Seus lançamentos já foram salvos no backup deste aparelho, mas para sincronizar 100% na nuvem e receber webhooks mesmo com o app fechado, ative o <strong>Vercel KV</strong> gratuitamente na aba <em>Storage</em> da sua Vercel.
            </p>
          </div>
        )}

        {/* Seletor de Mês */}
        <div className="flex items-center justify-between bg-white dark:bg-[#121216] border border-slate-200/90 dark:border-zinc-800/80 px-3 py-2 rounded-2xl shadow-sm dark:shadow-none transition-colors">
          <button
            onClick={() => changeMonth(-1)}
            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider capitalize">
            {formatMonthTitle(currentMonth)}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================
            ABA 1: INÍCIO (Resumo Didático & Despoluído)
        ======================================================== */}
        {activeTab === 'dashboard' && analytics && (
          <div className="space-y-4 animate-fadeIn">
            {/* Placar Principal Didático */}
            <FriendlySummary
              income={analytics.monthlyIncome}
              extraIncome={analytics.totalExtraIncome}
              fixedTotal={analytics.totalFixedExpenses}
              variableTotal={analytics.totalVariableSpent}
              freeBalance={analytics.freeBalanceRemaining}
              safeDaily={analytics.safeDailyAllowance}
              daysRemaining={analytics.daysRemainingInMonth}
              salaryConfig={analytics.salaryConfig}
              nextSalaryPayment={analytics.nextSalaryPayment}
              onEditIncome={() => setIsIncomeModalOpen(true)}
            />

            {/* Destaque da Dica Principal do Momento */}
            {topAdvice && (
              <div 
                onClick={() => setActiveTab('advice')}
                className="bg-amber-50/70 hover:bg-amber-50/95 dark:from-amber-950/30 dark:to-zinc-900 dark:bg-zinc-900/60 border border-amber-200/90 dark:border-amber-800/50 p-4 rounded-3xl cursor-pointer hover:border-amber-300 dark:hover:border-amber-700/70 transition-all space-y-1.5 group shadow-sm dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Dica Especial para o seu Momento
                  </span>
                  <span className="text-xs text-amber-700 dark:text-zinc-400 group-hover:text-amber-900 dark:group-hover:text-white flex items-center gap-0.5 font-semibold">
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {topAdvice.title}
                </h4>
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {topAdvice.summary}
                </p>
              </div>
            )}

            {/* Gastos por Categoria */}
            <CategoryBreakdown
              categories={analytics.categoryBreakdown}
              totalSpent={analytics.totalSpent}
            />

            {/* Extrato de Lançamentos Completo e Rolável */}
            <TransactionList
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* ========================================================
            ABA 2: GASTOS FIXOS (Faculdade, Linha, etc.)
        ======================================================== */}
        {activeTab === 'fixed' && analytics && (
          <div className="space-y-4 animate-fadeIn">
            <FixedExpensesManager
              fixedExpenses={analytics.fixedExpensesList}
              income={analytics.totalGrossIncome || analytics.monthlyIncome}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* ========================================================
            ABA 3: EXTRATO COMPLETO
        ======================================================== */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-fadeIn">
            <TransactionList
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* ========================================================
            ABA 4: CONSULTORIA, DICAS & INVESTIMENTOS
        ======================================================== */}
        {activeTab === 'advice' && analytics && (
          <div className="space-y-4 animate-fadeIn">
            <DynamicAdviceSection
              adviceList={analytics.adviceList}
              income={analytics.totalGrossIncome || analytics.monthlyIncome}
            />
          </div>
        )}

        {/* ========================================================
            ABA 5: ATALHOS IPHONE & SIMULADOR
        ======================================================== */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-4 animate-fadeIn">
            <IphoneShortcutGuide
              webhookSecret={secretKey}
              onSimulateSuccess={loadData}
            />
          </div>
        )}
      </main>

      {/* Modais */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        currentIncome={analytics?.monthlyIncome ?? 3000}
        salaryConfig={analytics?.salaryConfig}
        onSuccess={loadData}
      />

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddTransactionSuccess}
      />

      {/* Barra Inferior */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />
    </div>
  );
}
