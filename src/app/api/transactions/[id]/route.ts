import { NextRequest, NextResponse } from 'next/server';
import { deleteTransaction, readDatabase, writeDatabase } from '@/lib/storage';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const removed = deleteTransaction(id);

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

    const db = readDatabase();
    const index = db.transactions.findIndex(t => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
    }

    db.transactions[index] = {
      ...db.transactions[index],
      ...updates,
      id, // garante imutabilidade do ID
    };

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      transaction: db.transactions[index],
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar transação', details: err.message }, { status: 500 });
  }
}
