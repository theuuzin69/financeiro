import { CategoryInfo } from '@/types';

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  {
    id: 'alimentacao',
    name: 'Alimentação',
    color: '#EF4444', // red-500
    icon: 'Utensils',
    description: 'Supermercados, restaurantes, delivery, padarias e lanches',
    defaultBudget: 1500,
  },
  {
    id: 'transporte',
    name: 'Transporte',
    color: '#3B82F6', // blue-500
    icon: 'Car',
    description: 'Uber, 99, combustível, pedágio, transporte público e estacionamento',
    defaultBudget: 600,
  },
  {
    id: 'moradia',
    name: 'Moradia & Contas',
    color: '#F59E0B', // amber-500
    icon: 'Home',
    description: 'Aluguel, luz, água, condomínio, internet e gás',
    defaultBudget: 2000,
  },
  {
    id: 'lazer',
    name: 'Lazer & Entretenimento',
    color: '#8B5CF6', // purple-500
    icon: 'Film',
    description: 'Streaming, cinema, shows, jogos, viagens e saídas',
    defaultBudget: 500,
  },
  {
    id: 'saude',
    name: 'Saúde & Bem-estar',
    color: '#10B981', // emerald-500
    icon: 'HeartPulse',
    description: 'Farmácias, planos de saúde, médicos, academia e suplementos',
    defaultBudget: 400,
  },
  {
    id: 'compras',
    name: 'Compras & Vestuário',
    color: '#EC4899', // pink-500
    icon: 'ShoppingBag',
    description: 'Roupas, eletrônicos, casa, presentes e compras online',
    defaultBudget: 600,
  },
  {
    id: 'educacao',
    name: 'Educação',
    color: '#06B6D4', // cyan-500
    icon: 'GraduationCap',
    description: 'Cursos, faculdade, livros e certificações',
    defaultBudget: 300,
  },
  {
    id: 'servicos',
    name: 'Serviços & Assinaturas',
    color: '#6366F1', // indigo-500
    icon: 'Sparkles',
    description: 'Apple iCloud, Google One, barbearia, softwares e taxas',
    defaultBudget: 250,
  },
  {
    id: 'outros',
    name: 'Outros / Diversos',
    color: '#6B7280', // gray-500
    icon: 'CircleEllipsis',
    description: 'Despesas não classificadas ou eventuais',
    defaultBudget: 200,
  },
];

export function getCategoryByName(name: string): CategoryInfo {
  const found = DEFAULT_CATEGORIES.find(
    c => c.name.toLowerCase() === name.toLowerCase() || c.id === name.toLowerCase()
  );
  return found || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
}
