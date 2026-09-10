import { NextRequest, NextResponse } from 'next/server';
import { getBudgetForMonth, updateBudget } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const budget = getBudgetForMonth(month);
    return NextResponse.json({ success: true, budget });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar orçamentos', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const month = body.month || new Date().toISOString().slice(0, 7);

    const updated = updateBudget(month, {
      totalLimit: body.totalLimit,
      categoryLimits: body.categoryLimits,
    });

    return NextResponse.json({ success: true, budget: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar orçamento', details: err.message }, { status: 500 });
  }
}
