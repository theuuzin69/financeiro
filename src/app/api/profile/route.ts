import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyIncome, setMonthlyIncome } from '@/lib/storage';
import { parseBRLAmount } from '@/lib/bank-parsers';

export async function GET() {
  try {
    const income = getMonthlyIncome();
    return NextResponse.json({ success: true, monthlyIncome: income });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar perfil', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const income = typeof body.monthlyIncome === 'number' 
      ? Math.abs(body.monthlyIncome) 
      : parseBRLAmount(body.monthlyIncome);

    if (!income || income <= 0) {
      return NextResponse.json({ error: 'Valor de renda mensal inválido.' }, { status: 400 });
    }

    setMonthlyIncome(income);
    return NextResponse.json({ success: true, monthlyIncome: income });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar renda mensal', details: err.message }, { status: 500 });
  }
}
