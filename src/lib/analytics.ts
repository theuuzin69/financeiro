import { MonthlyAnalytics, TransactionSource } from '@/types';
import { getAllTransactions, getBudgetForMonth, getFixedExpenses, getMonthlyIncome } from './storage';
import { DEFAULT_CATEGORIES } from './categories';
import { generateLiveAdvice } from './advice-engine';

export function getMonthlyAnalytics(month: string): MonthlyAnalytics {
  const allTransactions = getAllTransactions();
  const budget = getBudgetForMonth(month);
  const monthlyIncome = getMonthlyIncome();
  const fixedExpensesList = getFixedExpenses();

  // 1. Total de Gastos Fixos Ativos
  const totalFixedExpenses = fixedExpensesList
    .filter(f => f.active)
    .reduce((acc, f) => acc + f.amount, 0);

  // 2. Despesas variáveis e Rendas extras do mês
  const monthVariableExpenses = allTransactions.filter(
    t => t.type === 'expense' && t.date.startsWith(month)
  );

  const monthExtraIncomes = allTransactions.filter(
    t => t.type === 'income' && t.date.startsWith(month)
  );

  const totalExtraIncome = monthExtraIncomes.reduce((acc, t) => acc + t.amount, 0);
  const totalGrossIncome = monthlyIncome + totalExtraIncome;

  const totalVariableSpent = monthVariableExpenses.reduce((acc, t) => acc + t.amount, 0);
  const totalSpent = totalFixedExpenses + totalVariableSpent;
  const freeBalanceRemaining = totalGrossIncome - totalSpent;

  // 3. Dias restantes e cálculo diário seguro
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const now = new Date();
  const isCurrentMonth = 
    now.getFullYear() === year && (now.getMonth() + 1) === monthNum;

  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
  const daysRemainingInMonth = Math.max(1, daysInMonth - currentDay);

  const safeDailyAllowance = freeBalanceRemaining > 0 
    ? Math.round((freeBalanceRemaining / daysRemainingInMonth) * 100) / 100 
    : 0;

  const dailyAverageSpent = currentDay > 0 ? totalVariableSpent / currentDay : 0;
  const projectedEndMonthSpent = isCurrentMonth 
    ? totalFixedExpenses + totalVariableSpent + (dailyAverageSpent * daysRemainingInMonth)
    : totalSpent;

  const totalBudget = monthlyIncome > 0 ? monthlyIncome : (budget.totalLimit || 3000);
  const budgetPercentage = Math.round((totalSpent / totalBudget) * 100);

  // 4. Breakdown por Categoria (incluindo fixos e variáveis)
  const catSpendingMap: Record<string, number> = {};

  // Adiciona fixos na respectiva categoria
  for (const f of fixedExpensesList) {
    if (f.active) {
      catSpendingMap[f.category] = (catSpendingMap[f.category] || 0) + f.amount;
    }
  }

  // Adiciona variáveis
  for (const t of monthVariableExpenses) {
    catSpendingMap[t.category] = (catSpendingMap[t.category] || 0) + t.amount;
  }

  const categoryBreakdown = DEFAULT_CATEGORIES.map(cat => {
    const amount = catSpendingMap[cat.name] || 0;
    const catBudget = budget.categoryLimits[cat.name] || cat.defaultBudget;
    const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
    const catBudgetPct = catBudget > 0 ? Math.round((amount / catBudget) * 100) : 0;

    return {
      category: cat.name,
      amount,
      percentage,
      budget: catBudget,
      budgetPercentage: catBudgetPct,
      isOverBudget: amount > catBudget,
      color: cat.color,
      icon: cat.icon,
    };
  }).sort((a, b) => b.amount - a.amount);

  // 5. Evolução diária de compras variáveis
  const dailyMap: Record<string, number> = {};
  for (let d = 1; d <= currentDay; d++) {
    const dayStr = `${month}-${String(d).padStart(2, '0')}`;
    dailyMap[dayStr] = 0;
  }

  for (const t of monthVariableExpenses) {
    const day = t.date.slice(0, 10);
    if (dailyMap[day] !== undefined) {
      dailyMap[day] += t.amount;
    }
  }

  const dailySpending = Object.entries(dailyMap).map(([date, amount]) => {
    const dayNum = date.split('-')[2];
    return {
      date,
      dayLabel: `Dia ${parseInt(dayNum, 10)}`,
      amount,
    };
  });

  // 6. Gastos por canal
  const sourceLabels: Record<TransactionSource, string> = {
    apple_pay: 'Apple Pay (Carteira)',
    santander_pix: 'Santander PIX',
    santander_card: 'Cartão Santander',
    manual: 'Lançamento Manual',
    generic_webhook: 'Outros Webhooks',
  };

  const sourceCounts: Record<string, { amount: number; count: number }> = {};
  for (const t of monthVariableExpenses) {
    if (!sourceCounts[t.source]) {
      sourceCounts[t.source] = { amount: 0, count: 0 };
    }
    sourceCounts[t.source].amount += t.amount;
    sourceCounts[t.source].count += 1;
  }

  const spendingBySource = Object.entries(sourceCounts).map(([src, val]) => ({
    source: src as TransactionSource,
    label: sourceLabels[src as TransactionSource] || src,
    amount: val.amount,
    count: val.count,
  })).sort((a, b) => b.amount - a.amount);

  // 7. Dicas de Economia e Investimento Dinâmicas Reais
  const adviceList = generateLiveAdvice({
    monthlyIncome: totalGrossIncome,
    fixedExpenses: fixedExpensesList,
    transactions: allTransactions,
    currentMonth: month,
  });

  return {
    currentMonth: month,
    monthlyIncome,
    totalExtraIncome,
    totalGrossIncome,
    totalFixedExpenses,
    totalVariableSpent,
    totalSpent,
    freeBalanceRemaining,
    safeDailyAllowance,
    daysRemainingInMonth,
    totalBudget,
    budgetPercentage,
    projectedEndMonthSpent,
    dailyAverageSpent,
    fixedExpensesList,
    categoryBreakdown,
    dailySpending,
    spendingBySource,
    adviceList,
  };
}
