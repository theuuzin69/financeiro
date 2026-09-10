import { NextRequest, NextResponse } from 'next/server';
import { addTransaction, getWebhookSecret } from '@/lib/storage';
import { autoCategorize, cleanMerchantName } from '@/lib/categorizer';
import { parseBRLAmount } from '@/lib/bank-parsers';

/**
 * Webhook para Automação Pessoal da Carteira do iPhone (Apple Pay)
 *
 * Configuração no app Atalhos do iOS:
 * Gatilho: Automação Pessoal > Transação (Qualquer cartão ou cartão específico)
 * Ação: Obter Conteúdo de URL (POST)
 * URL: https://seu-app.vercel.app/api/webhook/apple-pay
 * Cabeçalhos: Content-Type: application/json
 * Corpo do JSON:
 * {
 *   "amount": Atalho Entrada > Valor,
 *   "merchant": Atalho Entrada > Comerciante,
 *   "category": Atalho Entrada > Categoria,
 *   "card": Atalho Entrada > Cartão,
 *   "secret": "iphone_secret_key_santander_2026"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verificação de autenticação de segurança do atalho
    const expectedSecret = getWebhookSecret();
    const providedSecret = 
      body.secret || 
      req.headers.get('x-webhook-secret') || 
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Não autorizado. Token de segurança inválido.' },
        { status: 401 }
      );
    }

    // Normalização dos valores recebidos pelo atalho
    let rawAmount = body.amount;
    let amount = 0;
    if (typeof rawAmount === 'number') {
      amount = Math.abs(rawAmount);
    } else if (typeof rawAmount === 'string') {
      amount = parseBRLAmount(rawAmount);
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor da transação inválido ou ausente.', received: body },
        { status: 400 }
      );
    }

    const rawMerchant = body.merchant || body.store || 'Comerciante Apple Pay';
    const appleCategory = body.category || '';
    const cardName = body.card || 'Apple Pay';

    // Categorização automática inteligente
    const catResult = autoCategorize(rawMerchant, appleCategory);

    // Gravação da transação
    const transaction = addTransaction({
      amount,
      type: 'expense',
      merchant: catResult.cleanMerchant,
      rawMerchant,
      category: catResult.category,
      source: 'apple_pay',
      paymentMethod: `Apple Pay (${cardName})`,
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      notes: appleCategory ? `Categoria Apple Pay: ${appleCategory}` : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Transação Apple Pay registrada com sucesso!',
      transaction,
    });
  } catch (error: any) {
    console.error('Erro no webhook Apple Pay:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar transação Apple Pay', details: error?.message },
      { status: 500 }
    );
  }
}
