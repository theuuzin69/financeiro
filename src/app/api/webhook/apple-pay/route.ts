import { NextRequest, NextResponse } from 'next/server';
import { addTransactionAsync, getWebhookSecretAsync } from '@/lib/storage';
import { autoCategorize, cleanMerchantName } from '@/lib/categorizer';
import { parseBRLAmount } from '@/lib/bank-parsers';

/**
 * Webhook para Automação Pessoal da Carteira do iPhone (Apple Pay)
 * Suporta chaves em Inglês e Português enviadas pelo app Atalhos do iOS.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Apple Pay Webhook] Recebido do iPhone:', JSON.stringify(body));

    // Verificação de autenticação de segurança do atalho
    const expectedSecret = await getWebhookSecretAsync();
    const providedSecret = 
      body.secret || 
      body.senha ||
      req.headers.get('x-webhook-secret') || 
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Não autorizado. Token de segurança inválido.' },
        { status: 401 }
      );
    }

    // Normalização dos valores recebidos pelo atalho (suporte a chaves PT e EN)
    const rawAmount = 
      body.amount ?? 
      body.valor ?? 
      body.value ?? 
      body.preco ?? 
      body.quantia;

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

    // Suporte flexível para Comerciante / Estabelecimento
    const rawMerchantField = 
      body.merchant ?? 
      body.comerciante ?? 
      body.estabelecimento ?? 
      body.loja ?? 
      body.store ?? 
      body.nome ?? 
      body.name ?? 
      body.description ?? 
      body.descricao;

    let merchantCandidate = '';
    if (typeof rawMerchantField === 'string') {
      merchantCandidate = rawMerchantField.trim();
    } else if (rawMerchantField && typeof rawMerchantField === 'object') {
      merchantCandidate = rawMerchantField.name || rawMerchantField.comerciante || rawMerchantField.title || rawMerchantField.value || '';
    }

    // Suporte flexível para Categoria do iOS
    const rawCategoryField = 
      body.category ?? 
      body.categoria ?? 
      body.tipo ?? 
      body.setor;

    let categoryCandidate = '';
    if (typeof rawCategoryField === 'string') {
      categoryCandidate = rawCategoryField.trim();
    } else if (rawCategoryField && typeof rawCategoryField === 'object') {
      categoryCandidate = rawCategoryField.name || rawCategoryField.categoria || rawCategoryField.value || '';
    }

    // Suporte flexível para Cartão
    const rawCardField = 
      body.card ?? 
      body.cartao ?? 
      body.cartão ?? 
      body.cardName ?? 
      body.conta;

    const cardName = typeof rawCardField === 'string' && rawCardField.trim() && rawCardField.trim().toLowerCase() !== 'apple pay'
      ? rawCardField.trim() 
      : 'Carteira';

    // Se o comerciante for genérico ou vazio, tenta melhorar o nome com base na categoria
    let finalRawMerchant = merchantCandidate;
    if (!finalRawMerchant || finalRawMerchant.toLowerCase() === 'comerciante apple pay' || finalRawMerchant.toLowerCase() === 'apple pay') {
      if (categoryCandidate && categoryCandidate.toLowerCase() !== 'outros' && categoryCandidate.toLowerCase() !== 'diversos') {
        finalRawMerchant = `Apple Pay (${categoryCandidate})`;
      } else {
        finalRawMerchant = 'Apple Pay';
      }
    }

    // Categorização automática inteligente (com suporte completo a PT-BR)
    const catResult = autoCategorize(finalRawMerchant, categoryCandidate);

    // Data do lançamento
    const rawDateField = body.date ?? body.data ?? body.timestamp ?? body.dataHora;
    let txDate = new Date().toISOString();
    if (rawDateField) {
      try {
        const parsedD = new Date(rawDateField);
        if (!isNaN(parsedD.getTime())) {
          txDate = parsedD.toISOString();
        }
      } catch {}
    }

    // Gravação da transação na nuvem Upstash
    const transaction = await addTransactionAsync({
      amount,
      type: 'expense',
      merchant: catResult.cleanMerchant,
      rawMerchant: finalRawMerchant,
      category: catResult.category,
      source: 'apple_pay',
      paymentMethod: `Apple Pay (${cardName})`,
      date: txDate,
      notes: categoryCandidate ? `Categoria Apple Pay: ${categoryCandidate}` : undefined,
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
