import { NextRequest, NextResponse } from 'next/server';
import { addTransaction } from '@/lib/storage';
import { autoCategorize } from '@/lib/categorizer';
import { parseSantanderMessage } from '@/lib/bank-parsers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type; // 'apple_pay' | 'santander_pix' | 'santander_card'

    if (type === 'apple_pay') {
      const merchant = body.merchant || 'Starbucks Coffee';
      const amount = body.amount || 24.50;
      const catResult = autoCategorize(merchant, 'Food & Drink');

      const tx = addTransaction({
        amount,
        type: 'expense',
        merchant: catResult.cleanMerchant,
        rawMerchant: merchant,
        category: catResult.category,
        source: 'apple_pay',
        paymentMethod: 'Apple Pay (Mastercard)',
        date: new Date().toISOString(),
        notes: 'Simulação de teste Apple Pay',
      });

      return NextResponse.json({ success: true, transaction: tx });
    }

    if (type === 'santander_pix') {
      const sampleMsg = body.message || 'Santander: Pix enviado de R$ 68,00 para Restaurante Tempero Baiano em 10/09.';
      const parsed = parseSantanderMessage(sampleMsg);
      if (!parsed) {
        return NextResponse.json({ error: 'Falha ao processar simulação PIX' }, { status: 400 });
      }

      const tx = addTransaction({
        amount: parsed.amount,
        type: 'expense',
        merchant: parsed.merchant,
        rawMerchant: parsed.rawText,
        category: parsed.category,
        source: 'santander_pix',
        paymentMethod: 'Santander PIX',
        date: parsed.date,
        notes: 'Simulação de teste Santander PIX',
      });

      return NextResponse.json({ success: true, transaction: tx });
    }

    if (type === 'santander_card') {
      const sampleMsg = body.message || 'Santander Informa: Compra aprovada no cartao final 7821 de R$ 139,90 em POSTO IPIRANGA em 10/09.';
      const parsed = parseSantanderMessage(sampleMsg);
      if (!parsed) {
        return NextResponse.json({ error: 'Falha ao processar simulação Cartão' }, { status: 400 });
      }

      const tx = addTransaction({
        amount: parsed.amount,
        type: 'expense',
        merchant: parsed.merchant,
        rawMerchant: parsed.rawText,
        category: parsed.category,
        source: 'santander_card',
        paymentMethod: parsed.paymentMethod,
        cardLastDigits: parsed.cardLastDigits,
        date: parsed.date,
        notes: 'Simulação de teste Santander Cartão',
      });

      return NextResponse.json({ success: true, transaction: tx });
    }

    return NextResponse.json({ error: 'Tipo de simulação desconhecido' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao simular webhook', details: err.message }, { status: 500 });
  }
}
