import fs from 'fs';
import path from 'path';
import { BudgetGoal, FixedExpense, SalaryConfig, Transaction } from '@/types';
import { DEFAULT_CATEGORIES, calculateCategoryLimits, FIXED_EDUCATION_BUDGET } from './categories';


export interface DatabaseSchema {
  initialized?: boolean;
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  monthlyIncome: number;
  salaryConfig?: SalaryConfig;
  budgets: Record<string, BudgetGoal>; // key: YYYY-MM
  webhookSecret: string;
}

// Configurações de Nuvem (Upstash Redis / Vercel KV)
export function getUpstashCredentials(): { url?: string; token?: string; detectedKey?: string } {
  // 1. Chaves conhecidas
  const knownUrlKeys = [
    'KV_REST_API_URL',
    'UPSTASH_REDIS_REST_URL',
    'STORAGE_REST_API_URL',
    'STORAGE_URL',
    'REDIS_URL',
    'REDIS_REST_URL',
  ];
  const knownTokenKeys = [
    'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_TOKEN',
    'STORAGE_REST_API_TOKEN',
    'STORAGE_TOKEN',
    'REDIS_TOKEN',
    'REDIS_REST_TOKEN',
  ];

  for (let i = 0; i < knownUrlKeys.length; i++) {
    const u = process.env[knownUrlKeys[i]];
    const t = process.env[knownTokenKeys[i]];
    if (u && t) {
      return { url: u, token: t, detectedKey: knownUrlKeys[i] };
    }
  }

  // 2. Busca dinâmica por prefixos gerados automaticamente pelo Vercel Marketplace
  // Exemplo: UPSTASH_KV_COQUELICOT_CHAIR_REST_API_URL
  let foundUrl: string | undefined;
  let foundToken: string | undefined;
  let detectedKey: string | undefined;

  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    const k = key.toUpperCase();

    if (!foundUrl && (k.includes('REST_API_URL') || k.includes('REST_URL') || (k.includes('UPSTASH') && k.includes('URL')))) {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        foundUrl = value;
        detectedKey = key;
      }
    }

    if (!foundToken && !k.includes('READ_ONLY') && (k.includes('REST_API_TOKEN') || k.includes('REST_TOKEN') || (k.includes('UPSTASH') && k.includes('TOKEN')))) {
      foundToken = value;
    }
  }

  // Fallback caso só tenha achado token com nome genérico
  if (foundUrl && !foundToken) {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.toUpperCase().includes('TOKEN') && value) {
        foundToken = value;
        break;
      }
    }
  }

  return { url: foundUrl, token: foundToken, detectedKey };
}

const KV_KEY = 'finance_pro_database';

export function isCloudStorageConfigured(): boolean {
  const creds = getUpstashCredentials();
  return Boolean(creds.url && creds.token);
}

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

function getInitialBudgets(income: number = 3000.00): Record<string, BudgetGoal> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const categoryLimits = calculateCategoryLimits(income);

  return {
    [currentMonth]: {
      month: currentMonth,
      totalLimit: income,
      categoryLimits,
    },
  };
}

function getDefaultSalaryConfig(totalAmount: number = 3000.00): SalaryConfig {
  const half = Math.round((totalAmount / 2) * 100) / 100;
  const remainder = Math.round((totalAmount - half) * 100) / 100;
  return {
    frequency: 'split',
    totalAmount,
    payments: [
      { day: 5, amount: half, label: 'Salário' },
      { day: 20, amount: remainder, label: 'Adiantamento' },
    ],
  };
}

function getDefaultDatabase(): DatabaseSchema {
  const defaultIncome = 3000.00;
  return {
    initialized: true,
    transactions: [], // Nunca inicializa com transações fictícias
    fixedExpenses: getDefaultFixedExpenses(),
    monthlyIncome: defaultIncome,
    salaryConfig: getDefaultSalaryConfig(defaultIncome),
    budgets: getInitialBudgets(defaultIncome),
    webhookSecret: DEFAULT_SECRET,
  };
}

/**
 * Lê o banco de dados da Nuvem (Upstash Redis) com fallback para arquivo
 */
export async function getDatabaseAsync(): Promise<DatabaseSchema> {
  // 1. Tenta buscar no Upstash Redis se configurado
  const creds = getUpstashCredentials();
  if (creds.url && creds.token) {
    try {
      let rawResult: any = null;

      // Método 1: Chamada direta /get/:key
      try {
        const res = await fetch(`${creds.url}/get/${KV_KEY}`, {
          headers: {
            Authorization: `Bearer ${creds.token}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          rawResult = json?.result;
        }
      } catch (err1) {
        // Continua para o método 2
      }

      // Método 2 (Fallback): Comando oficial Upstash ["GET", key]
      if (rawResult === null || rawResult === undefined) {
        try {
          const res = await fetch(creds.url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${creds.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(['GET', KV_KEY]),
            cache: 'no-store',
          });
          if (res.ok) {
            const json = await res.json();
            rawResult = json?.result;
          }
        } catch (err2) {
          // Silencia
        }
      }

      if (rawResult !== null && rawResult !== undefined) {
        const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
        if (parsed && typeof parsed === 'object') {
          memoryCache = {
            initialized: true,
            transactions: Array.isArray(parsed.transactions) 
              ? parsed.transactions.filter((t: any) => t && !String(t.id).startsWith('seed_') && !String(t.id).startsWith('tx_seed_')) 
              : [],
            fixedExpenses: Array.isArray(parsed.fixedExpenses) ? parsed.fixedExpenses : getDefaultFixedExpenses(),
            monthlyIncome: parsed.monthlyIncome ?? 3000.00,
            salaryConfig: parsed.salaryConfig || getDefaultSalaryConfig(parsed.monthlyIncome ?? 3000.00),
            budgets: parsed.budgets || getInitialBudgets(),
            webhookSecret: parsed.webhookSecret || DEFAULT_SECRET,
          };
          return memoryCache;
        }
      }
    } catch (err) {
      console.error('Erro ao ler do Upstash KV:', err);
    }
  }

  // 2. Cache em memória da execução atual
  if (memoryCache) {
    return memoryCache;
  }

  // 3. Arquivo local
  ensureDataDirectory();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryCache = {
        initialized: true,
        transactions: Array.isArray(parsed.transactions) 
          ? parsed.transactions.filter((t: any) => t && !String(t.id).startsWith('seed_') && !String(t.id).startsWith('tx_seed_')) 
          : [],
        fixedExpenses: Array.isArray(parsed.fixedExpenses) ? parsed.fixedExpenses : getDefaultFixedExpenses(),
        monthlyIncome: parsed.monthlyIncome ?? 3000.00,
        salaryConfig: parsed.salaryConfig || getDefaultSalaryConfig(parsed.monthlyIncome ?? 3000.00),
        budgets: parsed.budgets || getInitialBudgets(),
        webhookSecret: parsed.webhookSecret || DEFAULT_SECRET,
      };
      return memoryCache;
    } catch (err) {
      console.error('Erro lendo banco local:', err);
    }
  }

  // 4. Primeira inicialização caso não exista nada
  const initial = getDefaultDatabase();
  await saveDatabaseAsync(initial);
  memoryCache = initial;
  return initial;
}

/**
 * Grava dados de forma assíncrona garantindo persistência na nuvem Upstash
 */
export async function saveDatabaseAsync(data: DatabaseSchema): Promise<void> {
  data.initialized = true;
  memoryCache = data;
  ensureDataDirectory();

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Aviso ao escrever em disco:', err);
  }

  const creds = getUpstashCredentials();
  if (creds.url && creds.token) {
    try {
      const dataStr = JSON.stringify(data);

      // Método 1: Comando Oficial Upstash REST ["SET", key, value]
      const resCmd = await fetch(creds.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', KV_KEY, dataStr]),
      });

      if (!resCmd.ok) {
        // Método 2 (Fallback): /set/:key
        await fetch(`${creds.url}/set/${KV_KEY}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${creds.token}`,
            'Content-Type': 'application/json',
          },
          body: dataStr,
        });
      }
    } catch (e) {
      console.error('Erro ao sincronizar com Upstash KV:', e);
    }
  }
}

/**
 * Lê o banco de forma síncrona (com cache)
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
        initialized: true,
        transactions: Array.isArray(parsed.transactions) 
          ? parsed.transactions.filter((t: any) => t && !String(t.id).startsWith('seed_') && !String(t.id).startsWith('tx_seed_')) 
          : [],
        fixedExpenses: Array.isArray(parsed.fixedExpenses) ? parsed.fixedExpenses : getDefaultFixedExpenses(),
        monthlyIncome: parsed.monthlyIncome ?? 3000.00,
        salaryConfig: parsed.salaryConfig || getDefaultSalaryConfig(parsed.monthlyIncome ?? 3000.00),
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
 * Grava síncrono com disparo assíncrono para nuvem
 */
export function writeDatabase(data: DatabaseSchema): void {
  data.initialized = true;
  memoryCache = data;
  ensureDataDirectory();

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Aviso ao escrever em disco:', err);
  }

  const creds = getUpstashCredentials();
  if (creds.url && creds.token) {
    fetch(creds.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', KV_KEY, JSON.stringify(data)]),
    }).catch(e => console.error('Erro ao sincronizar com Upstash KV:', e));
  }
}

// Funções de Transações (Assíncronas & Síncronas)
export async function getAllTransactionsAsync(): Promise<Transaction[]> {
  const db = await getDatabaseAsync();
  return db.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllTransactions(): Transaction[] {
  const db = readDatabase();
  return db.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addTransactionAsync(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const db = await getDatabaseAsync();
  const newTx: Transaction = {
    ...tx,
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  db.transactions.unshift(newTx);
  await saveDatabaseAsync(db);
  return newTx;
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

export async function deleteTransactionAsync(id: string): Promise<boolean> {
  const db = await getDatabaseAsync();
  const initialCount = db.transactions.length;
  db.transactions = db.transactions.filter(t => t.id !== id);
  if (db.transactions.length !== initialCount) {
    await saveDatabaseAsync(db);
    return true;
  }
  return false;
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

export async function updateTransactionAsync(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
  const db = await getDatabaseAsync();
  const index = db.transactions.findIndex(t => t.id === id);
  if (index === -1) return null;

  db.transactions[index] = {
    ...db.transactions[index],
    ...updates,
    id,
  };
  await saveDatabaseAsync(db);
  return db.transactions[index];
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

// Funções de Gastos Fixos (Assíncronas & Síncronas)
export async function getFixedExpensesAsync(): Promise<FixedExpense[]> {
  const db = await getDatabaseAsync();
  return db.fixedExpenses || getDefaultFixedExpenses();
}

export function getFixedExpenses(): FixedExpense[] {
  const db = readDatabase();
  return db.fixedExpenses || getDefaultFixedExpenses();
}

export async function addFixedExpenseAsync(expense: Omit<FixedExpense, 'id'>): Promise<FixedExpense> {
  const db = await getDatabaseAsync();
  const newFixed: FixedExpense = {
    ...expense,
    id: 'fix_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
  };

  if (!db.fixedExpenses) db.fixedExpenses = [];
  db.fixedExpenses.push(newFixed);
  await saveDatabaseAsync(db);
  return newFixed;
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

export async function updateFixedExpenseAsync(id: string, updates: Partial<FixedExpense>): Promise<FixedExpense | null> {
  const db = await getDatabaseAsync();
  if (!db.fixedExpenses) return null;
  const index = db.fixedExpenses.findIndex(f => f.id === id);
  if (index === -1) return null;

  db.fixedExpenses[index] = {
    ...db.fixedExpenses[index],
    ...updates,
    id,
  };
  await saveDatabaseAsync(db);
  return db.fixedExpenses[index];
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

export async function deleteFixedExpenseAsync(id: string): Promise<boolean> {
  const db = await getDatabaseAsync();
  if (!db.fixedExpenses) return false;
  const initial = db.fixedExpenses.length;
  db.fixedExpenses = db.fixedExpenses.filter(f => f.id !== id);
  if (db.fixedExpenses.length !== initial) {
    await saveDatabaseAsync(db);
    return true;
  }
  return false;
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

// Renda Mensal e Configuração de Salário (Assíncrona & Síncrona)
export async function getMonthlyIncomeAsync(): Promise<number> {
  const db = await getDatabaseAsync();
  return db.monthlyIncome ?? 3000.00;
}

export function getMonthlyIncome(): number {
  const db = readDatabase();
  return db.monthlyIncome ?? 3000.00;
}

export async function getSalaryConfigAsync(): Promise<SalaryConfig> {
  const db = await getDatabaseAsync();
  if (db.salaryConfig && db.salaryConfig.payments && db.salaryConfig.payments.length > 0) {
    return db.salaryConfig;
  }
  const income = db.monthlyIncome || 3000.00;
  return getDefaultSalaryConfig(income);
}

export function getSalaryConfig(): SalaryConfig {
  const db = readDatabase();
  if (db.salaryConfig && db.salaryConfig.payments && db.salaryConfig.payments.length > 0) {
    return db.salaryConfig;
  }
  const income = db.monthlyIncome || 3000.00;
  return getDefaultSalaryConfig(income);
}

export async function setSalaryConfigAsync(config: SalaryConfig): Promise<SalaryConfig> {
  const db = await getDatabaseAsync();
  
  // Calcula o totalAmount a partir das parcelas caso não venha informado
  const total = config.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const normalizedConfig: SalaryConfig = {
    ...config,
    totalAmount: total > 0 ? total : config.totalAmount,
  };

  db.salaryConfig = normalizedConfig;
  db.monthlyIncome = normalizedConfig.totalAmount;

  // Atualiza automaticamente os tetos das categorias do mês corrente conforme a renda
  const currentMonth = new Date().toISOString().slice(0, 7);
  db.budgets[currentMonth] = {
    month: currentMonth,
    totalLimit: normalizedConfig.totalAmount,
    categoryLimits: calculateCategoryLimits(normalizedConfig.totalAmount),
  };

  await saveDatabaseAsync(db);
  return normalizedConfig;
}

export function setSalaryConfig(config: SalaryConfig): SalaryConfig {
  const db = readDatabase();
  const total = config.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const normalizedConfig: SalaryConfig = {
    ...config,
    totalAmount: total > 0 ? total : config.totalAmount,
  };

  db.salaryConfig = normalizedConfig;
  db.monthlyIncome = normalizedConfig.totalAmount;

  const currentMonth = new Date().toISOString().slice(0, 7);
  db.budgets[currentMonth] = {
    month: currentMonth,
    totalLimit: normalizedConfig.totalAmount,
    categoryLimits: calculateCategoryLimits(normalizedConfig.totalAmount),
  };

  writeDatabase(db);
  return normalizedConfig;
}

export async function setMonthlyIncomeAsync(income: number): Promise<void> {
  const db = await getDatabaseAsync();
  db.monthlyIncome = income;
  if (db.salaryConfig && db.salaryConfig.frequency === 'split') {
    const half = Math.round((income / 2) * 100) / 100;
    const remainder = Math.round((income - half) * 100) / 100;
    db.salaryConfig.totalAmount = income;
    if (db.salaryConfig.payments.length >= 2) {
      db.salaryConfig.payments[0].amount = half;
      db.salaryConfig.payments[1].amount = remainder;
    }
  } else if (db.salaryConfig) {
    db.salaryConfig.totalAmount = income;
    if (db.salaryConfig.payments.length >= 1) {
      db.salaryConfig.payments[0].amount = income;
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  db.budgets[currentMonth] = {
    month: currentMonth,
    totalLimit: income,
    categoryLimits: calculateCategoryLimits(income),
  };

  await saveDatabaseAsync(db);
}

export function setMonthlyIncome(income: number): void {
  const db = readDatabase();
  db.monthlyIncome = income;
  if (db.salaryConfig && db.salaryConfig.frequency === 'split') {
    const half = Math.round((income / 2) * 100) / 100;
    const remainder = Math.round((income - half) * 100) / 100;
    db.salaryConfig.totalAmount = income;
    if (db.salaryConfig.payments.length >= 2) {
      db.salaryConfig.payments[0].amount = half;
      db.salaryConfig.payments[1].amount = remainder;
    }
  } else if (db.salaryConfig) {
    db.salaryConfig.totalAmount = income;
    if (db.salaryConfig.payments.length >= 1) {
      db.salaryConfig.payments[0].amount = income;
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  db.budgets[currentMonth] = {
    month: currentMonth,
    totalLimit: income,
    categoryLimits: calculateCategoryLimits(income),
  };

  writeDatabase(db);
}

// Orçamentos
export async function getBudgetForMonthAsync(month: string): Promise<BudgetGoal> {
  const db = await getDatabaseAsync();
  const income = db.monthlyIncome || 3000;

  const existing = db.budgets[month];
  if (existing && existing.categoryLimits) {
    // Se o teto de Educação for diferente de 1035 ou totalLimit diferente da renda, recalculamos
    if (existing.categoryLimits['Educação'] !== FIXED_EDUCATION_BUDGET || existing.totalLimit !== income) {
      existing.totalLimit = income;
      existing.categoryLimits = calculateCategoryLimits(income);
      db.budgets[month] = existing;
      await saveDatabaseAsync(db);
    }
    return existing;
  }

  const categoryLimits = calculateCategoryLimits(income);
  const newBudget: BudgetGoal = {
    month,
    totalLimit: income,
    categoryLimits,
  };

  db.budgets[month] = newBudget;
  await saveDatabaseAsync(db);
  return newBudget;
}

// Orçamentos síncrono
export function getBudgetForMonth(month: string): BudgetGoal {
  const db = readDatabase();
  const income = db.monthlyIncome || 3000;

  const existing = db.budgets[month];
  if (existing && existing.categoryLimits) {
    if (existing.categoryLimits['Educação'] !== FIXED_EDUCATION_BUDGET || existing.totalLimit !== income) {
      existing.totalLimit = income;
      existing.categoryLimits = calculateCategoryLimits(income);
      db.budgets[month] = existing;
      writeDatabase(db);
    }
    return existing;
  }

  const categoryLimits = calculateCategoryLimits(income);
  const newBudget: BudgetGoal = {
    month,
    totalLimit: income,
    categoryLimits,
  };

  db.budgets[month] = newBudget;
  writeDatabase(db);
  return newBudget;
}

export async function updateBudgetAsync(month: string, budget: Partial<BudgetGoal>): Promise<BudgetGoal> {
  const db = await getDatabaseAsync();
  const current = await getBudgetForMonthAsync(month);

  const updated: BudgetGoal = {
    ...current,
    ...budget,
    month,
  };

  db.budgets[month] = updated;
  await saveDatabaseAsync(db);
  return updated;
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
