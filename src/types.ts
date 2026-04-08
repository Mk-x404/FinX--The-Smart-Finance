export interface Expense {
  id: string;
  category: Category;
  amount: number;
  date: string;
  note: string;
}

export interface Loan {
  id: string;
  vendorName: string;
  amount: number;
  item: string;
  takenDate: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
  note: string;
}

export interface Settings {
  monthlyBudget: number;
  savingsGoal: number;
}

export const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Shopping', 'Medical', 'Other', 'Entertainment', 'Health', 'Education'] as const;
export type Category = typeof CATEGORIES[number];

export const INCOME_SOURCES = ['Salary', 'Freelancing', 'Gift', 'Investment', 'Other'] as const;
export type IncomeSource = typeof INCOME_SOURCES[number];

export interface RepaymentPlan {
  id: string;
  vendor: string;
  amount: number;
  dueDate: string;
  dailySave: number;
  daysLeft: number;
  isOverdue: boolean;
}

export interface FinancialSummary {
  totalExpenses: number;
  totalIncome: number;
  totalSavings: number;
  totalLoans: number;
  remainingBudget: number;
  budgetUsedPercent: number;
  savingsProgress: number;
  financialHealthScore: number;
  categoryBreakdown: { category: string; amount: number }[];
  incomeBreakdown: { source: string; amount: number }[];
  dailySpendLimit: number;
  repaymentPlans: RepaymentPlan[];
  monthlyBudget: number;
  savingsGoal: number;
}
