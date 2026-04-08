import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, Receipt, Handshake, TrendingUp, BarChart3,
  Plus, Trash2, Download, Menu, X, Moon, Sun, AlertTriangle,
  Sparkles, BrainCircuit, Clock, TrendingDown, ArrowUpRight,
  ArrowDownRight, CheckCircle2, ChevronRight, Bell, PiggyBank,
  ShieldCheck, Target, Flame, HeartPulse, Zap, Send
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { Expense, Loan, Income, FinancialSummary, CATEGORIES } from './types';

gsap.registerPlugin(ScrollTrigger);

const CHART_COLORS = ['#f0b429', '#4f46e5', '#10b981', '#ec4899', '#f43f5e', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

// --- Utility Functions ---

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString('en-PK')}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

// --- Components ---

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md bg-opacity-90">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label || payload[0].name}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <p className="text-sm font-black text-white">
                {entry.name}: <span className="text-gold">{formatCurrency(entry.value)}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const createRipple = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
  circle.classList.add('ripple-effect');

  const ripple = button.getElementsByClassName('ripple-effect')[0];
  if (ripple) ripple.remove();

  button.appendChild(circle);
};

const Counter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    gsap.to(countRef.current, {
      duration,
      innerHTML: value,
      roundProps: 'innerHTML',
      ease: 'power2.out',
      onUpdate: () => {
        if (countRef.current) {
          setCount(parseInt((countRef.current as any).innerHTML));
        }
      }
    });
  }, [value, duration]);

  return <span ref={countRef} className="font-mono-numbers">{count.toLocaleString('en-PK')}</span>;
};

const StatCard = ({ title, value, icon: Icon, colorClass, progress, trend, isScore }: { 
  title: string; 
  value: number; 
  icon: any; 
  colorClass: string;
  progress?: number;
  trend?: { value: string; isUp: boolean };
  isScore?: boolean;
}) => (
  <motion.div 
    whileHover={{ y: -12, scale: 1.03, rotateX: 2, rotateY: 2 }}
    onClick={createRipple}
    className="bg-[var(--bg-card)] p-7 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-2xl hover:shadow-gold/10 transition-all cursor-pointer ripple group perspective-1000"
  >
    <div className="flex justify-between items-start mb-6">
      <div className={cn("p-4 rounded-2xl bg-opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12", colorClass)}>
        <Icon size={28} className="icon-3d" />
      </div>
      {progress !== undefined ? (
        <div className="relative w-14 h-14">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              className="text-slate-100 dark:text-slate-800 stroke-current"
              strokeWidth="4"
              fill="none"
              cx="18" cy="18" r="16"
            />
            <circle
              className="text-gold stroke-current transition-all duration-1000 ease-out"
              strokeWidth="4"
              strokeDasharray={`${progress}, 100`}
              strokeLinecap="round"
              fill="none"
              cx="18" cy="18" r="16"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-gold">
            {progress}%
          </div>
        </div>
      ) : trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black",
          trend.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend.value}
        </div>
      )}
    </div>
    <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
    <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
      {!isScore && <span className="text-sm font-bold mr-1 opacity-50">PKR</span>}
      <Counter value={value} duration={0.8} />
      {isScore && <span className="text-sm font-bold ml-1 opacity-50">/100</span>}
    </h3>
  </motion.div>
);

const QuickAction = ({ icon: Icon, label, onClick, color }: { icon: any; label: string; onClick: any; color: string }) => (
  <motion.button
    whileHover={{ y: -5, scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-lg transition-all ripple group",
      `hover:border-${color}-500/50`
    )}
  >
    <div className={cn("p-4 rounded-2xl bg-opacity-10 group-hover:scale-110 transition-transform", `bg-${color}-500 text-${color}-500`)}>
      <Icon size={24} />
    </div>
    <span className="text-xs font-black text-[var(--text-main)] tracking-tight">{label}</span>
  </motion.button>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[var(--text-main)]">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-base)] transition-colors">
                <X size={24} />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showAlert, setShowAlert] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // AI Chat State
  const [aiChat, setAiChat] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: "👋 Salam! I'm your FinX AI Advisor. How can I help you today?" }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalExpenses: 0,
    totalIncome: 0,
    totalSavings: 0,
    totalLoans: 0,
    remainingBudget: 0,
    budgetUsedPercent: 0,
    savingsProgress: 0,
    financialHealthScore: 0,
    categoryBreakdown: [],
    incomeBreakdown: [],
    dailySpendLimit: 0,
    repaymentPlans: [],
    monthlyBudget: 0,
    savingsGoal: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Computed data from real API
  const smartInsights = useMemo(() => {
    if (!summary) return [];
    const insights: {title: string; text: string; urgency: string; color: string; action: () => void}[] = [];
    if (summary.repaymentPlans) {
      summary.repaymentPlans.filter(p => p.isOverdue).forEach(p => {
        insights.push({ title: `${p.vendor} Overdue`, text: `PKR ${p.amount.toLocaleString()} is overdue. Settle this immediately!`, urgency: 'critical', color: 'bg-red-600', action: () => setActiveTab('loans') });
      });
      summary.repaymentPlans.filter(p => !p.isOverdue && p.daysLeft <= 7).forEach(p => {
        insights.push({ title: `${p.vendor} Due Soon`, text: `Save PKR ${p.dailySave.toLocaleString()}/day for ${p.daysLeft} days to repay on time.`, urgency: 'high', color: 'bg-rose-500', action: () => setActiveTab('loans') });
      });
    }
    if (summary.budgetUsedPercent > 80) {
      insights.push({ title: 'Budget Warning', text: `You've used ${summary.budgetUsedPercent}% of your budget. Slow down spending!`, urgency: 'high', color: 'bg-rose-500', action: () => setActiveTab('expenses') });
    }
    if (summary.savingsProgress < 50 && summary.savingsGoal > 0) {
      insights.push({ title: 'Savings Goal', text: `Only ${summary.savingsProgress}% towards your PKR ${summary.savingsGoal.toLocaleString()} goal. Add savings today!`, urgency: 'low', color: 'bg-emerald-500', action: () => setActiveModal('saving') });
    }
    if (summary.dailySpendLimit > 0) {
      insights.push({ title: 'Daily Limit', text: `You can spend PKR ${summary.dailySpendLimit.toLocaleString()}/day for the rest of this month.`, urgency: 'low', color: 'bg-emerald-500', action: () => setActiveTab('dashboard') });
    }
    if (insights.length === 0) {
      if (isLoading) {
        insights.push({ title: 'Syncing Data...', text: 'Connecting to FinX cloud to fetch your latest records...', urgency: 'low', color: 'bg-indigo-500', action: () => {} });
      } else {
        insights.push({ title: 'All Good!', text: 'Your finances look healthy. Keep up the great work! 🎉', urgency: 'low', color: 'bg-emerald-500', action: () => {} });
      }
    }
    return insights.slice(0, 3);
  }, [summary, isLoading]);

  const incomeVsExpenseData = useMemo(() => {
    if (!summary) return [];
    return [{ month: 'This Month', income: summary.totalIncome, expenses: summary.totalExpenses }];
  }, [summary]);


  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const fetchData = async () => {
    try {
      const [expRes, incRes, loanRes, sumRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/income'),
        fetch('/api/loans'),
        fetch('/api/summary')
      ]);

      if (!expRes.ok || !incRes.ok || !loanRes.ok || !sumRes.ok) throw new Error('Failed to fetch data');

      const [expData, incData, loanData, sumData] = await Promise.all([
        expRes.json(),
        incRes.json(),
        loanRes.json(),
        sumRes.json()
      ]);

      setExpenses(expData);
      setIncome(incData);
      setLoans(loanData);
      setSummary(sumData);
      
      // Ensure GSAP recalculates triggers after content loads
      setTimeout(() => ScrollTrigger.refresh(), 100);
    } catch (error) {
      showToast('Error syncing data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    const userMsg = aiInput;
    setAiInput('');
    setAiChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await response.json();
      if (data.reply) {
        setAiChat(prev => [...prev, { role: 'ai', content: data.reply }]);
      } else {
        throw new Error('No reply');
      }
    } catch (err) {
      setAiChat(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to the AI services. Please check your API key." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Expense deleted');
        fetchData();
      } else {
        showToast('Error deleting expense', 'error');
      }
    } catch (error) {
      showToast('Error deleting expense', 'error');
    }
  };

  const deleteIncome = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    try {
      const res = await fetch(`/api/income/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Income record deleted');
        fetchData();
      } else {
        showToast('Error deleting record', 'error');
      }
    } catch (error) {
      showToast('Error deleting record', 'error');
    }
  };

  const deleteLoan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;
    try {
      const res = await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Loan deleted');
        fetchData();
      } else {
        showToast('Error deleting loan', 'error');
      }
    } catch (error) {
      showToast('Error deleting loan', 'error');
    }
  };

  const settleLoan = async (id: string) => {
    try {
      const res = await fetch(`/api/loans/${id}/settle`, { method: 'POST' });
      if (res.ok) {
        showToast('Loan settled successfully');
        fetchData();
      } else {
         showToast('Error settling loan', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const handleSavingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      amount: Number(formData.get('amount')),
      date: new Date().toISOString().split('T')[0],
      note: formData.get('description')
    };

    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('Savings added! Budget updated.');
        setActiveModal(null);
        fetchData();
      } else {
        showToast('Failed to save', 'error');
      }
    } catch (error) {
       showToast('Network error', 'error');
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = "FinX Financial Report";
    const date = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(240, 180, 41); // Gold
    doc.text("FinX", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Personalized Financial Summary", 14, 30);
    doc.text(`Generated on: ${date}`, 140, 30);

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Executive Summary", 14, 45);
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Total Income', formatCurrency(summary?.totalIncome || 0)],
        ['Total Expenses', formatCurrency(summary?.totalExpenses || 0)],
        ['Remaining Budget', formatCurrency(summary?.remainingBudget || 0)],
        ['Financial Health', `${Math.round(summary?.savingsProgress || 0)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [240, 180, 41] as any }
    });

    // Expenses Table
    doc.text("Recent Expenses", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: expenses.map(e => [formatDate(e.date), e.note, e.category, formatCurrency(e.amount)]),
    });

    // Loans Table
    doc.addPage();
    doc.text("Pending Loans (Udhar)", 14, 20);
    autoTable(doc, {
      startY: 25,
      head: [['Vendor', 'Item', 'Due Date', 'Amount', 'Status']],
      body: loans.map(l => [l.vendorName, l.item, formatDate(l.dueDate), formatCurrency(l.amount), l.status]),
    });

    doc.save(`FinX_Report_${date.replace(/\//g, '-')}.pdf`);
    showToast('Report downloaded successfully');
  };

  const handleExpenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      amount: Number(formData.get('amount')),
      category: formData.get('category'),
      date: new Date().toISOString().split('T')[0],
      note: formData.get('description')
    };

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('Expense added successfully');
        setActiveModal(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save expense', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const handleIncomeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      source: formData.get('source'),
      amount: Number(formData.get('amount')),
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('Income added successfully');
        setActiveModal(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error adding income', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      vendorName: formData.get('vendorName'),
      amount: Number(formData.get('amount')),
      dueDate: formData.get('dueDate'),
      item: formData.get('item'),
      takenDate: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('Loan added successfully');
        setActiveModal(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error adding loan', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  useEffect(() => {
    fetchData();
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // GSAP Scroll Animations
    const sections = gsap.utils.toArray('.scroll-section');
    sections.forEach((section: any) => {
      gsap.fromTo(section, 
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.4, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // Progress bar animations
    const progressBars = gsap.utils.toArray('.progress-fill');
    progressBars.forEach((bar: any) => {
      const targetWidth = bar.getAttribute('data-width');
      gsap.to(bar, {
        width: targetWidth,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: bar,
          start: 'top 95%'
        }
      });
    });

    // Navbar shrink on scroll
    ScrollTrigger.create({
      start: 'top -20',
      onEnter: () => gsap.to('nav', { padding: '12px 24px', backgroundColor: theme === 'dark' ? 'rgba(15, 17, 23, 0.9)' : 'rgba(248, 249, 252, 0.9)', backdropFilter: 'blur(10px)', duration: 0.3 }),
      onLeaveBack: () => gsap.to('nav', { padding: '20px 32px', backgroundColor: 'transparent', backdropFilter: 'blur(0px)', duration: 0.3 })
    });
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative z-40 h-full bg-[var(--bg-card)] border-r border-[var(--border-color)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
        isSidebarOpen ? "w-72" : "w-0 lg:w-24"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-gold/20">
              <TrendingUp size={24} strokeWidth={3} />
            </div>
            {isSidebarOpen && <h1 className="text-2xl font-black tracking-tighter text-[var(--text-main)]">FinX</h1>}
          </div>

          <nav className="flex-1 space-y-3">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'expenses', icon: Receipt, label: 'Expenses' },
              { id: 'loans', icon: Handshake, label: 'Udhar Tracker' },
              { id: 'income', icon: TrendingUp, label: 'Income' },
              { id: 'reports', icon: BarChart3, label: 'Reports' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  activeTab === item.id 
                    ? "bg-gold text-slate-900 font-bold shadow-xl shadow-gold/20 scale-[1.02]" 
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-base)] hover:text-[var(--text-main)] hover:translate-x-1"
                )}
              >
                <item.icon size={22} className={cn("shrink-0 transition-all duration-300", activeTab === item.id ? "scale-110" : "group-hover:scale-110 group-hover:rotate-6")} />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-bold tracking-tight whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-6 bg-slate-900 rounded-r-full"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 h-screen overflow-y-auto relative scroll-smooth">
        {/* Navbar */}
        <nav className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 transition-all duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:scale-105 transition-transform"
            >
              {isSidebarOpen ? <Menu size={20} /> : <ChevronRight size={20} />}
            </button>
            <h1 className="text-2xl font-black tracking-tighter text-gold ml-2 animate-pulse-subtle">FinX</h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm hover:rotate-12 transition-all"
            >
              {theme === 'dark' ? <Sun size={20} className="text-gold" /> : <Moon size={20} className="text-indigo-600" />}
            </button>
            <button 
              onClick={() => showToast('You have 3 new financial insights!', 'success')}
              className="relative p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-[var(--bg-card)] rounded-full animate-pulse"></span>
            </button>
          </div>
        </nav>

        <div className="p-8 max-w-7xl mx-auto space-y-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {/* Dashboard Hero */}
                <section className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tighter mb-2">Financial Overview</h2>
                      <p className="text-[var(--text-muted)] font-medium">Welcome back! Here's what's happening with your money today.</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        createRipple(e);
                        setActiveModal('expense');
                      }}
                      className="bg-gold text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-gold/20 hover:scale-105 transition-all ripple"
                    >
                      <Plus size={20} strokeWidth={3} />
                      Add Transaction
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Income" value={summary?.totalIncome || 0} icon={ArrowUpRight} colorClass="bg-emerald-500 text-emerald-500" />
                    <StatCard title="Total Expenses" value={summary?.totalExpenses || 0} icon={ArrowDownRight} colorClass="bg-rose-500 text-rose-500" />
                    <StatCard title="Total Savings" value={summary?.totalSavings || 0} icon={PiggyBank} colorClass="bg-amber-500 text-amber-500" />
                    <StatCard 
                      title="Health Score" 
                      value={summary?.financialHealthScore || 0} 
                      icon={HeartPulse} 
                      colorClass="bg-gold text-gold" 
                      progress={summary?.financialHealthScore || 0} 
                      isScore 
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <QuickAction icon={Plus} label="Add Expense" color="rose" onClick={() => setActiveModal('expense')} />
                    <QuickAction icon={TrendingUp} label="Add Income" color="emerald" onClick={() => setActiveModal('income')} />
                    <QuickAction icon={PiggyBank} label="Add Saving" color="amber" onClick={() => setActiveModal('saving')} />
                    <QuickAction icon={Handshake} label="Add Loan" color="gold" onClick={() => setActiveModal('loan')} />
                    <QuickAction icon={BarChart3} label="View Reports" color="indigo" onClick={() => setActiveTab('reports')} />
                    <QuickAction icon={Download} label="Export PDF" color="amber" onClick={() => handleExportPDF()} />
                  </div>
                </section>

                {/* Alert Banner */}
                <AnimatePresence>
                  {showAlert && (
                    <motion.div 
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -50, opacity: 0 }}
                      className="bg-rose-500/10 border-2 border-rose-500/20 p-5 rounded-3xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-rose-500 p-2 rounded-xl text-white animate-pulse">
                          <AlertTriangle size={20} />
                        </div>
                        <p className="text-rose-500 font-black text-sm md:text-base">
                          ⚠ Budget Alert: You've exceeded your monthly budget by <span className="underline decoration-2 underline-offset-4">PKR 4,200</span>.
                        </p>
                      </div>
                      <button onClick={() => setShowAlert(false)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dynamic Insights */}
                <section className="space-y-6">
                  <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                    <Sparkles size={24} className="text-gold" />
                    Smart Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {smartInsights.map((insight, idx) => (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.03 }}
                        className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className={cn("w-2 h-2 rounded-full animate-ping", insight.color)} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", insight.urgency === 'critical' ? 'text-red-600' : insight.urgency === 'high' ? 'text-rose-500' : 'text-emerald-500')}>
                              {insight.urgency} priority
                            </span>
                          </div>
                          <h4 className="text-lg font-black mb-2">{insight.title}</h4>
                          <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{insight.text}</p>
                        </div>
                        <button 
                          onClick={insight.action}
                          className="mt-6 text-xs font-black uppercase tracking-widest text-gold flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Take Action <ChevronRight size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Charts Row */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                      <BarChart3 size={20} className="text-gold" />
                      Expense Distribution
                    </h3>
                    <div className="h-80">
                      {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={summary.categoryBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="amount"
                              nameKey="category"
                              stroke="none"
                            >
                              {summary.categoryBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#f0b429', '#4f46e5', '#10b981', '#ec4899', '#f43f5e', '#8b5cf6'][index % 6]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[var(--text-muted)] font-bold">No expense data yet</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                      <TrendingUp size={20} className="text-indigo-500" />
                      Income vs Expenses
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incomeVsExpenseData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                          <Tooltip 
                            cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                            content={<CustomTooltip />}
                          />
                          <Bar dataKey="income" fill="#f0b429" radius={[6, 6, 0, 0]} barSize={20} />
                          <Bar dataKey="expenses" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

              {/* Expense Tracker Table */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                    <Receipt size={24} className="text-indigo-500" />
                    Recent Transactions
                  </h3>
                  <button onClick={() => setActiveTab('expenses')} className="text-sm font-bold text-gold hover:underline">View All History</button>
                </div>
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg-base)] border-b border-[var(--border-color)]">
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Date</th>
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Description</th>
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Category</th>
                          <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {expenses.slice(0, 5).map((exp) => (
                          <tr key={exp.id} className="hover:bg-[var(--bg-base)] transition-colors group cursor-pointer">
                            <td className="px-8 py-5 text-sm font-bold text-[var(--text-muted)]">{formatDate(exp.date)}</td>
                            <td className="px-8 py-5 text-sm font-black text-[var(--text-main)]">{exp.note || 'Untitled Expense'}</td>
                            <td className="px-8 py-5">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                exp.category === 'Food' ? 'bg-gold/10 text-gold' : 
                                exp.category === 'Transport' ? 'bg-indigo-500/10 text-indigo-500' :
                                exp.category === 'Utilities' ? 'bg-emerald-500/10 text-emerald-500' :
                                'bg-slate-500/10 text-slate-500'
                              )}>
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-sm font-black text-[var(--text-main)] text-right font-mono-numbers">
                              <div className="flex items-center justify-end gap-4">
                                <span>{formatCurrency(exp.amount)}</span>
                                <button onClick={() => deleteExpense(exp.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {expenses.length === 0 && (
                          <tr><td colSpan={4} className="px-8 py-10 text-center text-[var(--text-muted)] font-bold">No transactions found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Udhar Tracker */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                    <Handshake size={24} className="text-gold" />
                    Udhar (Loan) Tracker
                  </h3>
                  <button onClick={() => setActiveTab('loans')} className="text-sm font-bold text-gold hover:underline">Manage Loans</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loans.slice(0, 3).map((loan) => (
                    <motion.div 
                      key={loan.id}
                      whileHover={{ y: -10 }}
                      className={cn(
                        "bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm relative overflow-hidden",
                        loan.status === 'overdue' && "ring-2 ring-rose-500 ring-offset-4 dark:ring-offset-[#0f1117] shadow-[0_0_30px_-10px_rgba(244,63,94,0.5)]"
                      )}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-black mb-1">{loan.vendorName}</h4>
                          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Due: {formatDate(loan.dueDate)}</p>
                          {loan.item && <p className="text-[10px] font-medium text-gold">Item: {loan.item}</p>}
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          loan.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                          loan.status === 'overdue' ? 'bg-rose-500 text-white' :
                          'bg-gold/10 text-gold'
                        )}>
                          {loan.status}
                        </span>
                      </div>
                      <div className="mb-6">
                        <p className="text-3xl font-black mb-4 font-mono-numbers">{formatCurrency(loan.amount)}</p>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                          <span>Repayment Progress</span>
                          <span>{loan.status === 'paid' ? 100 : 0}%</span>
                        </div>
                        <div className="w-full bg-[var(--bg-base)] h-2 rounded-full overflow-hidden">
                          <div className={cn("h-full progress-fill", loan.status === 'overdue' ? 'bg-rose-500' : 'bg-gold')} style={{ width: loan.status === 'paid' ? '100%' : '0%' }} />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {loan.status === 'pending' && (
                          <button 
                            onClick={() => settleLoan(loan.id)}
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm shadow-emerald-500/10"
                            title="Settle Loan"
                          >
                            <CheckCircle2 size={18} strokeWidth={3} />
                          </button>
                        )}
                        <button onClick={() => deleteLoan(loan.id)} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

            {activeTab === 'expenses' && (
              <motion.div 
                key="expenses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">Expense Management</h2>
                  <button onClick={() => setActiveModal('expense')} className="bg-rose-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-rose-500/20 hover:scale-105 transition-all">
                    <Plus size={20} /> Add Expense
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-xl font-black mb-8">Daily Spending (Last 7 Days)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summary?.categoryBreakdown?.map(c => ({ day: c.category, amount: c.amount })) || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                          <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                          <Bar dataKey="amount" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={30} name="Amount" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-xl font-black mb-8">Category Breakdown</h3>
                    <div className="h-64">
                      {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={summary.categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="amount" nameKey="category" stroke="none">
                              {summary.categoryBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[var(--text-muted)] font-bold">No expense data yet</div>
                      )}
                    </div>
                  </div>
                </div>

                <section className="space-y-6">
                  <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[var(--bg-base)] border-b border-[var(--border-color)]">
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Date</th>
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Description</th>
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Category</th>
                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-[var(--bg-base)] transition-colors group cursor-pointer">
                              <td className="px-8 py-5 text-sm font-bold text-[var(--text-muted)]">{formatDate(exp.date)}</td>
                              <td className="px-8 py-5 text-sm font-black text-[var(--text-main)]">{exp.note || 'Untitled Expense'}</td>
                              <td className="px-8 py-5">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  exp.category === 'Food' ? 'bg-gold/10 text-gold' : 
                                  exp.category === 'Transport' ? 'bg-indigo-500/10 text-indigo-500' :
                                  exp.category === 'Utilities' ? 'bg-emerald-500/10 text-emerald-500' :
                                  'bg-slate-500/10 text-slate-500'
                                )}>
                                  {exp.category}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-sm font-black text-[var(--text-main)] text-right font-mono-numbers">
                                <div className="flex items-center justify-end gap-4">
                                  <span>{formatCurrency(exp.amount)}</span>
                                  <button onClick={(e) => { e.stopPropagation(); deleteExpense(exp.id); }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {expenses.length === 0 && (
                            <tr><td colSpan={4} className="px-8 py-20 text-center text-[var(--text-muted)] font-black">No expenses found. Start tracking today!</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'loans' && (
              <motion.div 
                key="loans"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">Udhar Tracker</h2>
                  <button onClick={() => setActiveModal('loan')} className="bg-gold text-slate-900 px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-gold/20 hover:scale-105 transition-all">
                    <Plus size={20} /> Add New Loan
                  </button>
                </div>

                <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                  <h3 className="text-xl font-black mb-8">Repayment Timeline</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={loans.filter(l => l.status === 'paid').map(l => ({ vendor: l.vendorName, paid: l.amount }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="vendor" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                        <Bar dataKey="paid" fill="#f0b429" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loans.map((loan) => (
                    <motion.div 
                      key={loan.id}
                      whileHover={{ y: -10 }}
                      className={cn(
                        "bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm relative overflow-hidden",
                        loan.status === 'overdue' && "ring-2 ring-rose-500 ring-offset-4 dark:ring-offset-[#0f1117] shadow-[0_0_30px_-10px_rgba(244,63,94,0.5)]"
                      )}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-black mb-1">{loan.vendorName}</h4>
                          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Due: {formatDate(loan.dueDate)}</p>
                          {loan.item && <p className="text-[10px] font-medium text-gold">Item: {loan.item}</p>}
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          loan.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                          loan.status === 'overdue' ? 'bg-rose-500 text-white' :
                          'bg-gold/10 text-gold'
                        )}>
                          {loan.status}
                        </span>
                      </div>
                      <div className="mb-6">
                        <p className="text-3xl font-black mb-4 font-mono-numbers">{formatCurrency(loan.amount)}</p>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                          <span>Repayment Progress</span>
                          <span>{loan.status === 'paid' ? 100 : 0}%</span>
                        </div>
                        <div className="w-full bg-[var(--bg-base)] h-2 rounded-full overflow-hidden">
                          <div className={cn("h-full progress-fill", loan.status === 'overdue' ? 'bg-rose-500' : 'bg-gold')} style={{ width: loan.status === 'paid' ? '100%' : '0%' }} />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {loan.status === 'pending' && (
                          <button 
                            onClick={() => settleLoan(loan.id)}
                            className="flex-1 py-3 rounded-2xl bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            Settle Loan
                          </button>
                        )}
                        <button onClick={() => deleteLoan(loan.id)} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'income' && (
              <motion.div 
                key="income"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">Income Streams</h2>
                  <button onClick={() => setActiveModal('income')} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">
                    <Plus size={20} /> Add Income Source
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {income.map((stream) => (
                    <div key={stream.id} className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                      <div>
                        <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{stream.source}</p>
                        <h4 className="text-2xl font-black font-mono-numbers">{formatCurrency(stream.amount)}</h4>
                        <button onClick={() => deleteIncome(stream.id)} className="mt-2 text-rose-500 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
                        <ArrowUpRight size={24} />
                      </div>
                    </div>
                  ))}
                  {income.length === 0 && (
                    <div className="col-span-full py-10 text-center text-[var(--text-muted)] font-bold">No income records found</div>
                  )}
                </div>

                <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                  <h3 className="text-xl font-black mb-8">Monthly Income Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeVsExpenseData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                        <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">Financial Reports</h2>
                  <button 
                    onClick={(e) => { createRipple(e); handleExportPDF(); }}
                    className="bg-gold text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-gold/20 hover:scale-105 transition-all ripple"
                  >
                    <Download size={20} strokeWidth={3} /> Export PDF Report
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-xl font-black mb-8">Income vs Expenses (6 Months)</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incomeVsExpenseData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                          <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                          <Bar dataKey="income" fill="#f0b429" radius={[6, 6, 0, 0]} barSize={20} />
                          <Bar dataKey="expenses" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                    <h3 className="text-xl font-black mb-8">Expense Breakdown</h3>
                    <div className="h-80">
                      {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={summary.categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="amount" nameKey="category" stroke="none">
                              {summary.categoryBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={['#f0b429', '#4f46e5', '#10b981', '#ec4899', '#f43f5e', '#8b5cf6'][index % 6]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[var(--text-muted)] font-bold">No data to breakdown</div>
                      )}
                    </div>
                  </div>
                </div>

                <section className="space-y-6">
                  <h3 className="text-2xl font-black flex items-center gap-2"><Clock size={24} className="text-gold" /> Recent Activity</h3>
                  <div className="space-y-4">
                    {expenses.slice(0, 3).map((exp) => (
                      <div key={exp.id} className="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border-color)] shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center"><Receipt size={18} /></div>
                        <div className="flex-1"><div className="font-black text-sm">{exp.note || 'Expense'}: {formatCurrency(exp.amount)}</div><time className="text-[10px] font-bold text-[var(--text-muted)]">{formatDate(exp.date)}</time></div>
                      </div>
                    ))}
                    {income.slice(0, 2).map((inc) => (
                      <div key={inc.id} className="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border-color)] shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><ArrowUpRight size={18} /></div>
                        <div className="flex-1"><div className="font-black text-sm">Income from {inc.source}: {formatCurrency(inc.amount)}</div><time className="text-[10px] font-bold text-[var(--text-muted)]">{formatDate(inc.date)}</time></div>
                      </div>
                    ))}
                    {expenses.length === 0 && income.length === 0 && (
                      <div className="py-10 text-center text-[var(--text-muted)] font-bold">No activity yet. Start adding transactions!</div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="p-10 text-center border-t border-[var(--border-color)]">
          <p className="text-[var(--text-muted)] text-sm font-bold">© 2026 FinX. Built for the next generation of Pakistani professionals.</p>
        </footer>
      </main>

      {/* AI Advisor Floating Button & Panel */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isAiOpen && (
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-[380px] max-w-[90vw] h-[600px] max-h-[85vh] bg-[var(--bg-card)] border-2 border-gold rounded-[3rem] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center text-slate-900">
                    <BrainCircuit size={18} />
                  </div>
                  <span className="text-sm font-black text-[var(--text-main)]">FinX Advisor</span>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-[var(--text-muted)] hover:text-rose-500">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {aiChat.map((msg, i) => (
                  <div key={i} className={cn(
                    "p-5 rounded-3xl border shadow-sm",
                    msg.role === 'user' ? "bg-gold text-slate-900 border-gold/20 ml-12 rounded-tr-none" : "bg-[var(--bg-base)] border-[var(--border-color)] mr-12 rounded-tl-none"
                  )}>
                    <div className={cn(
                      "text-sm leading-relaxed prose-advisor",
                      msg.role === 'user' ? "text-slate-900" : "text-[var(--text-main)]"
                    )}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="bg-[var(--bg-base)] p-4 rounded-2xl rounded-tl-none border border-[var(--border-color)] mr-8 animate-pulse">
                    <p className="text-xs font-medium italic">Thinking...</p>
                  </div>
                )}
              </div>
              <form onSubmit={handleAiChat} className="mt-3 flex gap-2">
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask me anything..." 
                  className="flex-1 bg-[var(--bg-base)] border-none rounded-xl px-4 py-2 text-xs font-medium outline-none" 
                />
                <button type="submit" disabled={isAiLoading} className="bg-gold text-slate-900 p-2 rounded-xl disabled:opacity-50">
                  <ArrowUpRight size={16} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="w-16 h-16 bg-gold text-slate-900 rounded-full flex items-center justify-center shadow-2xl shadow-gold/40 hover:scale-110 active:scale-95 transition-all group"
        >
          {isAiOpen ? <X size={28} strokeWidth={3} /> : <BrainCircuit size={28} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />}
          {!isAiOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-[var(--bg-base)] rounded-full flex items-center justify-center">
              <Sparkles size={10} className="text-white fill-white" />
            </span>
          )}
        </button>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'expense'} 
        onClose={() => setActiveModal(null)} 
        title="Add New Expense"
      >
        <form className="space-y-6" onSubmit={handleExpenseSubmit}>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Description</label>
            <input name="description" type="text" placeholder="e.g. Lunch at Savour" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Amount (PKR)</label>
              <input name="amount" type="number" placeholder="0" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all" required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Category</label>
              <select name="category" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all appearance-none">
                <option>Food</option>
                <option>Transport</option>
                <option>Utilities</option>
                <option>Entertainment</option>
                <option>Health</option>
                <option>Education</option>
                <option>Shopping</option>
                <option>Medical</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-gold text-slate-900 py-4 rounded-2xl font-black shadow-xl shadow-gold/20 hover:scale-[1.02] transition-all">
            Save Expense
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={activeModal === 'income'} 
        onClose={() => setActiveModal(null)} 
        title="Add New Income"
      >
        <form className="space-y-6" onSubmit={handleIncomeSubmit}>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Source</label>
            <input name="source" type="text" placeholder="e.g. Freelance Project" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all" required />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Amount (PKR)</label>
            <input name="amount" type="number" placeholder="0" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all" required />
          </div>
          <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all">
            Save Income
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={activeModal === 'loan'} 
        onClose={() => setActiveModal(null)} 
        title="Add New Loan (Udhar)"
      >
        <form className="space-y-6" onSubmit={handleLoanSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Person / Vendor</label>
              <input name="vendorName" type="text" placeholder="e.g. Ali Ahmed" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all" required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Item / Description</label>
              <input name="item" type="text" placeholder="e.g. Bike Repair" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Amount (PKR)</label>
              <input name="amount" type="number" placeholder="0" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all" required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Due Date</label>
              <input name="dueDate" type="date" className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-5 py-4 mt-2 font-bold outline-none focus:border-gold transition-all" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-gold text-slate-900 py-4 rounded-2xl font-black shadow-xl shadow-gold/20 hover:scale-[1.02] transition-all">
            Save Loan
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'saving'} onClose={() => setActiveModal(null)} title="Add Saving">
        <form onSubmit={handleSavingSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Savings Amount (PKR)</label>
            <input 
              name="amount" 
              type="number" 
              required 
              placeholder="e.g. 5000"
              className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-gold transition-colors" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Note (Optional)</label>
            <input 
              name="description" 
              type="text" 
              placeholder="Monthly savings, emergency fund..."
              className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-2xl px-6 py-4 font-bold outline-none focus:border-gold transition-colors" 
            />
          </div>
          <button type="submit" className="w-full bg-gold text-slate-900 py-4 rounded-2xl font-black shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Save Amount
          </button>
        </form>
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-sm backdrop-blur-md",
              toast.type === 'error' ? "bg-rose-500 text-white" : "bg-slate-900 text-white dark:bg-gold dark:text-slate-900"
            )}
          >
            {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
