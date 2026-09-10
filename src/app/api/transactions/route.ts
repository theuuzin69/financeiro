import { NextRequest, NextResponse } from 'next/server';
import { addTransactionAsync, getAllTransactionsAsync } from '@/lib/storage';
import { autoCategorize } from '@/lib/categorizer';
import { parseBRLAmount } from '@/lib/bank-parsers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const search = searchParams.get('search')?.toLowerCase();

    let transactions = await getAllTransactionsAsync();

    if (month) {
      transactions = transactions.filter(t => t.date.startsWith(month));
    }

    if (category && category !== 'all') {
      transactions = transactions.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    if (source && source !== 'all') {
      transactions = transactions.filter(t => t.source === source);
    }

    if (search) {
      transactions = transactions.filter(t => 
        t.merchant.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search) ||
        (t.notes && t.notes.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar transações', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const amount = typeof body.amount === 'number' ? Math.abs(body.amount) : parseBRLAmount(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor da despesa inválido.' }, { status: 400 });
    }

    const rawMerchant = body.merchant ? String(body.merchant).trim() : 'Estabelecimento';
    const catResult = autoCategorize(rawMerchant);
    const cleanMerchant = body.merchant ? String(body.merchant).trim() : catResult.cleanMerchant;

    const transaction = await addTransactionAsync({
      amount,
      type: body.type || 'expense',
      merchant: cleanMerchant,
      rawMerchant,
      category: body.category || catResult.category,
      source: body.source || 'manual',
      paymentMethod: body.paymentMethod || 'Manual',
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      notes: body.notes ? String(body.notes).trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Transação criada com sucesso!',
      transaction,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao criar transação', details: err.message }, { status: 500 });
  }
}
