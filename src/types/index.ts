export type TransactionSource = 
  | 'apple_pay'
  | 'santander_pix'
  | 'santander_card'
  | 'manual'
  | 'generic_webhook';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  merchant: string;
  rawMerchant?: string;
  category: string;
  source: TransactionSource;
  paymentMethod: string;
  date: string; // ISO 8601
  notes?: string;
  cardLastDigits?: string;
  createdAt: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDay?: number; // Dia do vencimento (1 a 31)
  description?: string;
  active: boolean;
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  defaultBudget: number;
}

export interface BudgetGoal {
  month: string; // YYYY-MM
  totalLimit: number;
  categoryLimits: Record<string, number>;
}

export type AdviceCategory = 'saving' | 'investment' | 'emergency_fund' | 'alert';

export interface DynamicAdvice {
  id: string;
  category: AdviceCategory;
  title: string;
  summary: string;
  detailedAdvice: string;
  suggestedAction: string;
  impactAmount?: number;
  level: 'good' | 'attention' | 'urgent';
}

export interface SalaryPayment {
  day: number; // Dia do mês (1 a 31)
  amount: number;
  label?: string; // ex: 'Salário', 'Adiantamento', 'Vale'
}

export interface SalaryConfig {
  frequency: 'single' | 'split'; // 1x ou 2x por mês
  totalAmount: number;
  payments: SalaryPayment[];
}

export interface FinancialInsight {
  id: string;
  type: 'overconsumption' | 'saving_tip' | 'pattern' | 'milestone';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  category?: string;
  actionableTip?: string;
  impactAmount?: number;
  date: string;
}

export interface MonthlyAnalytics {
  currentMonth: string; // YYYY-MM
  monthlyIncome: number; // Renda fixa mensal (ex: R$ 3000)
  totalExtraIncome: number; // Rendas extras adicionadas no mês (freelas, vendas, etc.)
  totalGrossIncome: number; // Renda fixa + Rendas extras
  totalFixedExpenses: number; // Soma dos gastos fixos (ex: R$ 1080)
  totalVariableSpent: number; // Gastos do dia a dia (cartão, pix, apple pay)
  totalSpent: number; // Fixos + Variáveis
  freeBalanceRemaining: number; // (Renda Fixa + Renda Extra) - Gastos Fixos - Gastos Variáveis
  safeDailyAllowance: number; // Quanto pode gastar por dia restante no mês
  daysRemainingInMonth: number;
  totalBudget: number;
  budgetPercentage: number;
  projectedEndMonthSpent: number;
  dailyAverageSpent: number;
  fixedExpensesList: FixedExpense[];
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    budget: number;
    budgetPercentage: number;
    isOverBudget: boolean;
    color: string;
    icon: string;
  }[];
  dailySpending: {
    date: string;
    dayLabel: string;
    amount: number;
  }[];
  spendingBySource: {
    source: TransactionSource;
    label: string;
    amount: number;
    count: number;
  }[];
  adviceList: DynamicAdvice[];
  salaryConfig?: SalaryConfig;
  nextSalaryPayment?: {
    day: number;
    amount: number;
    daysRemaining: number;
    isToday: boolean;
    isNextMonth?: boolean;
    label: string;
  };
}
