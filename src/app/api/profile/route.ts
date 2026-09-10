import { NextRequest, NextResponse } from 'next/server';
import { 
  getMonthlyIncomeAsync, 
  setMonthlyIncomeAsync, 
  getSalaryConfigAsync, 
  setSalaryConfigAsync 
} from '@/lib/storage';
import { parseBRLAmount } from '@/lib/bank-parsers';
import { SalaryConfig, SalaryPayment } from '@/types';

export async function GET() {
  try {
    const [income, salaryConfig] = await Promise.all([
      getMonthlyIncomeAsync(),
      getSalaryConfigAsync(),
    ]);
    return NextResponse.json({ 
      success: true, 
      monthlyIncome: income,
      salaryConfig,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar perfil', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Se foi enviado salaryConfig completo
    if (body.salaryConfig) {
      const raw = body.salaryConfig;
      const frequency = raw.frequency === 'single' ? 'single' : 'split';
      const payments: SalaryPayment[] = [];

      if (Array.isArray(raw.payments)) {
        for (const p of raw.payments) {
          const day = Math.min(31, Math.max(1, parseInt(String(p.day), 10) || 5));
          const amount = typeof p.amount === 'number' 
            ? Math.abs(p.amount) 
            : parseBRLAmount(String(p.amount));
          
          if (amount > 0) {
            payments.push({
              day,
              amount,
              label: p.label ? String(p.label).trim() : undefined,
            });
          }
        }
      }

      if (payments.length === 0) {
        return NextResponse.json({ error: 'Ao menos uma parcela de salário válida deve ser informada.' }, { status: 400 });
      }

      const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
      const savedConfig = await setSalaryConfigAsync({
        frequency,
        totalAmount,
        payments,
      });

      return NextResponse.json({ 
        success: true, 
        monthlyIncome: savedConfig.totalAmount, 
        salaryConfig: savedConfig 
      });
    }

    // 2. Se foi enviado apenas monthlyIncome tradicional
    const income = typeof body.monthlyIncome === 'number' 
      ? Math.abs(body.monthlyIncome) 
      : parseBRLAmount(body.monthlyIncome);

    if (!income || income <= 0) {
      return NextResponse.json({ error: 'Valor de renda mensal inválido.' }, { status: 400 });
    }

    await setMonthlyIncomeAsync(income);
    const updatedConfig = await getSalaryConfigAsync();

    return NextResponse.json({ 
      success: true, 
      monthlyIncome: income, 
      salaryConfig: updatedConfig 
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar dados salariais', details: err.message }, { status: 500 });
  }
}
