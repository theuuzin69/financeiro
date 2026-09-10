import { NextRequest, NextResponse } from 'next/server';
import { deleteFixedExpenseAsync, updateFixedExpense } from '@/lib/storage';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await deleteFixedExpenseAsync(id);

    if (!ok) {
      return NextResponse.json({ error: 'Gasto fixo não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Gasto fixo removido com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao deletar gasto fixo', details: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const updated = updateFixedExpense(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Gasto fixo não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, fixedExpense: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar gasto fixo', details: err.message }, { status: 500 });
  }
}
