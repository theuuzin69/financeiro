import { NextRequest, NextResponse } from 'next/server';
import { deleteTransactionAsync, updateTransactionAsync } from '@/lib/storage';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const removed = await deleteTransactionAsync(id);

    if (!removed) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Transação excluída com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao excluir transação', details: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const updated = await updateTransactionAsync(id, updates);

    if (!updated) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar transação', details: err.message }, { status: 500 });
  }
}
