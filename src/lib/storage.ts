import fs from 'fs';
import path from 'path';
import { BudgetGoal, FixedExpense, Transaction } from '@/types';
import { DEFAULT_CATEGORIES } from './categories';

export interface DatabaseSchema {
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  monthlyIncome: number;
  budgets: Record<string, BudgetGoal>; // key: YYYY-MM
  webhookSecret: string;
}

// Configurações de Nuvem (Vercel KV / Upstash Redis / Supabase)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_KEY = 'finance_pro_database';

// No ambiente Vercel Serverless, process.cwd() é somente leitura.
// Usamos /tmp no servidor ou a pasta local durante o desenvolvimento.
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'finance-data.json');
const DEFAULT_SECRET = 'iphone_secret_key_santander_2026';

// Cache em memória para desempenho ultra-rápido
let memoryCache: DatabaseSchema | null = null;

function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // Silencia em ambientes serverless restritos
  }
}

function getDefaultFixedExpenses(): FixedExpense[] {
  return [
    {
      id: 'fix_1',
      name: 'Faculdade',
      amount: 1035.00,
      category: 'Educação',
      dueDay: 10,
      description: 'Mensalidade da faculdade',
      active: true,
    },
    {
      id: 'fix_2',
      name: 'Linha Telefônica',
      amount: 45.00,
      category: 'Serviços & Assinaturas',
      dueDay: 15,
      description: 'Plano de celular mensal',
      active: true,
    },
  ];
}

function getInitialBudgets(): Record<string, BudgetGoal> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const categoryLimits: Record<string, number> = {};
  let totalLimit = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    categoryLimits[cat.name] = cat.defaultBudget;
    totalLimit += cat.defaultBudget;
  }

  return {
    [currentMonth]: {
      month: currentMonth,
      totalLimit: 3000,
      categoryLimits,
    },
  };
}

function getSeedTransactions(): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return [
    {
      id: 'tx_seed_1',
      amount: 85.50,
      type: 'expense',
      merchant: 'Supermercado Pão de Açúcar',
      rawMerchant: 'PAG*PAO DE ACUCAR',
      category: 'Alimentação',
      source: 'apple_pay',
      paymentMethod: 'Apple Pay (Mastercard)',
      date: `${year}-${month}-02T16:30:00.000Z`,
      createdAt: `${year}-${month}-02T16:30:00.000Z`,
    },
    {
      id: 'tx_seed_2',
      amount: 24.90,
      type: 'expense',
      merchant: 'Uber',
      rawMerchant: 'UBER *TRIP BR',
      category: 'Transporte',
      source: 'apple_pay',
      paymentMethod: 'Apple Pay (Visa)',
      date: `${year}-${month}-03T08:45:00.000Z`,
      createdAt: `${year}-${month}-03T08:45:00.000Z`,
    },
    {
      id: 'tx_seed_3',
      amount: 42.00,
      type: 'expense',
      merchant: 'Padaria Dona Benta',
      rawMerchant: 'PADARIA DONA BENTA PIX',
      category: 'Alimentação',
      source: 'santander_pix',
      paymentMethod: 'Santander PIX',
      date: `${year}-${month}-05T09:15:00.000Z`,
      createdAt: `${year}-${month}-05T09:15:00.000Z`,
    },
    {
      id: 'tx_seed_4',
      amount: 54.90,
      type: 'expense',
      merchant: 'iFood Lanche',
      rawMerchant: 'IFOOD *LANCHES',
      category: 'Alimentação',
      source: 'apple_pay',
      paymentMethod: 'Apple Pay (Mastercard)',
      date: `${year}-${month}-07T20:10:00.000Z`,
      createdAt: `${year}-${month}-07T20:10:00.000Z`,
    },
    {
      id: 'tx_seed_5',
      amount: 62.30,
      type: 'expense',
      merchant: 'Drogaria Raia',
      rawMerchant: 'DROGA RAIA 451',
      category: 'Saúde & Bem-estar',
      source: 'santander_card',
      paymentMethod: 'Cartão Santander final 7821',
      cardLastDigits: '7821',
      date: `${year}-${month}-08T14:20:00.000Z`,
      createdAt: `${year}-${month}-08T14:20:00.000Z`,
    },
  ];
}

function getDefaultDatabase(): DatabaseSchema {
  return {
    transactions: getSeedTransactions(),
    fixedExpenses: getDefaultFixedExpenses(),
    monthlyIncome: 3000.00,
    budgets: getInitialBudgets(),
    webhookSecret: DEFAULT_SECRET,
  };
}

/**
 * Lê o banco de dados da Nuvem (KV/Redis) ou arquivo sincronizado
 */
export function readDatabase(): DatabaseSchema {
  if (memoryCache) {
    return memoryCache;
  }

  ensureDataDirectory();

  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryCache = {
        transactions: parsed.transactions || [],
        fixedExpenses: parsed.fixedExpenses || getDefaultFixedExpenses(),
        monthlyIncome: parsed.monthlyIncome ?? 3000.00,
        budgets: parsed.budgets || getInitialBudgets(),
        webhookSecret: parsed.webhookSecret || DEFAULT_SECRET,
      };
      return memoryCache;
    } catch (err) {
      console.error('Erro lendo banco local, usando padrão:', err);
    }
  }

  const initial = getDefaultDatabase();
  writeDatabase(initial);
  memoryCache = initial;
  return initial;
}

/**
 * Grava dados com suporte a Nuvem e persistência automática
 */
export function writeDatabase(data: DatabaseSchema): void {
  memoryCache = data;
  ensureDataDirectory();

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Aviso ao escrever em disco:', err);
  }

  // Se o usuário conectou a Nuvem (Vercel KV ou Upstash Redis), sincroniza em background
  if (KV_URL && KV_TOKEN) {
    fetch(`${KV_URL}/set/${KV_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch(e => console.error('Erro ao sincronizar com Vercel KV:', e));
  }
}

// Funções de Transações
export function getAllTransactions(): Transaction[] {
  const db = readDatabase();
  return db.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const db = readDatabase();
  const newTx: Transaction = {
    ...tx,
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  db.transactions.unshift(newTx);
  writeDatabase(db);
  return newTx;
}

export function deleteTransaction(id: string): boolean {
  const db = readDatabase();
  const initialCount = db.transactions.length;
  db.transactions = db.transactions.filter(t => t.id !== id);
  if (db.transactions.length !== initialCount) {
    writeDatabase(db);
    return true;
  }
  return false;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
  const db = readDatabase();
  const index = db.transactions.findIndex(t => t.id === id);
  if (index === -1) return null;

  db.transactions[index] = {
    ...db.transactions[index],
    ...updates,
    id, // protege ID
  };
  writeDatabase(db);
  return db.transactions[index];
}

// Funções de Gastos Fixos
export function getFixedExpenses(): FixedExpense[] {
  const db = readDatabase();
  return db.fixedExpenses || getDefaultFixedExpenses();
}

export function addFixedExpense(expense: Omit<FixedExpense, 'id'>): FixedExpense {
  const db = readDatabase();
  const newFixed: FixedExpense = {
    ...expense,
    id: 'fix_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
  };

  if (!db.fixedExpenses) db.fixedExpenses = [];
  db.fixedExpenses.push(newFixed);
  writeDatabase(db);
  return newFixed;
}

export function updateFixedExpense(id: string, updates: Partial<FixedExpense>): FixedExpense | null {
  const db = readDatabase();
  if (!db.fixedExpenses) return null;
  const index = db.fixedExpenses.findIndex(f => f.id === id);
  if (index === -1) return null;

  db.fixedExpenses[index] = {
    ...db.fixedExpenses[index],
    ...updates,
    id,
  };
  writeDatabase(db);
  return db.fixedExpenses[index];
}

export function deleteFixedExpense(id: string): boolean {
  const db = readDatabase();
  if (!db.fixedExpenses) return false;
  const initial = db.fixedExpenses.length;
  db.fixedExpenses = db.fixedExpenses.filter(f => f.id !== id);
  if (db.fixedExpenses.length !== initial) {
    writeDatabase(db);
    return true;
  }
  return false;
}

// Renda Mensal
export function getMonthlyIncome(): number {
  const db = readDatabase();
  return db.monthlyIncome ?? 3000.00;
}

export function setMonthlyIncome(income: number): void {
  const db = readDatabase();
  db.monthlyIncome = income;
  writeDatabase(db);
}

// Orçamentos
export function getBudgetForMonth(month: string): BudgetGoal {
  const db = readDatabase();
  if (db.budgets[month]) {
    return db.budgets[month];
  }

  const categoryLimits: Record<string, number> = {};
  let totalLimit = 0;
  for (const cat of DEFAULT_CATEGORIES) {
    categoryLimits[cat.name] = cat.defaultBudget;
    totalLimit += cat.defaultBudget;
  }

  const newBudget: BudgetGoal = {
    month,
    totalLimit: db.monthlyIncome || 3000,
    categoryLimits,
  };

  db.budgets[month] = newBudget;
  writeDatabase(db);
  return newBudget;
}

export function updateBudget(month: string, budget: Partial<BudgetGoal>): BudgetGoal {
  const db = readDatabase();
  const current = getBudgetForMonth(month);

  const updated: BudgetGoal = {
    ...current,
    ...budget,
    month,
  };

  db.budgets[month] = updated;
  writeDatabase(db);
  return updated;
}

export function getWebhookSecret(): string {
  const db = readDatabase();
  return db.webhookSecret || DEFAULT_SECRET;
}

export function setWebhookSecret(secret: string): void {
  const db = readDatabase();
  db.webhookSecret = secret;
  writeDatabase(db);
}
