import { FinancialInsight, Transaction } from '@/types';
import { DEFAULT_CATEGORIES } from './categories';

interface InsightsInput {
  transactions: Transaction[];
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  month: string; // YYYY-MM
}

export function generateFinancialInsights({
  transactions,
  monthlyBudget,
  categoryBudgets,
  month,
}: InsightsInput): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = currentDay / daysInMonth;

  // Filtrar despesas do mês atual
  const monthExpenses = transactions.filter(t => {
    return t.type === 'expense' && t.date.startsWith(month);
  });

  const totalSpent = monthExpenses.reduce((acc, t) => acc + t.amount, 0);

  // 1. Alerta de Ritmo Geral de Consumo (Overconsumption Pace)
  const budgetSpentPct = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
  const projectedSpent = monthProgress > 0 ? (totalSpent / monthProgress) : totalSpent;

  if (monthlyBudget > 0 && budgetSpentPct > (monthProgress * 100) + 15) {
    const diff = projectedSpent - monthlyBudget;
    insights.push({
      id: 'alert-over-pace',
      type: 'overconsumption',
      severity: budgetSpentPct > 90 ? 'critical' : 'warning',
      title: 'Alerta de Ritmo Acelerado de Gastos',
      description: `Você já consumiu ${budgetSpentPct.toFixed(0)}% do orçamento mensal total com apenas ${(monthProgress * 100).toFixed(0)}% do mês decorrido (dia ${currentDay} de ${daysInMonth}).`,
      actionableTip: `Se mantiver o ritmo diário atual de R$ ${(totalSpent / currentDay).toFixed(2)}, você fechará o mês gastando R$ ${projectedSpent.toFixed(2)}, ultrapassando sua meta em R$ ${diff > 0 ? diff.toFixed(2) : '0,00'}. Reduza a média diária para até R$ ${((monthlyBudget - totalSpent) / Math.max(1, daysInMonth - currentDay)).toFixed(2)} para equilibrar.`,
      impactAmount: diff > 0 ? diff : undefined,
      date: new Date().toISOString(),
    });
  } else if (monthlyBudget > 0 && budgetSpentPct <= monthProgress * 100) {
    insights.push({
      id: 'milestone-good-pace',
      type: 'milestone',
      severity: 'success',
      title: 'Excelente Controle de Gastos!',
      description: `Seus gastos totais estão abaixo da média esperada para este período do mês (${budgetSpentPct.toFixed(0)}% consumido vs ${(monthProgress * 100).toFixed(0)}% do mês).`,
      actionableTip: 'Continue assim! O excedente pode ser direcionado para investimentos ou sua reserva de emergência.',
      date: new Date().toISOString(),
    });
  }

  // 2. Análise por Categoria e Alertas de Teto
  const categoryTotals: Record<string, number> = {};
  for (const t of monthExpenses) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  }

  for (const cat of DEFAULT_CATEGORIES) {
    const spent = categoryTotals[cat.name] || 0;
    const catBudget = categoryBudgets[cat.name] || cat.defaultBudget;
    const catPct = catBudget > 0 ? (spent / catBudget) * 100 : 0;

    if (catPct >= 90) {
      insights.push({
        id: `alert-cat-${cat.id}`,
        type: 'overconsumption',
        severity: catPct > 100 ? 'critical' : 'warning',
        title: catPct > 100 ? `Limite Excedido em ${cat.name}` : `Atenção ao Teto de ${cat.name}`,
        category: cat.name,
        description: `Você gastou R$ ${spent.toFixed(2)} de um teto de R$ ${catBudget.toFixed(2)} (${catPct.toFixed(0)}%).`,
        actionableTip: catPct > 100 
          ? `Limite estourado em R$ ${(spent - catBudget).toFixed(2)}. Evite novos gastos não essenciais nesta categoria até a virada do mês.`
          : `Restam apenas R$ ${(catBudget - spent).toFixed(2)} para os próximos ${daysInMonth - currentDay} dias.`,
        impactAmount: spent - catBudget > 0 ? spent - catBudget : undefined,
        date: new Date().toISOString(),
      });
    }
  }

  // 3. Dica de Economia: Gastos com Delivery / Restaurantes
  const deliveryFood = monthExpenses.filter(t => {
    const m = t.merchant.toLowerCase();
    return m.includes('ifood') || m.includes('rappi') || m.includes('delivery') || m.includes('aiqfome');
  });
  const deliveryTotal = deliveryFood.reduce((acc, t) => acc + t.amount, 0);

  if (deliveryTotal > 300) {
    const potentialSaving = deliveryTotal * 0.4;
    insights.push({
      id: 'tip-delivery-spending',
      type: 'saving_tip',
      severity: 'info',
      title: 'Oportunidade de Economia: Pedidos Delivery',
      category: 'Alimentação',
      description: `Você já realizou ${deliveryFood.length} pedidos de delivery este mês, totalizando R$ ${deliveryTotal.toFixed(2)}.`,
      actionableTip: `Substituir 2 a 3 pedidos semanais por refeições preparadas em casa pode economizar aproximadamente R$ ${potentialSaving.toFixed(2)} por mês sem perder qualidade de vida.`,
      impactAmount: potentialSaving,
      date: new Date().toISOString(),
    });
  }

  // 4. Dica de Economia: Serviços e Assinaturas Recorrentes
  const recurring = monthExpenses.filter(t => {
    const m = t.merchant.toLowerCase();
    return ['netflix', 'spotify', 'apple', 'google', 'prime', 'disney', 'hbo', 'gympass', 'smart fit'].some(k => m.includes(k));
  });
  const recurringTotal = recurring.reduce((acc, t) => acc + t.amount, 0);

  if (recurring.length >= 3) {
    insights.push({
      id: 'tip-recurring-audit',
      type: 'saving_tip',
      severity: 'info',
      title: 'Auditoria de Assinaturas e Recorrências',
      category: 'Serviços & Assinaturas',
      description: `Identificamos ${recurring.length} assinaturas ativas que somam R$ ${recurringTotal.toFixed(2)} neste mês.`,
      actionableTip: 'Avalie planos anuais com desconto ou pacotes familiares divididos com amigos/família (ex: Spotify Familiar, Apple One).',
      impactAmount: recurringTotal * 0.25,
      date: new Date().toISOString(),
    });
  }

  // 5. Análise de Compras por Apple Pay vs Outros Meios
  const applePayTransactions = monthExpenses.filter(t => t.source === 'apple_pay');
  const applePayTotal = applePayTransactions.reduce((acc, t) => acc + t.amount, 0);

  if (applePayTransactions.length > 0) {
    insights.push({
      id: 'pattern-apple-pay',
      type: 'pattern',
      severity: 'info',
      title: 'Automação Apple Pay em Ação',
      description: `${applePayTransactions.length} compras (R$ ${applePayTotal.toFixed(2)}) foram registradas de forma 100% silenciosa via Carteira do iPhone.`,
      actionableTip: 'Suas despesas do dia a dia estão sendo capturadas sem nenhum atrito manual.',
      date: new Date().toISOString(),
    });
  }

  return insights;
}
