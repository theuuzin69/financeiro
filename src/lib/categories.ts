import { CategoryInfo } from '@/types';

export const FIXED_EDUCATION_BUDGET = 1035.00;

// Pesos proporcionais do orçamento restante (Renda - 1035) para as demais categorias (soma = 100%)
export const REMAINING_BUDGET_WEIGHTS: Record<string, number> = {
  'Alimentação': 0.38,           // ~38% do saldo livre (~R$ 746,70 em R$ 3.000)
  'Transporte': 0.16,            // ~16% do saldo livre (~R$ 314,40 em R$ 3.000)
  'Saúde & Bem-estar': 0.12,     // ~12% do saldo livre (~R$ 235,80 em R$ 3.000)
  'Lazer & Entretenimento': 0.10, // ~10% do saldo livre (~R$ 196,50 em R$ 3.000)
  'Compras & Vestuário': 0.10,   // ~10% do saldo livre (~R$ 196,50 em R$ 3.000)
  'Serviços & Assinaturas': 0.06,// ~6% do saldo livre (~R$ 117,90 em R$ 3.000 - cobre plano celular R$ 45)
  'Moradia & Contas': 0.04,      // ~4% do saldo livre (~R$ 78,60 em R$ 3.000)
  'Outros / Diversos': 0.04,     // ~4% do saldo livre (~R$ 78,60 em R$ 3.000)
};

/**
 * Calcula os limites (tetos) de cada categoria com base na renda informada.
 * Regra: Educação possui teto fixo de R$ 1.035,00 (faculdade).
 * O restante da renda é distribuído proporcionalmente entre as outras categorias.
 */
export function calculateCategoryLimits(income: number = 3000): Record<string, number> {
  const safeIncome = Math.max(0, Number(income) || 0);
  const limits: Record<string, number> = {};

  // Educação é fixa em R$ 1.035,00
  limits['Educação'] = FIXED_EDUCATION_BUDGET;

  const remaining = Math.max(0, safeIncome - FIXED_EDUCATION_BUDGET);
  const categories = Object.keys(REMAINING_BUDGET_WEIGHTS);

  let allocated = 0;
  categories.forEach((catName, index) => {
    if (index === categories.length - 1) {
      // Ajuste de centavos na última categoria para fechamento contábil exato
      limits[catName] = Math.max(0, Math.round((remaining - allocated) * 100) / 100);
    } else {
      const weight = REMAINING_BUDGET_WEIGHTS[catName] || 0;
      const amount = Math.round(remaining * weight * 100) / 100;
      limits[catName] = amount;
      allocated += amount;
    }
  });

  return limits;
}

// Limites padrão calculados para a renda base de R$ 3.000,00
const BASE_LIMITS = calculateCategoryLimits(3000);

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  {
    id: 'alimentacao',
    name: 'Alimentação',
    color: '#EF4444', // red-500
    icon: 'Utensils',
    description: 'Supermercados, restaurantes, delivery, padarias e lanches',
    defaultBudget: BASE_LIMITS['Alimentação'] || 746.70,
  },
  {
    id: 'transporte',
    name: 'Transporte',
    color: '#3B82F6', // blue-500
    icon: 'Car',
    description: 'Uber, 99, combustível, pedágio, transporte público e estacionamento',
    defaultBudget: BASE_LIMITS['Transporte'] || 314.40,
  },
  {
    id: 'moradia',
    name: 'Moradia & Contas',
    color: '#F59E0B', // amber-500
    icon: 'Home',
    description: 'Aluguel, luz, água, condomínio, internet e gás',
    defaultBudget: BASE_LIMITS['Moradia & Contas'] || 78.60,
  },
  {
    id: 'lazer',
    name: 'Lazer & Entretenimento',
    color: '#8B5CF6', // purple-500
    icon: 'Film',
    description: 'Streaming, cinema, shows, jogos, viagens e saídas',
    defaultBudget: BASE_LIMITS['Lazer & Entretenimento'] || 196.50,
  },
  {
    id: 'saude',
    name: 'Saúde & Bem-estar',
    color: '#10B981', // emerald-500
    icon: 'HeartPulse',
    description: 'Farmácias, planos de saúde, médicos, academia e suplementos',
    defaultBudget: BASE_LIMITS['Saúde & Bem-estar'] || 235.80,
  },
  {
    id: 'compras',
    name: 'Compras & Vestuário',
    color: '#EC4899', // pink-500
    icon: 'ShoppingBag',
    description: 'Roupas, eletrônicos, casa, presentes e compras online',
    defaultBudget: BASE_LIMITS['Compras & Vestuário'] || 196.50,
  },
  {
    id: 'educacao',
    name: 'Educação',
    color: '#06B6D4', // cyan-500
    icon: 'GraduationCap',
    description: 'Cursos, faculdade, livros e certificações (Fixo R$ 1.035,00)',
    defaultBudget: FIXED_EDUCATION_BUDGET,
  },
  {
    id: 'servicos',
    name: 'Serviços & Assinaturas',
    color: '#6366F1', // indigo-500
    icon: 'Sparkles',
    description: 'Apple iCloud, Google One, barbearia, softwares e plano celular',
    defaultBudget: BASE_LIMITS['Serviços & Assinaturas'] || 117.90,
  },
  {
    id: 'outros',
    name: 'Outros / Diversos',
    color: '#6B7280', // gray-500
    icon: 'CircleEllipsis',
    description: 'Despesas não classificadas ou eventuais',
    defaultBudget: BASE_LIMITS['Outros / Diversos'] || 78.60,
  },
];

export function getCategoryByName(name: string): CategoryInfo {
  const found = DEFAULT_CATEGORIES.find(
    c => c.name.toLowerCase() === name.toLowerCase() || c.id === name.toLowerCase()
  );
  return found || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
}

