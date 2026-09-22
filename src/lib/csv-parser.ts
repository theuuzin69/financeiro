import { autoCategorize } from './categorizer';
import { parseBRLAmount } from './bank-parsers';
import { Transaction } from '@/types';

export interface ParsedCsvRow {
  index: number;
  date: string; // ISO
  formattedDate: string; // DD/MM/YYYY
  merchant: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  paymentMethod: string;
  notes?: string;
  isValid: boolean;
  error?: string;
}

export interface CsvParseResult {
  success: boolean;
  transactions: ParsedCsvRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  totalExpense: number;
  totalIncome: number;
  detectedDelimiter: string;
  headers: string[];
  error?: string;
}

/**
 * Detecta o delimitador do CSV (, ou ; ou \t)
 */
function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (semicolons > commas && semicolons > tabs) return ';';
  if (tabs > commas && tabs > semicolons) return '\t';
  return ',';
}

/**
 * Divide uma linha CSV respeitando aspas
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        // Aspas escapadas
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Converte datas brasileiras (DD/MM/AAAA ou DD-MM-AAAA) ou internacionais (AAAA-MM-DD) para ISO
 */
function normalizeDate(rawDate: string): { iso: string; formatted: string } | null {
  if (!rawDate) return null;
  const clean = rawDate.trim().replace(/^"/, '').replace(/"$/, '');

  // Formato DD/MM/AAAA ou DD-MM-AAAA ou DD.MM.AAAA
  const brMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1; // 0-indexed
    let year = parseInt(brMatch[3], 10);
    if (year < 100) year += 2000;

    const hours = brMatch[4] ? parseInt(brMatch[4], 10) : 12;
    const mins = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
    const secs = brMatch[6] ? parseInt(brMatch[6], 10) : 0;

    const d = new Date(Date.UTC(year, month, day, hours, mins, secs));
    if (!isNaN(d.getTime())) {
      const formatted = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      return { iso: d.toISOString(), formatted };
    }
  }

  // Formato AAAA-MM-DD ou AAAA/MM/DD
  const isoMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);

    const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
    if (!isNaN(d.getTime())) {
      const formatted = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      return { iso: d.toISOString(), formatted };
    }
  }

  // Tenta parse genérico
  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return { iso: d.toISOString(), formatted: `${day}/${month}/${year}` };
    }
  } catch {}

  return null;
}

/**
 * Converte valor em string para número com detecção de sinal
 */
function normalizeAmount(raw: string): { amount: number; isNegative: boolean } {
  if (!raw) return { amount: 0, isNegative: false };
  let str = raw.trim();

  // Detecção de valores contábeis entre parênteses: (50,00) -> negativo
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('-') || str.includes(' -') || str.endsWith('-')) {
    isNegative = true;
    str = str.replace(/-/g, '').trim();
  } else if (str.startsWith('+')) {
    str = str.replace(/\+/g, '').trim();
  }

  const num = parseBRLAmount(str);
  return { amount: Math.abs(num), isNegative };
}

/**
 * Analisador principal de extrato bancário em CSV
 */
export function parseBankCSV(csvContent: string): CsvParseResult {
  if (!csvContent || typeof csvContent !== 'string') {
    return {
      success: false,
      transactions: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      totalExpense: 0,
      totalIncome: 0,
      detectedDelimiter: ',',
      headers: [],
      error: 'O arquivo CSV está vazio.',
    };
  }

  // Remove BOM do UTF-8 se presente
  const cleanContent = csvContent.replace(/^\uFEFF/, '').trim();
  const rawLines = cleanContent.split(/\r?\n/).filter(l => l.trim().length > 0);

  if (rawLines.length === 0) {
    return {
      success: false,
      transactions: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      totalExpense: 0,
      totalIncome: 0,
      detectedDelimiter: ',',
      headers: [],
      error: 'Nenhuma linha legível encontrada no arquivo.',
    };
  }

  const delimiter = detectDelimiter(rawLines[0]);
  const headerTokens = parseCsvLine(rawLines[0], delimiter).map(h => h.toLowerCase().trim());

  // Mapeamento flexível de índices de colunas
  let dateIdx = -1;
  let merchantIdx = -1;
  let amountIdx = -1;
  let categoryIdx = -1;
  let typeIdx = -1;
  let paymentMethodIdx = -1;

  for (let i = 0; i < headerTokens.length; i++) {
    const h = headerTokens[i];

    // Coluna de Data
    if (dateIdx === -1 && (h.includes('data') || h.includes('date') || h === 'dt' || h === 'dia' || h === 'data do lançamento')) {
      dateIdx = i;
      continue;
    }

    // Coluna de Estabelecimento / Descrição / Histórico
    if (merchantIdx === -1 && (
      h.includes('descri') || 
      h.includes('estabelec') || 
      h.includes('histor') || 
      h.includes('comerc') || 
      h.includes('favorec') || 
      h.includes('memo') || 
      h.includes('merchant') || 
      h.includes('título') ||
      h.includes('titulo') ||
      h === 'nome'
    )) {
      merchantIdx = i;
      continue;
    }

    // Coluna de Valor
    if (amountIdx === -1 && (h.includes('valor') || h.includes('amount') || h.includes('quantia') || h.includes('preco') || h.includes('preço') || h === 'val')) {
      amountIdx = i;
      continue;
    }

    // Coluna de Categoria
    if (categoryIdx === -1 && (h.includes('categor') || h.includes('setor') || h.includes('rubrica'))) {
      categoryIdx = i;
      continue;
    }

    // Coluna de Tipo (Débito/Crédito, Despesa/Receita)
    if (typeIdx === -1 && (h === 'tipo' || h === 'type' || h.includes('natureza') || h === 'd/c' || h === 'operacao')) {
      typeIdx = i;
      continue;
    }

    // Coluna de Cartão / Meio de Pagamento
    if (paymentMethodIdx === -1 && (h.includes('cart') || h.includes('meio') || h.includes('forma') || h.includes('conta'))) {
      paymentMethodIdx = i;
      continue;
    }
  }

  // Se não achou por cabeçalho, assume índices padrão se houver ao menos 3 colunas: Data(0), Descrição(1), Valor(2)
  if (dateIdx === -1 || merchantIdx === -1 || amountIdx === -1) {
    if (headerTokens.length >= 3) {
      dateIdx = 0;
      merchantIdx = 1;
      amountIdx = 2;
    } else {
      return {
        success: false,
        transactions: [],
        totalRows: rawLines.length - 1,
        validRows: 0,
        invalidRows: rawLines.length - 1,
        totalExpense: 0,
        totalIncome: 0,
        detectedDelimiter: delimiter,
        headers: headerTokens,
        error: 'Não foi possível identificar as colunas obrigatórias (Data, Descrição/Estabelecimento e Valor) no cabeçalho.',
      };
    }
  }

  const transactions: ParsedCsvRow[] = [];
  let totalExpense = 0;
  let totalIncome = 0;

  // Processa as linhas de dados (ignora cabeçalho na linha 0)
  for (let r = 1; r < rawLines.length; r++) {
    const rawLine = rawLines[r].trim();
    if (!rawLine) continue;

    const cols = parseCsvLine(rawLine, delimiter);
    const rawDate = cols[dateIdx] || '';
    const rawMerchant = cols[merchantIdx] || '';
    const rawAmountStr = cols[amountIdx] || '';
    const rawCategory = categoryIdx !== -1 ? cols[categoryIdx] : '';
    const rawType = typeIdx !== -1 ? cols[typeIdx] : '';
    const rawMethod = paymentMethodIdx !== -1 ? cols[paymentMethodIdx] : '';

    const parsedDate = normalizeDate(rawDate);
    const { amount, isNegative } = normalizeAmount(rawAmountStr);

    let isValid = true;
    let error: string | undefined;

    if (!parsedDate) {
      isValid = false;
      error = 'Data inválida ou não reconhecida.';
    } else if (amount <= 0) {
      isValid = false;
      error = 'Valor zerado ou inválido.';
    } else if (!rawMerchant) {
      isValid = false;
      error = 'Nome do estabelecimento ausente.';
    }

    // Determina se é despesa ou receita
    let type: 'expense' | 'income' = 'expense';
    const typeLower = rawType.toLowerCase();

    if (
      typeLower.includes('credito') || 
      typeLower.includes('crédito') || 
      typeLower.includes('receita') || 
      typeLower.includes('entrada') || 
      typeLower === 'c'
    ) {
      type = 'income';
    } else if (
      typeLower.includes('debito') || 
      typeLower.includes('débito') || 
      typeLower.includes('despesa') || 
      typeLower.includes('saida') || 
      typeLower === 'd'
    ) {
      type = 'expense';
    } else if (isNegative) {
      // Padrão bancário: valor negativo = despesa debitada
      type = 'expense';
    } else {
      // Se não tem sinal e nem coluna explícita, a maioria das linhas de extrato são despesas
      type = 'expense';
    }

    // Categorização automática
    let finalCategory = rawCategory.trim();
    if (!finalCategory || finalCategory.toLowerCase() === 'outros' || finalCategory.toLowerCase() === 'diversos') {
      const catResult = autoCategorize(rawMerchant);
      finalCategory = catResult.category;
    }

    if (isValid) {
      if (type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    }

    transactions.push({
      index: r,
      date: parsedDate?.iso || new Date().toISOString(),
      formattedDate: parsedDate?.formatted || rawDate,
      merchant: rawMerchant,
      amount,
      type,
      category: finalCategory,
      paymentMethod: rawMethod.trim() || 'Extrato Bancário (CSV)',
      notes: `Importado de extrato CSV (Linha ${r})`,
      isValid,
      error,
    });
  }

  const validRows = transactions.filter(t => t.isValid).length;
  const invalidRows = transactions.length - validRows;

  return {
    success: validRows > 0,
    transactions,
    totalRows: transactions.length,
    validRows,
    invalidRows,
    totalExpense,
    totalIncome,
    detectedDelimiter: delimiter,
    headers: headerTokens,
  };
}

/**
 * Gera um modelo CSV de exemplo para download ou cópia
 */
export function getSampleCsvTemplate(): string {
  return [
    'Data,Estabelecimento,Valor,Categoria,Tipo',
    '22/09/2026,Supermercado Pao de Acucar,185.50,Alimentação,despesa',
    '21/09/2026,Posto Shell Combustivel,120.00,Transporte,despesa',
    '20/09/2026,Drogasil Medicamentos,45.90,Saúde & Bem-estar,despesa',
    '20/09/2026,Restaurante Outback,140.00,Alimentação,despesa',
    '15/09/2026,Pix Recebido de Freelance,350.00,Renda Extra,receita',
  ].join('\n');
}
