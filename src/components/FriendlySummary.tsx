import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Calendar
} from 'lucide-react';
import { SalaryConfig } from '@/types';

interface FriendlySummaryProps {
  income: number;
  extraIncome?: number;
  fixedTotal: number;
  variableTotal: number;
  freeBalance: number;
  safeDaily: number;
  daysRemaining: number;
  salaryConfig?: SalaryConfig;
  nextSalaryPayment?: {
    day: number;
    amount: number;
    daysRemaining: number;
    isToday: boolean;
    isNextMonth?: boolean;
    label: string;
  };
  onEditIncome: () => void;
}

export function FriendlySummary({
  income,
  extraIncome = 0,
  fixedTotal,
  variableTotal,
  freeBalance,
  safeDaily,
  daysRemaining,
  salaryConfig,
  nextSalaryPayment,
  onEditIncome,
}: FriendlySummaryProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const totalGrossIncome = income + extraIncome;
  const isHealthy = freeBalance > 0 && safeDaily >= 25;
  const isTight = freeBalance > 0 && safeDaily < 25;
  const isDeficit = freeBalance <= 0;

  const totalSpent = fixedTotal + variableTotal;
  const spentPct = totalGrossIncome > 0 ? Math.min(100, Math.round((totalSpent / totalGrossIncome) * 100)) : 0;

  return (
    <div className="bg-white dark:bg-[#121216] border border-slate-200/90 dark:border-zinc-800/90 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-5 transition-colors">
      {/* Topo do Card: Saldo Livre em Destaque */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Dinheiro Livre Restante no Mês
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isDeficit 
                ? 'text-rose-600 dark:text-rose-400' 
                : isTight 
                ? 'text-amber-600 dark:text-amber-300' 
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              R$ {freeBalance.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {isDeficit ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Gastos ultrapassaram a renda deste mês
              </span>
            ) : (
              <span>
                Você pode gastar até <strong className="text-slate-900 dark:text-white font-bold">R$ {safeDaily.toFixed(2)}/dia</strong> nos próximos {daysRemaining} dias
              </span>
            )}
          </p>

          {nextSalaryPayment && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Próximo pagamento ({nextSalaryPayment.label}): <strong className="font-bold">R$ {nextSalaryPayment.amount.toFixed(2)}</strong> {nextSalaryPayment.isToday ? '• Cai hoje! 🎉' : `• em ${nextSalaryPayment.daysRemaining} ${nextSalaryPayment.daysRemaining === 1 ? 'dia' : 'dias'}`}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onEditIncome}
          className="text-[11px] font-semibold text-emerald-800 dark:text-zinc-300 hover:text-emerald-900 dark:hover:text-white bg-emerald-50 hover:bg-emerald-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-zinc-700/60 flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          title="Configurar datas e valores do salário"
        >
          <Edit2 className="w-3 h-3 text-emerald-600 dark:text-zinc-400" />
          Salário: R$ {income.toFixed(0)} {salaryConfig?.frequency === 'split' ? '(2x)' : ''}
        </button>
      </div>

      {/* Barra de Progresso */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400 font-medium">
          <span>{spentPct}% da renda total comprometida</span>
          <span>R$ {totalSpent.toFixed(2)} de R$ {totalGrossIncome.toFixed(2)}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden flex border border-slate-200/50 dark:border-transparent">
          {/* Gastos Fixos (Azul suave) */}
          <div
            style={{ width: `${Math.min(100, (fixedTotal / totalGrossIncome) * 100)}%` }}
            className="bg-sky-500 h-full transition-all duration-500"
            title={`Gastos Fixos: R$ ${fixedTotal.toFixed(2)}`}
          />
          {/* Gastos Variáveis (Laranja ou Vermelho) */}
          <div
            style={{ width: `${Math.min(100 - (fixedTotal / totalGrossIncome) * 100, (variableTotal / totalGrossIncome) * 100)}%` }}
            className={`h-full transition-all duration-500 ${isDeficit ? 'bg-rose-500' : 'bg-amber-400'}`}
            title={`Gastos Variáveis: R$ ${variableTotal.toFixed(2)}`}
          />
        </div>
      </div>

      {/* 3 Cartões Didáticos Harmônicos */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
        {/* 1. Salário + Renda Extra */}
        <div className="bg-emerald-50/60 dark:bg-zinc-900/60 border border-emerald-100 dark:border-zinc-800/60 p-3 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">1. Renda Total</span>
          <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 mt-1">
            + R$ {totalGrossIncome.toFixed(0)}
          </span>
          <span className="text-[9px] text-emerald-700/80 dark:text-zinc-500 mt-0.5 font-medium leading-tight">
            {salaryConfig?.frequency === 'split' && salaryConfig.payments.length >= 2
              ? `Em 2x: Dias ${salaryConfig.payments[0].day} e ${salaryConfig.payments[1].day}`
              : extraIncome > 0 ? `Salário + R$ ${extraIncome.toFixed(0)}` : 'Salário líquido'}
          </span>
        </div>

        {/* 2. Gastos Fixos */}
        <div className="bg-sky-50/60 dark:bg-zinc-900/60 border border-sky-100 dark:border-zinc-800/60 p-3 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-tight">2. Fixos</span>
          <span className="text-xs sm:text-sm font-black text-sky-800 dark:text-sky-300 mt-1">
            - R$ {fixedTotal.toFixed(2)}
          </span>
          <span className="text-[9px] text-sky-700/80 dark:text-zinc-500 mt-0.5 font-medium">Faculdade, linha...</span>
        </div>

        {/* 3. Gastos Variáveis */}
        <div className="bg-amber-50/60 dark:bg-zinc-900/60 border border-amber-100 dark:border-zinc-800/60 p-3 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">3. Variáveis</span>
          <span className="text-xs sm:text-sm font-black text-amber-800 dark:text-amber-300 mt-1">
            - R$ {variableTotal.toFixed(2)}
          </span>
          <span className="text-[9px] text-amber-700/80 dark:text-zinc-500 mt-0.5 font-medium">Cartão, Pix, compras</span>
        </div>
      </div>

      {/* Botão de explicação didática */}
      <div className="pt-1">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          <span>Como interpretar esses números?</span>
          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showExplanation && (
          <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 space-y-2 animate-fadeIn leading-relaxed">
            <p>
              • <strong>Renda Total (R$ {totalGrossIncome.toFixed(0)}):</strong> Seu salário de R$ {income.toFixed(0)}{salaryConfig?.frequency === 'split' && salaryConfig.payments.length >= 2 ? ` pago em 2 vezes (dias ${salaryConfig.payments[0].day} e ${salaryConfig.payments[1].day})` : ''}{extraIncome > 0 ? ` somado a R$ ${extraIncome.toFixed(2)} de rendas extras neste mês` : ''}.
            </p>
            <p>
              • <strong>Gastos Fixos (R$ {fixedTotal.toFixed(2)}):</strong> Contas obrigatórias todo mês que você não pode deixar de pagar (Faculdade de R$ 1.035 e Linha de R$ 45).
            </p>
            <p>
              • <strong>Gastos do Dia a Dia (R$ {variableTotal.toFixed(2)}):</strong> Compras no mercado, lanches, Uber, farmácia, etc.
            </p>
            <p>
              • <strong>Saldo Livre (R$ {freeBalance.toFixed(2)}):</strong> É o que resta de verdade na sua carteira. Dividindo pelos {daysRemaining} dias restantes, você pode gastar <strong>R$ {safeDaily.toFixed(2)} por dia</strong> com tranquilidade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
