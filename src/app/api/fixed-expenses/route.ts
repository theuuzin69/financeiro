import { NextRequest, NextResponse } from 'next/server';
import { addFixedExpenseAsync, getFixedExpensesAsync } from '@/lib/storage';
import { parseBRLAmount } from '@/lib/bank-parsers';

export async function GET() {
  try {
    const list = await getFixedExpensesAsync();
    return NextResponse.json({ success: true, fixedExpenses: list });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar gastos fixos', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const amount = typeof body.amount === 'number' ? Math.abs(body.amount) : parseBRLAmount(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor do gasto fixo inválido.' }, { status: 400 });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Nome do gasto fixo é obrigatório.' }, { status: 400 });
    }

    const created = await addFixedExpenseAsync({
      name: body.name.trim(),
      amount,
      category: body.category || 'Outros / Diversos',
      dueDay: body.dueDay ? parseInt(body.dueDay, 10) : undefined,
      description: body.description,
      active: body.active !== undefined ? Boolean(body.active) : true,
    });

    return NextResponse.json({ success: true, fixedExpense: created });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao criar gasto fixo', details: err.message }, { status: 500 });
  }
}
