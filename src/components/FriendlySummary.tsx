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
import { formatBRL } from '@/lib/formatters';

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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            Dinheiro Livre Restante no Mês
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isDeficit 
                ? 'text-rose-600 dark:text-rose-400' 
                : isTight 
                ? 'text-amber-600 dark:text-amber-300' 
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {formatBRL(freeBalance)}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5">
            {isDeficit ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Gastos ultrapassaram a renda deste mês
              </span>
            ) : (
              <span>
                Você pode gastar até <strong className="text-slate-900 dark:text-white font-bold">{formatBRL(safeDaily)}/dia</strong> nos próximos {daysRemaining} dias
              </span>
            )}
          </p>

          {nextSalaryPayment && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Próximo pagamento ({nextSalaryPayment.label}): <strong className="font-bold">{formatBRL(nextSalaryPayment.amount)}</strong> {nextSalaryPayment.isToday ? '• Cai hoje! 🎉' : `• em ${nextSalaryPayment.daysRemaining} ${nextSalaryPayment.daysRemaining === 1 ? 'dia' : 'dias'}`}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onEditIncome}
          className="text-xs font-semibold text-emerald-800 dark:text-zinc-200 hover:text-emerald-900 dark:hover:text-white bg-emerald-50 hover:bg-emerald-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-zinc-700/60 flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          title="Configurar datas e valores do salário"
        >
          <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-zinc-400" />
          <span>Salário: {formatBRL(income)} {salaryConfig?.frequency === 'split' ? '(2x)' : ''}</span>
        </button>
      </div>

      {/* Barra de Progresso */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400 font-semibold">
          <span>{spentPct}% da renda total comprometida</span>
          <span>{formatBRL(totalSpent)} de {formatBRL(totalGrossIncome)}</span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden flex border border-slate-200/50 dark:border-transparent">
          {/* Gastos Fixos (Azul suave) */}
          <div
            style={{ width: `${Math.min(100, (fixedTotal / totalGrossIncome) * 100)}%` }}
            className="bg-sky-500 h-full transition-all duration-500"
            title={`Gastos Fixos: ${formatBRL(fixedTotal)}`}
          />
          {/* Gastos Variáveis (Laranja ou Vermelho) */}
          <div
            style={{ width: `${Math.min(100 - (fixedTotal / totalGrossIncome) * 100, (variableTotal / totalGrossIncome) * 100)}%` }}
            className={`h-full transition-all duration-500 ${isDeficit ? 'bg-rose-500' : 'bg-amber-400'}`}
            title={`Gastos Variáveis: ${formatBRL(variableTotal)}`}
          />
        </div>
      </div>

      {/* 3 Cartões Didáticos Harmônicos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* 1. Salário + Renda Extra */}
        <div className="bg-emerald-50/70 dark:bg-zinc-900/70 border border-emerald-100 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">1. Renda Total</span>
          <span className="text-base font-black text-emerald-900 dark:text-emerald-300 mt-1">
            + {formatBRL(totalGrossIncome)}
          </span>
          <span className="text-xs text-emerald-700/80 dark:text-zinc-400 mt-1 font-medium leading-tight">
            {salaryConfig?.frequency === 'split' && salaryConfig.payments.length >= 2
              ? `Em 2x: Dias ${salaryConfig.payments[0].day} e ${salaryConfig.payments[1].day}`
              : extraIncome > 0 ? `Salário + ${formatBRL(extraIncome)} extras` : 'Salário líquido'}
          </span>
        </div>

        {/* 2. Gastos Fixos */}
        <div className="bg-sky-50/70 dark:bg-zinc-900/70 border border-sky-100 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">2. Gastos Fixos</span>
          <span className="text-base font-black text-sky-900 dark:text-sky-300 mt-1">
            - {formatBRL(fixedTotal)}
          </span>
          <span className="text-xs text-sky-700/80 dark:text-zinc-400 mt-1 font-medium leading-tight">
            Faculdade, linha, etc.
          </span>
        </div>

        {/* 3. Gastos Variáveis */}
        <div className="bg-amber-50/70 dark:bg-zinc-900/70 border border-amber-100 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-xs">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">3. Variáveis</span>
          <span className="text-base font-black text-amber-900 dark:text-amber-300 mt-1">
            - {formatBRL(variableTotal)}
          </span>
          <span className="text-xs text-amber-700/80 dark:text-zinc-400 mt-1 font-medium leading-tight">
            Cartão, Pix, dia a dia
          </span>
        </div>
      </div>

      {/* Botão de explicação didática */}
      <div className="pt-1">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-1.5 font-medium transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <span>Como interpretar esses números?</span>
          {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showExplanation && (
          <div className="mt-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 space-y-2.5 animate-fadeIn leading-relaxed">
            <p>
              • <strong>Renda Total ({formatBRL(totalGrossIncome)}):</strong> Seu salário de {formatBRL(income)}{salaryConfig?.frequency === 'split' && salaryConfig.payments.length >= 2 ? ` pago em 2 vezes (dias ${salaryConfig.payments[0].day} e ${salaryConfig.payments[1].day})` : ''}{extraIncome > 0 ? ` somado a ${formatBRL(extraIncome)} de rendas extras neste mês` : ''}.
            </p>
            <p>
              • <strong>Gastos Fixos ({formatBRL(fixedTotal)}):</strong> Contas obrigatórias todo mês que você não pode deixar de pagar (como faculdade e mensalidades).
            </p>
            <p>
              • <strong>Gastos do Dia a Dia ({formatBRL(variableTotal)}):</strong> Compras no mercado, lanches, Uber, farmácia, etc.
            </p>
            <p>
              • <strong>Saldo Livre ({formatBRL(freeBalance)}):</strong> É o que resta de verdade na sua carteira. Dividindo pelos {daysRemaining} dias restantes, você pode gastar <strong>{formatBRL(safeDaily)} por dia</strong> com tranquilidade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
