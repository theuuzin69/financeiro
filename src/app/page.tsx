'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MonthlyAnalytics, Transaction } from '@/types';
import { FriendlySummary } from '@/components/FriendlySummary';
import { FixedExpensesManager } from '@/components/FixedExpensesManager';
import { DynamicAdviceSection } from '@/components/DynamicAdvice';
import { QuickManualEntry } from '@/components/QuickManualEntry';
import { CategoryBreakdown } from '@/components/CategoryPieChart';
import { DailySpendingChart } from '@/components/DailySpendingChart';
import { SourcesBreakdown } from '@/components/SourcesBreakdown';
import { TransactionList } from '@/components/TransactionList';
import { IphoneShortcutGuide } from '@/components/IphoneShortcutGuide';
import { IncomeModal } from '@/components/IncomeModal';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { BottomNav, TabType } from '@/components/BottomNav';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sparkles,
  Smartphone,
  Compass,
  Building2,
  ArrowRight,
  Lightbulb,
  Sun,
  Moon
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
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [secretKey] = useState('iphone_secret_key_santander_2026');

  // Inicialização e persistência de Tema Claro / Escuro
  useEffect(() => {
    const savedTheme = localStorage.getItem('financas_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
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

  const loadData = useCallback(async () => {
    try {
      const [resAnalytics, resTx] = await Promise.all([
        fetch(`/api/analytics?month=${currentMonth}`),
        fetch(`/api/transactions?month=${currentMonth}`),
      ]);

      const dataAnalytics = await resAnalytics.json();
      const dataTx = await resTx.json();

      if (dataAnalytics.data) {
        setAnalytics(dataAnalytics.data);
      }
      if (dataTx.transactions) {
        setTransactions(dataTx.transactions);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
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
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-zinc-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Carregando suas finanças...</span>
        </div>
      </div>
    );
  }

  const topAdvice = analytics?.adviceList && analytics.adviceList.length > 0 
    ? analytics.adviceList[0] 
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col pb-24 selection:bg-emerald-500 selection:text-black">
      {/* Barra de Topo Limpa: APENAS O BOTÃO DE LANÇAMENTO MANUAL À DIREITA */}
      <header className="sticky top-0 z-30 bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-3 pt-safe">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-black text-xs shadow-md">
              FP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                  Finanças Pro
                </h1>
                <button
                  onClick={toggleTheme}
                  className="p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-300 transition-colors"
                  title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-sky-400" />
                  )}
                </button>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Automação iPhone Ativa
              </span>
            </div>
          </div>

          {/* ÚNICO BOTÃO NO TOPO: LANÇAMENTO MANUAL DE DESPESAS */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Lançar
          </button>
        </div>
      </header>

      {/* Conteúdo Principal com Layout Limpo e Amigável */}
      <main className="max-w-xl mx-auto w-full px-4 pt-3.5 space-y-4 flex-1">
        {/* Seletor de Mês Suave */}
        <div className="flex items-center justify-between bg-[#121216] border border-zinc-800/80 px-3 py-2 rounded-2xl">
          <button
            onClick={() => changeMonth(-1)}
            className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-white uppercase tracking-wider capitalize">
            {formatMonthTitle(currentMonth)}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================
            ABA 1: INÍCIO (Resumo Tranquilo & Didático)
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
              onEditIncome={() => setIsIncomeModalOpen(true)}
            />

            {/* Destaque da Dica Principal do Momento */}
            {topAdvice && (
              <div 
                onClick={() => setActiveTab('advice')}
                className="bg-gradient-to-r from-amber-950/30 to-zinc-900 border border-amber-800/50 p-4 rounded-3xl cursor-pointer hover:border-amber-700/70 transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Dica Especial para o seu Momento
                  </span>
                  <span className="text-xs text-zinc-400 group-hover:text-white flex items-center gap-0.5">
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">
                  {topAdvice.title}
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {topAdvice.summary}
                </p>
              </div>
            )}

            {/* Gastos por Categoria */}
            <CategoryBreakdown
              categories={analytics.categoryBreakdown}
              totalSpent={analytics.totalSpent}
            />

            {/* Lançamento Manual Rápido (Despesa ou Renda Extra) */}
            <QuickManualEntry onSuccess={loadData} />

            {/* Últimos Lançamentos */}
            <TransactionList
              transactions={transactions.slice(0, 5)}
              onDelete={handleDeleteTransaction}
              onRefresh={loadData}
              onOpenAddModal={() => setIsAddModalOpen(true)}
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
            ABA 3: EXTRATO & LANÇAMENTOS (Dia a Dia)
        ======================================================== */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-fadeIn">
            <QuickManualEntry onSuccess={loadData} />
            <TransactionList
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              onRefresh={loadData}
              onOpenAddModal={() => setIsAddModalOpen(true)}
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

      {/* Modais Flutuantes */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        currentIncome={analytics?.monthlyIncome ?? 3000}
        onSuccess={loadData}
      />

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Barra Inferior com Safe-Area para iPhone */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />
    </div>
  );
}
