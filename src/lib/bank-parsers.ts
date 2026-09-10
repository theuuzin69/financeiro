import { autoCategorize, cleanMerchantName } from './categorizer';
import { TransactionSource } from '@/types';

export interface ParsedBankTransaction {
  amount: number;
  merchant: string;
  category: string;
  source: TransactionSource;
  paymentMethod: string;
  cardLastDigits?: string;
  date: string;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Normaliza valores em reais (ex: "R$ 1.250,50", "45,90", "R$ 30.00") para number
 */
export function parseBRLAmount(rawAmount: string): number {
  if (!rawAmount) return 0;
  // Remove "R$", "R", espaços
  let cleaned = rawAmount.replace(/R\$\s*/i, '').trim();

  // Se tiver ponto como milhar e vírgula como decimal (ex: 1.250,50)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Ex: 45,90 -> 45.90
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Parser para mensagens e SMS do Santander
 */
export function parseSantanderMessage(message: string): ParsedBankTransaction | null {
  if (!message || typeof message !== 'string') return null;

  const normalized = message.trim();
  const nowIso = new Date().toISOString();

  // 1. Padrão: Santander PIX Enviado
  // Ex: "Santander: Pix enviado de R$ 50,00 para Joao Silva em 10/09."
  // Ex: "Santander Informa: Pix enviado no valor de R$ 150,00 para Padaria Central"
  const pixRegex = /(?:pix\s+enviado|transferencia\s+pix|pix\s+realizado)(?:.*?)(?:de|valor\s+de)?\s*(?:R\$\s*)?([\d.,]+)\s+para\s+([^.,;\n]+)/i;
  const pixMatch = normalized.match(pixRegex);

  if (pixMatch) {
    const rawAmount = pixMatch[1];
    const rawDestinatario = pixMatch[2].trim();
    const amount = parseBRLAmount(rawAmount);
    const merchant = cleanMerchantName(rawDestinatario);
    const catResult = autoCategorize(merchant);

    return {
      amount,
      merchant: catResult.cleanMerchant,
      category: catResult.category,
      source: 'santander_pix',
      paymentMethod: 'Santander PIX',
      date: nowIso,
      rawText: message,
      confidence: 'high',
    };
  }

  // 2. Padrão: Compra aprovada no Cartão Santander
  // Ex: "Santander Informa: Compra aprovada no cartao final 1234 de R$ 45,90 em RESTAURANTE XYZ em 10/09"
  // Ex: "Santander: Compra aprovada cartao final 4321 de R$ 120,50 em IFOOD"
  // Ex: "Santander: Compra de R$ 89,90 aprovada no cartao final 5544 em DROGASIL"
  const cardRegex1 = /compra\s+aprovada.*?(?:cartao|final)\s*(?:final\s*)?(\d{4})?.*?(?:de|valor)?\s*(?:R\$\s*)?([\d.,]+)\s+em\s+([^.,;\n]+)/i;
  const cardRegex2 = /compra\s+(?:de\s*)?(?:R\$\s*)?([\d.,]+)\s+aprovada.*?(?:cartao|final)?\s*(?:final\s*)?(\d{4})?\s+em\s+([^.,;\n]+)/i;

  let cardMatch = normalized.match(cardRegex1);
  let cardDigits: string | undefined;
  let rawAmount = '';
  let rawMerchant = '';

  if (cardMatch) {
    cardDigits = cardMatch[1];
    rawAmount = cardMatch[2];
    rawMerchant = cardMatch[3];
  } else {
    cardMatch = normalized.match(cardRegex2);
    if (cardMatch) {
      rawAmount = cardMatch[1];
      cardDigits = cardMatch[2];
      rawMerchant = cardMatch[3];
    }
  }

  if (cardMatch && rawAmount && rawMerchant) {
    const amount = parseBRLAmount(rawAmount);
    // Limpeza de tokens de data no fim do merchant se houver (ex: "em 10/09")
    const cleanRawMerchant = rawMerchant.replace(/\s+em\s+\d{2}\/\d{2}.*$/i, '').trim();
    const catResult = autoCategorize(cleanRawMerchant);

    return {
      amount,
      merchant: catResult.cleanMerchant,
      category: catResult.category,
      source: 'santander_card',
      paymentMethod: cardDigits ? `Cartão Santander final ${cardDigits}` : 'Cartão Santander',
      cardLastDigits: cardDigits,
      date: nowIso,
      rawText: message,
      confidence: 'high',
    };
  }

  // 3. Fallback Genérico para mensagens bancárias
  // Tenta achar qualquer padrão "R$ XX,XX em NOME" ou "R$ XX,XX para NOME"
  const genericRegex = /(?:R\$\s*)?([\d.,]+)\s+(?:em|para|no|na)\s+([^.,;\n]+)/i;
  const genericMatch = normalized.match(genericRegex);

  if (genericMatch) {
    const amount = parseBRLAmount(genericMatch[1]);
    if (amount > 0) {
      const merchant = cleanMerchantName(genericMatch[2].trim());
      const catResult = autoCategorize(merchant);

      return {
        amount,
        merchant: catResult.cleanMerchant,
        category: catResult.category,
        source: normalized.toLowerCase().includes('pix') ? 'santander_pix' : 'santander_card',
        paymentMethod: normalized.toLowerCase().includes('pix') ? 'Santander PIX' : 'Santander',
        date: nowIso,
        rawText: message,
        confidence: 'medium',
      };
    }
  }

  return null;
}
