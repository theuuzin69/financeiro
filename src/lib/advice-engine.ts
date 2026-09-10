import { DynamicAdvice, FixedExpense, Transaction } from '@/types';

interface AdviceContext {
  monthlyIncome: number;
  fixedExpenses: FixedExpense[];
  transactions: Transaction[];
  currentMonth: string; // YYYY-MM
}

export function generateLiveAdvice({
  monthlyIncome,
  fixedExpenses,
  transactions,
  currentMonth,
}: AdviceContext): DynamicAdvice[] {
  const adviceList: DynamicAdvice[] = [];

  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  // 1. Cálculos do Fluxo Financeiro Real
  const totalFixed = fixedExpenses
    .filter(f => f.active)
    .reduce((acc, f) => acc + f.amount, 0);

  const monthTransactions = transactions.filter(t => 
    t.type === 'expense' && t.date.startsWith(currentMonth)
  );

  const totalVariable = monthTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalSpent = totalFixed + totalVariable;
  const freeBalance = monthlyIncome - totalSpent;
  const safeDaily = freeBalance > 0 ? freeBalance / daysRemaining : 0;
  const currentDailyPace = currentDay > 0 ? totalVariable / currentDay : 0;

  const fixedPctOfIncome = (totalFixed / monthlyIncome) * 100;
  const variablePctOfIncome = (totalVariable / monthlyIncome) * 100;

  // -------------------------------------------------------------
  // DICA 1: Raio-X do seu Saldo e Limite Diário Seguro
  // -------------------------------------------------------------
  if (freeBalance <= 0) {
    adviceList.push({
      id: 'budget-deficit',
      category: 'alert',
      level: 'urgent',
      title: '🚨 Alerta: Saldo do Mês Esgotado',
      summary: `Você já comprometeu 100% da sua renda de R$ ${monthlyIncome.toFixed(2)} com despesas fixas e variáveis.`,
      detailedAdvice: `Com seus gastos fixos de R$ ${totalFixed.toFixed(2)} (Faculdade, Telefone...) e R$ ${totalVariable.toFixed(2)} em compras do dia a dia, você está em déficit de R$ ${Math.abs(freeBalance).toFixed(2)}.`,
      suggestedAction: 'Congele gastos em lazer e delivery até a virada do mês para não recorrer ao cheque especial ou juros rotativos do cartão.',
      impactAmount: Math.abs(freeBalance),
    });
  } else if (safeDaily < 20) {
    adviceList.push({
      id: 'daily-tight',
      category: 'alert',
      level: 'attention',
      title: '⚠️ Atenção: Limite Diário Crítico',
      summary: `Você possui apenas R$ ${freeBalance.toFixed(2)} livres para os próximos ${daysRemaining} dias.`,
      detailedAdvice: `Isso permite gastar no máximo R$ ${safeDaily.toFixed(2)} por dia até o final do mês. Qualquer saída extra ou pedido de comida pode fazer você fechar no vermelho.`,
      suggestedAction: 'Dê preferência a refeições caseiras e evite compras não essenciais na internet esta semana.',
      impactAmount: freeBalance,
    });
  } else {
    adviceList.push({
      id: 'daily-healthy',
      category: 'saving',
      level: 'good',
      title: '✅ Ritmo Saudável: R$ ' + safeDaily.toFixed(2) + ' por dia disponíveis',
      summary: `Restam R$ ${freeBalance.toFixed(2)} de saldo livre para os próximos ${daysRemaining} dias do mês.`,
      detailedAdvice: `Seus gastos fixos (R$ ${totalFixed.toFixed(2)}) representam ${fixedPctOfIncome.toFixed(0)}% do seu salário de R$ ${monthlyIncome.toFixed(2)}. Como você gastou R$ ${totalVariable.toFixed(2)} no dia a dia, seu ritmo está equilibrado.`,
      suggestedAction: `Se você mantiver sua média de gastos abaixo de R$ ${(safeDaily * 0.7).toFixed(2)}/dia, você terminará o mês com mais de R$ ${(freeBalance * 0.3).toFixed(2)} sobrando para investir.`,
      impactAmount: freeBalance * 0.3,
    });
  }

  // -------------------------------------------------------------
  // DICA 2: Onde Investir no seu Momento Atual (R$ 3.000 / Faculdade)
  // -------------------------------------------------------------
  // Meta de reserva para custos fixos de R$ 1.080 (3 a 6 meses = R$ 3.240 a R$ 6.480)
  const emergencyTargetMin = totalFixed * 3;
  const emergencyTargetMax = totalFixed * 6;
  const suggestedMonthlyInvestment = Math.max(150, Math.min(400, freeBalance * 0.25));

  adviceList.push({
    id: 'investment-roadmap',
    category: 'investment',
    level: 'good',
    title: '📈 Estratégia de Investimento para o seu Salário',
    summary: `Recomendação de aporte: R$ ${suggestedMonthlyInvestment.toFixed(2)}/mês com foco em segurança.`,
    detailedAdvice: `Como você tem um compromisso forte de R$ 1.035 na Faculdade, sua prioridade número 1 não deve ser ações ou risco, mas sim construir uma **Reserva de Emergência** de R$ ${emergencyTargetMin.toFixed(2)} a R$ ${emergencyTargetMax.toFixed(2)} (equivalente a 3 a 6 meses dos seus custos fixos).`,
    suggestedAction: 'Aplique esse valor mensal no **Tesouro Selic** ou em um **CDB de 100% do CDI com Liquidez Diária** no Santander ou Nubank. O rendimento é diário e você pode resgatar a qualquer momento se surgir um imprevisto na faculdade.',
    impactAmount: suggestedMonthlyInvestment * 12,
  });

  // -------------------------------------------------------------
  // DICA 3: Estudo Específico das Compras Reais (iFood / Delivery / Lazer)
  // -------------------------------------------------------------
  const deliveryOrDining = monthTransactions.filter(t => {
    const m = t.merchant.toLowerCase();
    return m.includes('ifood') || m.includes('rappi') || m.includes('restaurante') || m.includes('lanche') || m.includes('pizza');
  });

  const deliveryTotal = deliveryOrDining.reduce((acc, t) => acc + t.amount, 0);

  if (deliveryTotal > 150) {
    const deliveryPct = (deliveryTotal / monthlyIncome) * 100;
    const hoursWorked = Math.round((deliveryTotal / (monthlyIncome / 160))); // 160h mês

    adviceList.push({
      id: 'dining-study',
      category: 'saving',
      level: deliveryTotal > 300 ? 'attention' : 'good',
      title: '🍔 Análise de Gastos: Delivery & Lanches',
      summary: `Você já gastou R$ ${deliveryTotal.toFixed(2)} com delivery e restaurantes (${deliveryPct.toFixed(1)}% do seu salário).`,
      detailedAdvice: `Para pagar esses R$ ${deliveryTotal.toFixed(2)}, você precisou trabalhar aproximadamente **${hoursWorked} horas** neste mês. Com uma faculdade de R$ 1.035, pequenos vazamentos no iFood fazem uma diferença brutal no fim do mês.`,
      suggestedAction: `Cozinhar em lote no fim de semana ou limitar pedidos a 1 vez por semana pode devolver até R$ ${(deliveryTotal * 0.45).toFixed(2)} para o seu bolso todo mês. Em 1 ano, essa economia paga 1 mensalidade inteira da faculdade!`,
      impactAmount: deliveryTotal * 0.45,
    });
  }

  // -------------------------------------------------------------
  // DICA 4: Auditoria de Gastos Fixos e Recorrências
  // -------------------------------------------------------------
  const phoneExpense = fixedExpenses.find(f => f.name.toLowerCase().includes('telef') || f.name.toLowerCase().includes('celular'));
  if (phoneExpense) {
    adviceList.push({
      id: 'fixed-phone-review',
      category: 'saving',
      level: 'good',
      title: '📱 Otimização: Plano Telefônico',
      summary: `Sua linha fixa de R$ ${phoneExpense.amount.toFixed(2)} representa ${(phoneExpense.amount / monthlyIncome * 100).toFixed(1)}% da sua renda.`,
      detailedAdvice: 'O valor está dentro de um patamar aceitável para o mercado brasileiro. Porém, anualmente as operadoras renovam planos digitais (como Vivo Easy, Claro Flex ou TIM Controle) com bônus de internet e roaming inclusos sem fidelidade.',
      suggestedAction: 'A cada 6 meses, consulte se o plano Flex da sua operadora oferece mais gigas ou bônus com pagamento direto no cartão por esse mesmo valor.',
      impactAmount: phoneExpense.amount * 0.2,
    });
  }

  // -------------------------------------------------------------
  // DICA 5: O que Fazer com o Saldo que Sobrar no Fim do Mês
  // -------------------------------------------------------------
  if (freeBalance > 100) {
    adviceList.push({
      id: 'end-of-month-routine',
      category: 'investment',
      level: 'good',
      title: '💡 Regra de Ouro do Dia do Pagamento',
      summary: 'Não deixe dinheiro sobrando parado na conta corrente.',
      detailedAdvice: 'O dinheiro parado na conta corrente sofre com a inflação e dá a falsa sensação de que você tem dinheiro livre para gastar por impulso.',
      suggestedAction: `No dia que você receber o próximo salário, pague imediatamente a Faculdade (R$ 1.035), separe a Linha (R$ 45), transfira R$ 200 para a Reserva e viva com o restante. Isso se chama "Pague-se primeiro".`,
      impactAmount: 200,
    });
  }

  return adviceList;
}
