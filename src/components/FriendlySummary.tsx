import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowDownCircle, 
  ShoppingBag, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Edit2
} from 'lucide-react';

interface FriendlySummaryProps {
  income: number;
  extraIncome?: number;
  fixedTotal: number;
  variableTotal: number;
  freeBalance: number;
  safeDaily: number;
  daysRemaining: number;
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
    <div className="bg-[#141419] border border-zinc-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Topo do Card: Saldo Livre em Destaque Tranquilizador */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Dinheiro Livre Restante no Mês
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isDeficit ? 'text-rose-400' : isTight ? 'text-amber-300' : 'text-emerald-400'
            }`}>
              R$ {freeBalance.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {isDeficit ? (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Gastos ultrapassaram a renda deste mês
              </span>
            ) : (
              <span>
                Você pode gastar até <strong className="text-white font-bold">R$ {safeDaily.toFixed(2)}/dia</strong> nos próximos {daysRemaining} dias
              </span>
            )}
          </p>
        </div>

        <button
          onClick={onEditIncome}
          className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-700 px-3 py-1.5 rounded-xl border border-zinc-700/60 flex items-center gap-1 transition-all"
          title="Ajustar seu salário fixo"
        >
          <Edit2 className="w-3 h-3" />
          Salário: R$ {income.toFixed(0)}
        </button>
      </div>

      {/* Barra de Progresso Simples e Limpa */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-zinc-400 font-medium">
          <span>{spentPct}% da renda total comprometida</span>
          <span>R$ {totalSpent.toFixed(2)} de R$ {totalGrossIncome.toFixed(2)}</span>
        </div>
        <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden flex">
          {/* Gastos Fixos (Azul suave) */}
          <div
            style={{ width: `${Math.min(100, (fixedTotal / totalGrossIncome) * 100)}%` }}
            className="bg-sky-500 h-full"
            title={`Gastos Fixos: R$ ${fixedTotal.toFixed(2)}`}
          />
          {/* Gastos Variáveis (Laranja ou Vermelho) */}
          <div
            style={{ width: `${Math.min(100 - (fixedTotal / totalGrossIncome) * 100, (variableTotal / totalGrossIncome) * 100)}%` }}
            className={`h-full ${isDeficit ? 'bg-rose-500' : 'bg-amber-400'}`}
            title={`Gastos Variáveis: R$ ${variableTotal.toFixed(2)}`}
          />
        </div>
      </div>

      {/* Como chegamos nesse valor (Cálculo em 3 cartões simples) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
        {/* 1. Salário + Renda Extra */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 p-3 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-emerald-400 uppercase">1. Renda Total</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-300 mt-1">
            + R$ {totalGrossIncome.toFixed(0)}
          </span>
          <span className="text-[9px] text-zinc-500 mt-0.5">
            {extraIncome > 0 ? `Salário + R$ ${extraIncome.toFixed(0)} extra` : 'Salário líquido'}
          </span>
        </div>

        {/* 2. Gastos Fixos */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 p-3 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-sky-400 uppercase">2. Fixos</span>
          <span className="text-xs sm:text-sm font-bold text-sky-300 mt-1">
            - R$ {fixedTotal.toFixed(2)}
          </span>
          <span className="text-[9px] text-zinc-500 mt-0.5">Faculdade, linha...</span>
        </div>

        {/* 3. Gastos Variáveis */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 p-3 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-amber-400 uppercase">3. Variáveis</span>
          <span className="text-xs sm:text-sm font-bold text-amber-300 mt-1">
            - R$ {variableTotal.toFixed(2)}
          </span>
          <span className="text-[9px] text-zinc-500 mt-0.5">Cartão, Pix, compras</span>
        </div>
      </div>

      {/* Botão de explicação didática para leigos */}
      <div className="pt-1">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
          <span>Como interpretar esses números?</span>
          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showExplanation && (
          <div className="mt-2.5 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-2 animate-fadeIn leading-relaxed">
            <p>
              • <strong>Renda Total (R$ {totalGrossIncome.toFixed(0)}):</strong> Seu salário de R$ {income.toFixed(0)}{extraIncome > 0 ? ` somado a R$ ${extraIncome.toFixed(2)} de rendas extras neste mês` : ''}.
            </p>
            <p>
              • <strong>Gastos Fixos (R$ {fixedTotal.toFixed(2)}):</strong> Contas obrigatórias todo mês que você não pode deixar de pagar (sua Faculdade de R$ 1.035 e Linha de R$ 45).
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
