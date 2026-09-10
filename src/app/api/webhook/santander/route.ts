import { NextRequest, NextResponse } from 'next/server';
import { addTransaction, getWebhookSecret } from '@/lib/storage';
import { parseSantanderMessage } from '@/lib/bank-parsers';
import { autoCategorize, cleanMerchantName } from '@/lib/categorizer';
import { parseBRLAmount } from '@/lib/bank-parsers';

/**
 * Webhook para Notificações, SMS e Mensagens do Santander (PIX e Cartão)
 *
 * Configuração no app Atalhos do iOS:
 * Gatilho: Automação Pessoal > Mensagem (Contém "Santander" ou "Pix" ou "Compra aprovada")
 * Ação: Obter Conteúdo de URL (POST)
 * URL: https://seu-app.vercel.app/api/webhook/santander
 * Corpo do JSON:
 * {
 *   "message": Atalho Entrada > Conteúdo do Atalho (ou Corpo da Mensagem),
 *   "secret": "iphone_secret_key_santander_2026"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verificação do token de segurança
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

    const messageText = body.message || body.text || body.content || '';

    // Caso já venham campos estruturados diretamente
    if (body.amount && (body.merchant || body.store)) {
      const amount = typeof body.amount === 'number' ? Math.abs(body.amount) : parseBRLAmount(body.amount);
      const rawMerchant = body.merchant || body.store;
      const catResult = autoCategorize(rawMerchant);
      const isPix = Boolean(body.isPix || String(body.paymentMethod).toLowerCase().includes('pix'));

      const transaction = addTransaction({
        amount,
        type: 'expense',
        merchant: catResult.cleanMerchant,
        rawMerchant,
        category: body.category || catResult.category,
        source: isPix ? 'santander_pix' : 'santander_card',
        paymentMethod: body.paymentMethod || (isPix ? 'Santander PIX' : 'Cartão Santander'),
        cardLastDigits: body.cardLastDigits,
        date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
        notes: body.notes || (messageText ? `Origem SMS: ${messageText}` : undefined),
      });

      return NextResponse.json({
        success: true,
        message: 'Transação Santander registrada com sucesso!',
        transaction,
      });
    }

    // Se veio texto livre de SMS/Notificação do Santander
    if (!messageText) {
      return NextResponse.json(
        { error: 'Nenhum texto de mensagem ou dados de compra fornecidos.' },
        { status: 400 }
      );
    }

    const parsed = parseSantanderMessage(messageText);

    if (!parsed || parsed.amount <= 0) {
      return NextResponse.json(
        { 
          error: 'Não foi possível identificar o valor ou destinatário na mensagem.',
          receivedMessage: messageText 
        },
        { status: 422 }
      );
    }

    const transaction = addTransaction({
      amount: parsed.amount,
      type: 'expense',
      merchant: parsed.merchant,
      rawMerchant: parsed.rawText,
      category: parsed.category,
      source: parsed.source,
      paymentMethod: parsed.paymentMethod,
      cardLastDigits: parsed.cardLastDigits,
      date: parsed.date,
      notes: `Processado via automação Santander (${parsed.confidence === 'high' ? 'Alta precisão' : 'Detecção estimada'})`,
    });

    return NextResponse.json({
      success: true,
      message: `Transação Santander (${parsed.source === 'santander_pix' ? 'PIX' : 'Cartão'}) processada e categorizada como ${parsed.category}!`,
      transaction,
      parsed,
    });
  } catch (error: any) {
    console.error('Erro no webhook Santander:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar transação Santander', details: error?.message },
      { status: 500 }
    );
  }
}
