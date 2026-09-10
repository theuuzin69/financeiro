import { NextRequest, NextResponse } from 'next/server';
import { 
  getDatabaseAsync, 
  saveDatabaseAsync, 
  isCloudStorageConfigured 
} from '@/lib/storage';
import { Transaction } from '@/types';

export async function GET() {
  const cloudConnected = isCloudStorageConfigured();
  return NextResponse.json({
    success: true,
    cloudConnected,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDatabaseAsync();
    let addedCount = 0;

    // 1. Sincronização e Restauração de Transações
    if (Array.isArray(body.transactions) && body.transactions.length > 0) {
      const existingIds = new Set(db.transactions.map(t => t.id));
      
      for (const rawTx of body.transactions) {
        if (rawTx && rawTx.id && !existingIds.has(rawTx.id)) {
          // Filtra transações teste antigas caso existam no backup local
          if (!String(rawTx.id).startsWith('seed_') && !String(rawTx.id).startsWith('tx_seed_')) {
            db.transactions.push(rawTx as Transaction);
            existingIds.add(rawTx.id);
            addedCount++;
          }
        }
      }
    }

    // 2. Sincronização de Configuração Salarial
    if (body.salaryConfig && body.salaryConfig.payments) {
      db.salaryConfig = body.salaryConfig;
      db.monthlyIncome = body.salaryConfig.totalAmount;
    }

    if (addedCount > 0 || body.salaryConfig) {
      await saveDatabaseAsync(db);
    }

    return NextResponse.json({
      success: true,
      addedCount,
      totalTransactions: db.transactions.length,
      cloudConnected: isCloudStorageConfigured(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao sincronizar dados', details: err.message }, { status: 500 });
  }
}
