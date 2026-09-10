import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Sparkles, Check, ArrowRight } from 'lucide-react';
import { SalaryConfig, SalaryPayment } from '@/types';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncome: number;
  salaryConfig?: SalaryConfig;
  onSuccess: () => void;
}

export function IncomeModal({
  isOpen,
  onClose,
  currentIncome,
  salaryConfig,
  onSuccess,
}: IncomeModalProps) {
  const [frequency, setFrequency] = useState<'split' | 'single'>(
    salaryConfig?.frequency || 'split'
  );

  // Parcela 1 (ex: Dia 5)
  const [day1, setDay1] = useState<number>(5);
  const [amount1, setAmount1] = useState<string>('1500');
  const [label1, setLabel1] = useState<string>('Salário');

  // Parcela 2 (ex: Dia 20)
  const [day2, setDay2] = useState<number>(20);
  const [amount2, setAmount2] = useState<string>('1500');
  const [label2, setLabel2] = useState<string>('Adiantamento');

  // Caso seja pagamento único (1x)
  const [singleDay, setSingleDay] = useState<number>(5);
  const [singleAmount, setSingleAmount] = useState<string>(String(currentIncome || 3000));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza dados quando o modal abre ou salaryConfig muda
  useEffect(() => {
    if (salaryConfig && salaryConfig.payments && salaryConfig.payments.length > 0) {
      setFrequency(salaryConfig.frequency || (salaryConfig.payments.length >= 2 ? 'split' : 'single'));
      
      if (salaryConfig.payments.length >= 2) {
        setDay1(salaryConfig.payments[0].day);
        setAmount1(String(salaryConfig.payments[0].amount));
        setLabel1(salaryConfig.payments[0].label || 'Salário');

        setDay2(salaryConfig.payments[1].day);
        setAmount2(String(salaryConfig.payments[1].amount));
        setLabel2(salaryConfig.payments[1].label || 'Adiantamento');
      } else if (salaryConfig.payments.length === 1) {
        setSingleDay(salaryConfig.payments[0].day);
        setSingleAmount(String(salaryConfig.payments[0].amount));
      }
    } else {
      // Padrão do usuário: R$ 3000 em 2 dias (dia 5 e dia 20)
      const half = Math.round(((currentIncome || 3000) / 2) * 100) / 100;
      setFrequency('split');
      setDay1(5);
      setAmount1(String(half));
      setLabel1('Salário');
      setDay2(20);
      setAmount2(String(currentIncome ? currentIncome - half : half));
      setLabel2('Adiantamento');
      setSingleDay(5);
      setSingleAmount(String(currentIncome || 3000));
    }
  }, [isOpen, salaryConfig, currentIncome]);

  if (!isOpen) return null;

  // Cálculo do total em tempo real
  const parsedAmount1 = parseFloat(amount1.replace(',', '.')) || 0;
  const parsedAmount2 = parseFloat(amount2.replace(',', '.')) || 0;
  const parsedSingleAmount = parseFloat(singleAmount.replace(',', '.')) || 0;

  const totalCalculated = frequency === 'split'
    ? parsedAmount1 + parsedAmount2
    : parsedSingleAmount;

  const handleSplitEvenly = () => {
    const total = parsedAmount1 + parsedAmount2 || (currentIncome || 3000);
    const half = Math.round((total / 2) * 100) / 100;
    setAmount1(String(half));
    setAmount2(String(Math.round((total - half) * 100) / 100));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let paymentsPayload: SalaryPayment[] = [];

      if (frequency === 'split') {
        if (parsedAmount1 <= 0 || parsedAmount2 <= 0) {
          setError('Os valores de ambas as parcelas devem ser maiores que zero.');
          setLoading(false);
          return;
        }
        paymentsPayload = [
          { day: day1, amount: parsedAmount1, label: label1.trim() || 'Salário' },
          { day: day2, amount: parsedAmount2, label: label2.trim() || 'Adiantamento' },
        ];
      } else {
        if (parsedSingleAmount <= 0) {
          setError('O valor do salário deve ser maior que zero.');
          setLoading(false);
          return;
        }
        paymentsPayload = [
          { day: singleDay, amount: parsedSingleAmount, label: 'Salário' },
        ];
      }

      const payload: SalaryConfig = {
        frequency,
        totalAmount: totalCalculated,
        payments: paymentsPayload,
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salaryConfig: payload, monthlyIncome: totalCalculated }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar salário');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro de comunicação ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-700/80 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 transition-colors max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Configurar Salário & Recebimento
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Personalize dias e valores de pagamento do seu salário
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Seletor de Frequência (2x ou 1x) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setFrequency('split')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                frequency === 'split'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Em 2 Dias (Dia 5 e Dia 20)
            </button>
            <button
              type="button"
              onClick={() => setFrequency('single')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                frequency === 'single'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1 Parcela Única
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {frequency === 'split' ? (
            <div className="space-y-3">
              {/* Parcela 1 */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[11px] font-black">
                      1
                    </span>
                    1º Pagamento do Mês
                  </span>
                  <input
                    type="text"
                    value={label1}
                    onChange={e => setLabel1(e.target.value)}
                    placeholder="Ex: Salário"
                    className="w-28 text-right bg-transparent text-xs text-slate-500 dark:text-zinc-400 focus:outline-none focus:text-slate-900 dark:focus:text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                      Dia do Mês
                    </label>
                    <select
                      value={day1}
                      onChange={e => setDay1(parseInt(e.target.value, 10))}
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>
                          Todo dia {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                      Valor (R$)
                    </label>
                    <input
                      type="text"
                      required
                      value={amount1}
                      onChange={e => setAmount1(e.target.value)}
                      placeholder="1500,00"
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Parcela 2 */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    2º Pagamento do Mês
                  </span>
                  <input
                    type="text"
                    value={label2}
                    onChange={e => setLabel2(e.target.value)}
                    placeholder="Ex: Adiantamento"
                    className="w-28 text-right bg-transparent text-xs text-slate-500 dark:text-zinc-400 focus:outline-none focus:text-slate-900 dark:focus:text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                      Dia do Mês
                    </label>
                    <select
                      value={day2}
                      onChange={e => setDay2(parseInt(e.target.value, 10))}
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>
                          Todo dia {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                      Valor (R$)
                    </label>
                    <input
                      type="text"
                      required
                      value={amount2}
                      onChange={e => setAmount2(e.target.value)}
                      placeholder="1500,00"
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSplitEvenly}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                >
                  Dividir total igualmente (50% / 50%)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                    Dia do Pagamento
                  </label>
                  <select
                    value={singleDay}
                    onChange={e => setSingleDay(parseInt(e.target.value, 10))}
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>
                        Todo dia {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                    Valor Mensal (R$)
                  </label>
                  <input
                    type="text"
                    required
                    value={singleAmount}
                    onChange={e => setSingleAmount(e.target.value)}
                    placeholder="3000,00"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Destaque do Total Mensal */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Total Mensal Líquido
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                {frequency === 'split' ? 'Soma das duas parcelas' : 'Renda base do mês'}
              </span>
            </div>
            <span className="text-xl font-black text-emerald-900 dark:text-emerald-300">
              R$ {totalCalculated.toFixed(2)}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            Você pode alterar essa configuração a qualquer momento caso mude de emprego, receba reajuste ou altere os dias de pagamento.
          </p>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold border border-slate-200 dark:border-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Salvar Configuração
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
