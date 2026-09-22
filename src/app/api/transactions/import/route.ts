import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import { Transaction } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = body.transactions;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma transação enviada para importação.' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAsync();
    let importedCount = 0;
    let skippedCount = 0;
    const nowIso = new Date().toISOString();

    // Cria um conjunto de chaves para evitar duplicatas: YYYY-MM-DD + merchant + amount + type
    const existingSignatures = new Set<string>();
    for (const t of db.transactions) {
      const day = t.date ? t.date.slice(0, 10) : '';
      const sig = `${day}|${t.merchant.toLowerCase().trim()}|${Number(t.amount).toFixed(2)}|${t.type || 'expense'}`;
      existingSignatures.add(sig);
    }

    const newTransactions: Transaction[] = [];

    for (const item of rows) {
      const amount = Number(item.amount);
      if (!amount || amount <= 0 || !item.merchant) {
        continue;
      }

      const day = item.date ? item.date.slice(0, 10) : '';
      const sig = `${day}|${String(item.merchant).toLowerCase().trim()}|${amount.toFixed(2)}|${item.type || 'expense'}`;

      // Se for duplicata exata na mesma data e valor, pula (a menos que forceImport seja true)
      if (!body.allowDuplicates && existingSignatures.has(sig)) {
        skippedCount++;
        continue;
      }

      const newTx: Transaction = {
        id: 'tx_csv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        amount,
        type: item.type === 'income' ? 'income' : 'expense',
        merchant: String(item.merchant).trim(),
        rawMerchant: item.rawMerchant ? String(item.rawMerchant).trim() : String(item.merchant).trim(),
        category: item.category || 'Outros / Diversos',
        source: 'manual', // ou 'csv'
        paymentMethod: item.paymentMethod || 'Extrato Bancário (CSV)',
        date: item.date || nowIso,
        notes: item.notes || 'Importado via arquivo CSV',
        createdAt: nowIso,
      };

      existingSignatures.add(sig);
      newTransactions.push(newTx);
      importedCount++;
    }

    if (newTransactions.length > 0) {
      db.transactions = [...newTransactions, ...db.transactions];
      await saveDatabaseAsync(db);
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      totalDatabaseCount: db.transactions.length,
      importedTransactions: newTransactions,
    });
  } catch (err: any) {
    console.error('Erro na importação de CSV:', err);
    return NextResponse.json(
      { error: 'Erro ao processar importação de extrato CSV', details: err.message },
      { status: 500 }
    );
  }
}
