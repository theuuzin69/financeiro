/**
 * Motor de Limpeza de Nomes e Categorização Inteligente
 * Especializado no mercado brasileiro (PIX, cartões e Apple Pay).
 */

export interface CategorizationResult {
  category: string;
  cleanMerchant: string;
  confidence: 'high' | 'medium' | 'low';
}

// Prefixos comuns de maquininhas e adquirentes no Brasil
const MERCHANT_PREFIXES = [
  /^PAG\*\s*/i,
  /^MP\*\s*/i,
  /^MERCADOPAGO\*\s*/i,
  /^PAGSEGURO\*\s*/i,
  /^CIELO\*\s*/i,
  /^REDE\*\s*/i,
  /^GETNET\*\s*/i,
  /^STONE\*\s*/i,
  /^SUMUP\*\s*/i,
  /^DL\*\s*/i,
  /^STRIPE\*\s*/i,
  /^IFD\*\s*/i,
  /^IFOOD\*\s*/i,
  /^UBR\*\s*/i,
  /^UBER\s*\*\s*/i,
  /^PG\*\s*/i,
  /^IOF\s*/i,
];

// Limpeza de sufixos de datas ou códigos de autorização
const MERCHANT_SUFFIXES = [
  /\s+em\s+\d{2}\/\d{2}.*$/i,
  /\s+as\s+\d{2}:\d{2}.*$/i,
  /\s*\d{2}\/\d{2}$/,
  /\s+em$/i,
  /\s*SAO PAULO BRA?$/i,
  /\s*RIO DE JANEI?$/i,
  /\s*CURITIBA BRA?$/i,
  /\s*BELO HORIZO?$/i,
  /\s*BRASILIA BRA?$/i,
  /\s*BR$/i,
  /\s*-\s*PARC\s*\d+\/\d+$/i,
];

export function cleanMerchantName(raw: string): string {
  if (!raw) return 'Estabelecimento Desconhecido';
  let clean = raw.trim();

  // Remove prefixos conhecidos
  for (const prefix of MERCHANT_PREFIXES) {
    clean = clean.replace(prefix, '');
  }

  // Remove sufixos conhecidos
  for (const suffix of MERCHANT_SUFFIXES) {
    clean = clean.replace(suffix, '');
  }

  // Capitalização legível (Title Case) se estiver tudo em maiúsculas
  if (clean === clean.toUpperCase() && clean.length > 3) {
    clean = clean
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length <= 2 && ['de', 'da', 'do', 'em', 'e'].includes(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  return clean.trim() || raw.trim();
}

interface CategoryRule {
  category: string;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Alimentação',
    keywords: [
      'ifood', 'rappi', 'aiqfome', 'delivery', 'restaurante', 'lanchonete',
      'padaria', 'panificadora', 'supermercado', 'mercado', 'hipermercado',
      'carrefour', 'pao de acucar', 'assai', 'atacadao', 'extra', 'muffato',
      'hortifruti', 'acougue', 'peixaria', 'bar', 'choperia', 'cervejaria',
      'mcdonalds', 'mc donalds', 'burger king', 'bk', 'subway', 'outback',
      'starbucks', 'cacau show', 'kopenhagen', 'bacio di latte', 'gelato',
      'sorveteria', 'pizza', 'pizzaria', 'hamburgueria', 'sushi', 'temakeria',
      'churrascaria', 'cafe', 'bistro', 'ze delivery', 'emporio', 'cantina'
    ],
  },
  {
    category: 'Transporte',
    keywords: [
      'uber', '99app', '99 pop', '99 taxi', 'taxi', 'posto', 'gasolina',
      'ipiranga', 'shell', 'petrobras', 'br distribuidora', 'combustivel',
      'abastecimento', 'etanol', 'sem parar', 'veloe', 'conectcar', 'pedagio',
      'estapar', 'estacionamento', 'rotativo', 'zona azul', 'metro', 'cptm',
      'bilhete unico', 'sptrans', 'onibus', 'tarifa transporte', 'aluguel carros',
      'localiza', 'movida', 'unidas', 'veiculos'
    ],
  },
  {
    category: 'Moradia & Contas',
    keywords: [
      'aluguel', 'condominio', 'quintoandar', 'loft', 'enel', 'eletropaulo',
      'sabesp', 'copasa', 'sanepar', 'cpfl', 'light', 'energisa', 'luz',
      'agua', 'gas', 'comgas', 'claro residencial', 'vivo fibra', 'tim live',
      'oi fibra', 'net servicos', 'internet', 'iptu', 'leroy merlin', 'c&c',
      'telhanorte', 'tok&stok', 'tok stok', 'madeiramadeira', 'etna', 'imobiliaria'
    ],
  },
  {
    category: 'Lazer & Entretenimento',
    keywords: [
      'netflix', 'spotify', 'amazon prime', 'prime video', 'disney+', 'disney plus',
      'hbo', 'max', 'globoplay', 'apple tv', 'cinema', 'cinemark', 'cinepolis',
      'uciplex', 'ingressocom', 'sympla', 'eventim', 'steam', 'playstation',
      'psn', 'xbox', 'microsoft game', 'nintendo', 'twitch', 'show', 'teatro',
      'balada', 'club', 'resort', 'hotel', 'pousada', 'airbnb', 'booking',
      'decolar', 'cvc', 'latam', 'gol', 'azul linhas'
    ],
  },
  {
    category: 'Saúde & Bem-estar',
    keywords: [
      'farmacia', 'drogaria', 'drogasil', 'droga raia', 'pague menos',
      'panvel', 'sao paulo', 'ultrafarma', 'hospital', 'clinica', 'laboratorio',
      'fleury', 'lavoisier', 'dasa', 'consulta', 'medico', 'dentista',
      'odonto', 'ortopedia', 'oftalmo', 'otica', 'gassi', 'chilli beans',
      'academia', 'smart fit', 'smartfit', 'bluefit', 'bodytech', 'totalpass',
      'gympass', 'wellhub', 'suplemento', 'growth', 'creatina', 'whey'
    ],
  },
  {
    category: 'Compras & Vestuário',
    keywords: [
      'mercado livre', 'mercadolivre', 'amazon', 'shopee', 'shein', 'aliexpress',
      'magalu', 'magazine luiza', 'casas bahia', 'ponto frio', 'fast shop',
      'zara', 'renner', 'riachuelo', 'c&a', 'centauro', 'nike', 'adidas',
      'decathlon', 'dafiti', 'arezzo', 'schutz', 'amaro', 'loja', 'shopping',
      'americanas', 'kalunga', 'aliexpress'
    ],
  },
  {
    category: 'Educação',
    keywords: [
      'faculdade', 'universidade', 'escola', 'colegio', 'curso', 'udemy',
      'coursera', 'alura', 'rocketseat', 'fiap', 'puc', 'fgv', 'estacio',
      'livraria', 'livro', 'saraiva', 'leitura', 'cultura', 'kindle',
      'idiomas', 'ingles', 'wizard', 'ccaa', 'cambly', 'duolingo'
    ],
  },
  {
    category: 'Serviços & Assinaturas',
    keywords: [
      'apple.com/bill', 'itunes', 'google storage', 'google one', 'google play',
      'icloud', 'microsoft 365', 'adobe', 'chatgpt', 'openai', 'midjourney',
      'notion', 'canva', 'barbearia', 'barbeiro', 'salao de beleza', 'manicure',
      'estetica', 'lavanderia', 'petshop', 'cobasi', 'petz', 'veterinario',
      'cartorio', 'despachante', 'seguro'
    ],
  },
];

// Mapeamento de categorias padrão da Apple (Apple Pay Wallet)
const APPLE_PAY_CATEGORY_MAP: Record<string, string> = {
  'food & drink': 'Alimentação',
  'restaurants': 'Alimentação',
  'groceries': 'Alimentação',
  'transportation': 'Transporte',
  'travel': 'Lazer & Entretenimento',
  'entertainment': 'Lazer & Entretenimento',
  'health': 'Saúde & Bem-estar',
  'medical': 'Saúde & Bem-estar',
  'shopping': 'Compras & Vestuário',
  'services': 'Serviços & Assinaturas',
  'education': 'Educação',
  'utilities': 'Moradia & Contas',
  'home': 'Moradia & Contas',
};

export function autoCategorize(
  merchantName: string,
  appleCategory?: string
): CategorizationResult {
  const clean = cleanMerchantName(merchantName);
  const normalizedMerchant = clean.toLowerCase();

  // 1. Prioridade: busca por regras de palavras-chave brasileiras
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (normalizedMerchant.includes(keyword)) {
        return {
          category: rule.category,
          cleanMerchant: clean,
          confidence: 'high',
        };
      }
    }
  }

  // 2. Se a Apple passou categoria no Apple Pay
  if (appleCategory) {
    const normApple = appleCategory.toLowerCase().trim();
    if (APPLE_PAY_CATEGORY_MAP[normApple]) {
      return {
        category: APPLE_PAY_CATEGORY_MAP[normApple],
        cleanMerchant: clean,
        confidence: 'medium',
      };
    }
    // Procura substring
    for (const [key, cat] of Object.entries(APPLE_PAY_CATEGORY_MAP)) {
      if (normApple.includes(key)) {
        return {
          category: cat,
          cleanMerchant: clean,
          confidence: 'medium',
        };
      }
    }
  }

  // 3. Padrão para não categorizado
  return {
    category: 'Outros / Diversos',
    cleanMerchant: clean,
    confidence: 'low',
  };
}
