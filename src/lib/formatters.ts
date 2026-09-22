/**
 * Utilitários de Formatação Profissional Bancária Brasileira (BRL)
 */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const brlCompactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

/**
 * Formata um valor numérico para padrão monetário brasileiro: R$ 1.500,00
 */
export function formatBRL(amount: number, options?: { hideSymbol?: boolean; compact?: boolean }): string {
  const safe = Number(amount) || 0;
  if (options?.compact) {
    return brlCompactFormatter.format(safe);
  }
  const formatted = brlFormatter.format(safe);
  if (options?.hideSymbol) {
    return formatted.replace(/^R\$\s*/, '');
  }
  return formatted;
}

/**
 * Formata data ISO para exibição amigável e legível: "22 de set às 11:27"
 */
export function formatDateReadable(isoString: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = monthNames[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');

    return `${day} de ${month} às ${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

/**
 * Formata data ISO para formato curto: "22/09/2026"
 */
export function formatShortDate(isoString: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

/**
 * Formata porcentagem: 45%
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
