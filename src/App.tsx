/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Zap, 
  Coffee, 
  Clock, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  Leaf,
  X,
  Activity,
  Target,
  Download,
  Heart,
  Star,
  Timer,
  BarChart3,
  Flame,
  Droplets,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Info,
  ArrowRight,
  RefreshCw,
  Calendar,
  PieChart,
  Gauge,
  Bell,
  BellOff,
  Check,
  Copy,
  Share2,
  Settings,
  Home,
  List,
  PlusCircle,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area,
  PieChart as RechartsPie,
  Pie,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { INDIAN_DRINKS, Drink } from './data/drinks';
import { 
  LogEntry, 
  getLogs, 
  saveLog, 
  deleteLog, 
  getDailyTotal, 
  getWeeklyData,
  getMonthlyData,
  getStats,
  getStreak,
  estimateCaffeineRemaining,
  getCaffeineTimeline,
  getPreferences,
  savePreferences,
  toggleFavorite,
  downloadCSV,
  UserPreferences,
} from './utils/storage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIES = ['All', 'Energy', 'Soft Drink', 'Coffee', 'Tea', 'Other'] as const;
type Category = typeof CATEGORIES[number];

type Tab = 'track' | 'stats' | 'goals' | 'settings';

// ============ RING PROGRESS COMPONENT ============
function RingProgress({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8,
  color = '#E1FC6F',
  bgColor = '#222222',
  children 
}: { 
  value: number; 
  max: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="ring-progress" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// ============ STAT CARD COMPONENT ============
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color = 'text-accent',
  bgColor = 'bg-accent/10',
}: { 
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  bgColor?: string;
}) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="glass-card rounded-2xl p-5 stat-card-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500 mb-1">{label}</p>
      <p className={cn("text-2xl font-black", color)}>{value}</p>
      {subValue && <p className="text-[10px] text-zinc-600 mt-1">{subValue}</p>}
    </motion.div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('track');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [customAmount, setCustomAmount] = useState(250);
  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences());
  const [streak, setStreak] = useState(0);
  const [caffeineRemaining, setCaffeineRemaining] = useState(0);
  const [caffeineTimeline, setCaffeineTimeline] = useState<{ time: string; caffeine: number }[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [showDrinkInfo, setShowDrinkInfo] = useState<Drink | null>(null);

  // Custom drink form state
  const [customName, setCustomName] = useState('');
  const [customCaffeinePer100, setCustomCaffeinePer100] = useState<number>(0);

  // Undo state
  const [undoAction, setUndoAction] = useState<{
    type: 'ADD' | 'DELETE';
    entry: LogEntry;
  } | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (undoAction) {
      timeout = setTimeout(() => {
        setUndoAction(null);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [undoAction]);

  const refreshData = useCallback(() => {
    setLogs(getLogs());
    setDailyTotal(getDailyTotal());
    setWeeklyData(getWeeklyData());
    setMonthlyData(getMonthlyData());
    setStreak(getStreak());
    setCaffeineRemaining(estimateCaffeineRemaining());
    setCaffeineTimeline(getCaffeineTimeline());
    setStats(getStats());
    setPreferences(getPreferences());
  }, []);

  const filteredDrinks = useMemo(() => {
    return INDIAN_DRINKS.filter(drink => {
      const matchesSearch = drink.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             drink.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || drink.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const favoriteDrinks = useMemo(() => {
    return INDIAN_DRINKS.filter(d => preferences.favorites.includes(d.id));
  }, [preferences.favorites]);

  const handleAddLog = (drink: Drink, amount: number) => {
    const caffeine = Math.round((drink.caffeinePer100ml / 100) * amount);
    const id = Math.random().toString(36).substring(7);
    const entry: LogEntry = {
      id,
      drinkId: drink.id,
      name: drink.name,
      category: drink.category,
      amount,
      caffeine,
      timestamp: Date.now(),
    };
    saveLog(entry);
    refreshData();
    setSelectedDrink(null);
    setSearchQuery('');
    setCustomAmount(250);
    setUndoAction({ type: 'ADD', entry });
  };

  const handleAddCustom = () => {
    if (!customName || customCaffeinePer100 < 0) return;
    const caffeine = Math.round((customCaffeinePer100 / 100) * customAmount);
    const id = Math.random().toString(36).substring(7);
    const entry: LogEntry = {
      id,
      drinkId: 'custom',
      name: customName,
      category: 'Other',
      amount: customAmount,
      caffeine,
      timestamp: Date.now(),
    };
    saveLog(entry);
    refreshData();
    setIsAddingCustom(false);
    setCustomName('');
    setCustomCaffeinePer100(0);
    setUndoAction({ type: 'ADD', entry });
  };

  const handleDeleteLog = (id: string) => {
    const logToDelete = logs.find(l => l.id === id);
    if (logToDelete) {
      deleteLog(id);
      refreshData();
      setUndoAction({ type: 'DELETE', entry: logToDelete });
    }
  };

  const handleUndo = () => {
    if (!undoAction) return;

    if (undoAction.type === 'ADD') {
      deleteLog(undoAction.entry.id);
    } else {
      saveLog(undoAction.entry);
    }
    
    refreshData();
    setUndoAction(null);
  };

  const handleToggleFavorite = (drinkId: string) => {
    const newFavs = toggleFavorite(drinkId);
    setPreferences(prev => ({ ...prev, favorites: newFavs }));
  };

  const handleExport = () => {
    downloadCSV();
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  const handleUpdateGoal = (target: number) => {
    const newPrefs = { ...preferences, dailyGoal: { ...preferences.dailyGoal, target } };
    savePreferences(newPrefs);
    setPreferences(newPrefs);
  };

  const safetyColor = dailyTotal > preferences.dailyGoal.target 
    ? 'text-red-500' 
    : dailyTotal > preferences.dailyGoal.target * 0.75 
      ? 'text-orange-500' 
      : 'text-accent';
  
  const safetyPercentage = Math.min((dailyTotal / preferences.dailyGoal.target) * 100, 100);

  const lastDrink = logs[0];

  const goalTarget = preferences.dailyGoal.target;

  // ============ RENDER TRACK TAB ============
  const renderTrackTab = () => (
    <>
      {/* SIDEBAR LEFT: Drink Selection */}
      <aside className="bg-zinc-950 p-6 flex flex-col gap-5 overflow-auto scrollbar-hide no-scrollbar">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input 
            type="text" 
            placeholder="Search drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-accent outline-none"
          />
        </div>

        {/* Quick Add Favorites */}
        {favoriteDrinks.length > 0 && !searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3 h-3 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500">Quick Add</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {favoriteDrinks.map(drink => (
                <button
                  key={drink.id}
                  onClick={() => setSelectedDrink(drink)}
                  className="flex-shrink-0 bg-zinc-900 border border-zinc-800 hover:border-accent/50 rounded-xl px-4 py-3 text-center transition-all"
                >
                  <p className="text-xs font-black whitespace-nowrap">{drink.name}</p>
                  <p className="text-[9px] text-zinc-600">{drink.defaultSize}ml</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                selectedCategory === cat 
                  ? "bg-accent text-black border-accent" 
                  : "bg-zinc-900 text-zinc-400 border-transparent hover:border-zinc-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Drink List */}
        <div className="flex-1 space-y-2 overflow-auto no-scrollbar">
          {filteredDrinks.map(drink => {
            const isFav = preferences.favorites.includes(drink.id);
            return (
              <motion.button
                key={drink.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDrink(drink)}
                className="w-full bg-zinc-900 p-4 rounded-xl flex items-center justify-between group hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
              >
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black tracking-tight truncate">{drink.name}</h4>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(drink.id); }}
                      className="flex-shrink-0"
                    >
                      <Heart className={cn("w-3 h-3 transition-colors", isFav ? "text-accent fill-accent" : "text-zinc-700")} />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{drink.defaultSize}ml • {drink.brand}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                      {drink.caffeinePer100ml}mg/100ml
                    </span>
                    {drink.caffeinePer100ml > 100 && (
                      <span className="text-[9px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                        High
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-accent group-hover:text-black flex items-center justify-center text-zinc-400 font-black transition-colors flex-shrink-0 ml-2">
                  +
                </div>
              </motion.button>
            );
          })}
          {filteredDrinks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-600 text-sm">No drinks found</p>
              <button 
                onClick={() => setIsAddingCustom(true)}
                className="text-accent text-xs font-bold mt-2 hover:underline"
              >
                Add custom drink
              </button>
            </div>
          )}
        </div>

        {/* Bottom Stats */}
        <div className="mt-auto pt-4 border-t border-zinc-800 space-y-3">
          <div className="p-4 bg-zinc-900 rounded-xl border border-dashed border-zinc-700">
            <span className="text-[10px] text-accent font-black uppercase tracking-widest block mb-1">Active Caffeine</span>
            <div className="text-xl font-black">
              {caffeineRemaining} <span className="text-[10px] opacity-50">mg in system</span>
            </div>
            <p className="text-[9px] text-zinc-600 mt-1 uppercase font-bold tracking-tight">Based on 5hr half-life</p>
          </div>
          
          {streak > 0 && (
            <div className="p-3 bg-zinc-900 rounded-xl flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs font-black">{streak} day streak!</p>
                <p className="text-[9px] text-zinc-600">Keep tracking daily</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* CENTER VIEW: Main Statistics */}
      <main className="bg-zinc-950 p-8 lg:p-12 flex flex-col items-center justify-center relative gradient-mesh">
        {/* Ring Progress */}
        <div className="relative mb-6">
          <RingProgress 
            value={dailyTotal} 
            max={goalTarget} 
            size={220} 
            strokeWidth={10}
            color={dailyTotal > goalTarget ? '#ef4444' : dailyTotal > goalTarget * 0.75 ? '#f97316' : '#E1FC6F'}
          >
            <div className="text-center">
              <motion.div 
                key={dailyTotal}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn("text-5xl lg:text-6xl font-black", safetyColor)}
              >
                {dailyTotal}
              </motion.div>
              <p className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500 mt-1">mg today</p>
            </div>
          </RingProgress>
        </div>

        {/* Status Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[2px] transition-colors",
            dailyTotal > goalTarget 
              ? "bg-red-500/10 border-red-500 text-red-500 glow-danger" 
              : dailyTotal > goalTarget * 0.75 
                ? "bg-orange-500/10 border-orange-500 text-orange-500"
                : "bg-accent/10 border-accent text-accent glow-accent"
          )}
        >
          {dailyTotal > goalTarget ? "⚠ Goal Exceeded" : dailyTotal > goalTarget * 0.75 ? "Approaching Limit" : "✓ On Track"}
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-md">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-[2px] text-zinc-600 mb-1">Goal</p>
            <p className="text-lg font-black text-zinc-300">{goalTarget}<span className="text-[10px] text-zinc-600">mg</span></p>
          </div>
          <div className="text-center border-x border-zinc-800">
            <p className="text-[9px] font-black uppercase tracking-[2px] text-zinc-600 mb-1">Remaining</p>
            <p className={cn("text-lg font-black", dailyTotal > goalTarget ? "text-red-500" : "text-accent")}>
              {Math.max(0, goalTarget - dailyTotal)}<span className="text-[10px] text-zinc-600">mg</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-[2px] text-zinc-600 mb-1">Drinks</p>
            <p className="text-lg font-black text-zinc-300">{logs.filter(l => {
              const today = new Date(); today.setHours(0,0,0,0);
              return l.timestamp >= today.getTime();
            }).length}</p>
          </div>
        </div>

        {/* Caffeine Timeline Toggle */}
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[2px] text-zinc-500 hover:text-accent transition-colors"
        >
          <Timer className="w-3 h-3" />
          Caffeine Decay Timeline
          {showTimeline ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <AnimatePresence>
          {showTimeline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-md overflow-hidden mt-4"
            >
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={caffeineTimeline}>
                    <defs>
                      <linearGradient id="caffeineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E1FC6F" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E1FC6F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="caffeine" stroke="#E1FC6F" fill="url(#caffeineGrad)" strokeWidth={2} />
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#666' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#161616', border: '1px solid #333', borderRadius: '12px', fontSize: '11px' }}
                      labelStyle={{ color: '#999' }}
                      formatter={(value: number) => [`${value}mg`, 'Caffeine']}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-zinc-600 text-center mt-2">Estimated caffeine levels over next 12 hours</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer status line (Desktop only) */}
        <div className="hidden lg:flex absolute bottom-8 left-8 right-8 justify-between border-t border-zinc-800 pt-6">
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px] mb-1">Last Drink</p>
            <p className="font-black text-sm">{lastDrink ? `${lastDrink.name} (${new Date(lastDrink.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : 'No drinks logged'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px] mb-1">In Your System</p>
            <p className="font-black text-sm text-accent">{caffeineRemaining}mg active</p>
          </div>
        </div>
      </main>

      {/* SIDEBAR RIGHT: Trends & History */}
      <aside className="bg-zinc-950 p-6 border-l border-zinc-800 flex flex-col gap-6 overflow-auto no-scrollbar">
        {/* 7-Day Chart */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">7-Day Trend</h3>
            <span className="text-[9px] text-zinc-600">avg: {stats?.avgDaily || 0}mg</span>
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <Bar dataKey="caffeine" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.caffeine > goalTarget ? '#ef4444' : (index === 6 ? '#E1FC6F' : '#333')} />
                  ))}
                </Bar>
                <XAxis dataKey="date" hide />
                <Tooltip 
                  contentStyle={{ background: '#161616', border: '1px solid #333', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(value: number) => [`${value}mg`, 'Caffeine']}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-2 px-1">
            {weeklyData.map(d => (
              <span key={d.date} className="text-[9px] font-black text-zinc-600 uppercase">{d.date}</span>
            ))}
          </div>
        </section>

        {/* Recent Logs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">Recent Activity</h3>
            <span className="text-[9px] text-zinc-600">{logs.length} total</span>
          </div>
          <div className="space-y-2">
            {logs.slice(0, 6).map(log => (
              <motion.div 
                key={log.id} 
                layout
                className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl group hover:bg-zinc-800 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-300 truncate">{log.name}</p>
                  <p className="text-[9px] text-zinc-600">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.amount}ml
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-accent text-sm">{log.caffeine}mg</span>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-6">
                <Coffee className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p className="text-[10px] italic text-zinc-600">No drinks logged yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Safety Alert */}
        {dailyTotal > goalTarget * 0.75 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "mt-auto p-4 rounded-2xl border",
              dailyTotal > goalTarget 
                ? "bg-red-500/10 border-red-500" 
                : "bg-orange-500/10 border-orange-500"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={cn("w-4 h-4", dailyTotal > goalTarget ? "text-red-500" : "text-orange-500")} />
              <h4 className={cn("text-[10px] font-black uppercase tracking-[2px]", dailyTotal > goalTarget ? "text-red-500" : "text-orange-500")}>
                {dailyTotal > goalTarget ? "Limit Exceeded" : "Safety Alert"}
              </h4>
            </div>
            <p className="text-[11px] leading-tight text-red-200/70 font-medium">
              {dailyTotal > goalTarget 
                ? `You've exceeded your ${goalTarget}mg daily goal. Consider switching to decaf.`
                : `Approaching your ${goalTarget}mg limit. Consider caffeine-free alternatives.`
              }
            </p>
          </motion.div>
        )}
      </aside>
    </>
  );

  // ============ RENDER STATS TAB ============
  const renderStatsTab = () => (
    <div className="col-span-3 bg-zinc-950 p-6 lg:p-10 overflow-auto no-scrollbar">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Analytics</h2>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[3px] mt-1">Your caffeine insights</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-accent/50 rounded-xl px-4 py-3 text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Coffee} 
            label="Total Drinks" 
            value={stats?.totalLogs || 0}
            subValue="All time"
          />
          <StatCard 
            icon={Zap} 
            label="Total Caffeine" 
            value={`${stats?.totalCaffeine || 0}mg`}
            subValue="All time"
            color="text-orange-500"
            bgColor="bg-orange-500/10"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Daily Average" 
            value={`${stats?.avgDaily || 0}mg`}
            subValue="Last 7 days"
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
          <StatCard 
            icon={Flame} 
            label="Current Streak" 
            value={`${streak} days`}
            subValue="Keep it up!"
            color="text-orange-500"
            bgColor="bg-orange-500/10"
          />
        </div>

        {/* Top Drink & Peak Hour */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stats?.topDrink && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-accent" />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">Most Consumed</h3>
              </div>
              <p className="text-2xl font-black">{stats.topDrink.name}</p>
              <p className="text-sm text-zinc-500 mt-1">{stats.topDrink.count} times • {stats.topDrink.total}mg total</p>
            </div>
          )}
          {stats?.peakHour && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-blue-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">Peak Hour</h3>
              </div>
              <p className="text-2xl font-black">{stats.peakHour.hour}:00</p>
              <p className="text-sm text-zinc-500 mt-1">{stats.peakHour.total}mg consumed at this hour</p>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        {stats?.categoryTotals && Object.keys(stats.categoryTotals).length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-4 h-4 text-purple-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">Category Breakdown</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.categoryTotals)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([cat, total]) => {
                  const maxTotal = Math.max(...Object.values(stats.categoryTotals).map(Number));
                  const percentage = ((total as number) / maxTotal) * 100;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold">{cat}</span>
                        <span className="text-xs font-black text-accent">{total as number}mg</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-accent rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Monthly Chart */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-4 h-4 text-green-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">30-Day Overview</h3>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E1FC6F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E1FC6F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="caffeine" stroke="#E1FC6F" fill="url(#monthlyGrad)" strokeWidth={2} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#666' }} axisLine={false} tickLine={false} interval={4} />
                <Tooltip 
                  contentStyle={{ background: '#161616', border: '1px solid #333', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(value: number) => [`${value}mg`, 'Caffeine']}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  // ============ RENDER GOALS TAB ============
  const renderGoalsTab = () => (
    <div className="col-span-3 bg-zinc-950 p-6 lg:p-10 overflow-auto no-scrollbar">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Daily Goals</h2>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[3px] mt-1">Set your caffeine targets</p>
        </div>

        {/* Goal Ring */}
        <div className="flex flex-col items-center py-8">
          <RingProgress 
            value={dailyTotal} 
            max={goalTarget} 
            size={200} 
            strokeWidth={12}
            color={dailyTotal > goalTarget ? '#ef4444' : '#E1FC6F'}
          >
            <div className="text-center">
              <p className="text-4xl font-black">{Math.round(safetyPercentage)}%</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">of goal</p>
            </div>
          </RingProgress>
          <p className="text-sm text-zinc-400 mt-4">
            <span className="font-black text-white">{dailyTotal}mg</span> of {goalTarget}mg goal
          </p>
        </div>

        {/* Goal Presets */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">Set Daily Limit</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[200, 300, 400, 500].map(target => (
              <button
                key={target}
                onClick={() => handleUpdateGoal(target)}
                className={cn(
                  "py-4 rounded-xl text-center border transition-all",
                  goalTarget === target 
                    ? "bg-accent text-black border-accent font-black" 
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 font-bold"
                )}
              >
                <p className="text-xl">{target}</p>
                <p className="text-[9px] uppercase tracking-widest mt-1">mg / day</p>
              </button>
            ))}
          </div>
          
          {/* Custom Goal */}
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500">Custom:</label>
            <input 
              type="number" 
              value={goalTarget}
              onChange={(e) => handleUpdateGoal(parseInt(e.target.value) || 400)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 font-black text-accent outline-none focus:border-accent text-sm"
            />
            <span className="text-[10px] text-zinc-600 font-bold">mg/day</span>
          </div>
        </div>

        {/* Health Tips */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">Health Tips</h3>
          </div>
          <div className="space-y-3">
            {[
              { icon: Sun, tip: "Stop caffeine by 2 PM for better sleep quality", color: "text-yellow-500" },
              { icon: Droplets, tip: "Drink water between caffeinated beverages", color: "text-blue-500" },
              { icon: Leaf, tip: "Green tea has L-theanine for calm alertness", color: "text-green-500" },
              { icon: Clock, tip: "Caffeine half-life is ~5 hours in most adults", color: "text-purple-500" },
              { icon: Heart, tip: "Pregnant women should limit to 200mg/day", color: "text-pink-500" },
            ].map(({ icon: TipIcon, tip, color }, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-zinc-900 rounded-xl">
                <TipIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", color)} />
                <p className="text-xs text-zinc-300">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ============ RENDER SETTINGS TAB ============
  const renderSettingsTab = () => (
    <div className="col-span-3 bg-zinc-950 p-6 lg:p-10 overflow-auto no-scrollbar">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Settings</h2>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[3px] mt-1">Manage your data</p>
        </div>

        {/* Data Management */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">Data Management</h3>
          
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-all border border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-accent" />
              <div className="text-left">
                <p className="text-sm font-bold">Export Data</p>
                <p className="text-[10px] text-zinc-500">Download all logs as CSV</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure? This will delete all your caffeine logs.')) {
                localStorage.removeItem('caffeine_tracker_logs');
                refreshData();
              }
            }}
            className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-xl hover:bg-red-500/10 transition-all border border-zinc-800 hover:border-red-500/50"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="text-sm font-bold text-red-400">Clear All Data</p>
                <p className="text-[10px] text-zinc-500">Permanently delete all logs</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </button>
        </div>

        {/* About */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">About</h3>
          <div className="space-y-2">
            <p className="text-sm text-zinc-300">Caffeine.Pro — India Edition</p>
            <p className="text-[10px] text-zinc-600">Track your daily caffeine intake with an extensive database of Indian beverages. Made with ❤️ by Pramod Jadhav.</p>
            <p className="text-[10px] text-zinc-700 mt-4">Version 2.0 • Built with React + Tailwind</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-accent selection:text-black lg:h-screen lg:overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-6 lg:px-10 py-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase leading-none">
              Caffeine<span className="text-accent">.</span>Pro
            </h1>
            <p className="text-[8px] font-black uppercase tracking-[3px] text-zinc-600 mt-1">
              India Edition
            </p>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {[
              { id: 'track' as Tab, label: 'Track', icon: Zap },
              { id: 'stats' as Tab, label: 'Analytics', icon: BarChart3 },
              { id: 'goals' as Tab, label: 'Goals', icon: Target },
              { id: 'settings' as Tab, label: 'Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  activeTab === tab.id 
                    ? "bg-accent text-black" 
                    : "text-zinc-500 hover:text-white hover:bg-zinc-900"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Right side: Progress + Actions */}
        <div className="flex items-center gap-4">
          {/* Streak Badge */}
          {streak > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-black text-orange-500">{streak}</span>
            </div>
          )}
          
          {/* Daily Progress Mini */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-[2px] text-zinc-600">Today</p>
              <p className={cn("text-sm font-black", safetyColor)}>{dailyTotal}/{goalTarget}mg</p>
            </div>
            <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${safetyPercentage}%` }}
                className={cn(
                  "h-full transition-colors duration-500 rounded-full",
                  dailyTotal > goalTarget ? "bg-red-500" : dailyTotal > goalTarget * 0.75 ? "bg-orange-500" : "bg-accent"
                )}
              />
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setIsAddingCustom(true)}
            className="bg-accent text-black p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 lg:grid lg:grid-cols-[300px_1fr_280px] gap-[1px] bg-zinc-800/50 overflow-auto lg:overflow-hidden">
        {activeTab === 'track' && renderTrackTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Mobile Tab Navigation */}
      <footer className="lg:hidden sticky bottom-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 px-2 py-2 flex justify-around items-end safe-area-pb">
        {[
          { id: 'track' as Tab, label: 'Track', icon: Zap },
          { id: 'stats' as Tab, label: 'Stats', icon: BarChart3 },
          { id: 'add' as Tab, label: 'Add', icon: PlusCircle },
          { id: 'goals' as Tab, label: 'Goals', icon: Target },
          { id: 'settings' as Tab, label: 'More', icon: Settings },
        ].map(tab => (
          tab.id === 'add' ? (
            <button 
              key={tab.id}
              onClick={() => setIsAddingCustom(true)}
              className="bg-accent text-black p-3 rounded-full -mt-6 border-4 border-zinc-950 shadow-2xl shadow-accent/20"
            >
              <tab.icon className="w-6 h-6" />
            </button>
          ) : (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3",
                activeTab === tab.id ? "text-accent" : "text-zinc-600"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-wider">{tab.label}</span>
            </button>
          )
        ))}
      </footer>

      {/* ============ MODALS ============ */}
      
      {/* Drink Selection Modal */}
      <AnimatePresence>
        {selectedDrink && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 lg:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-zinc-900 w-full max-w-xl rounded-3xl p-8 space-y-8 relative border border-zinc-800"
            >
              <button onClick={() => setSelectedDrink(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
              
              {/* Drink Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-1.5 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-[2px] text-zinc-500">{selectedDrink.category}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-[9px] font-black uppercase tracking-[2px] text-zinc-500">{selectedDrink.brand}</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight">{selectedDrink.name}</h2>
                <p className="text-accent text-[10px] font-black uppercase tracking-[3px] mt-1">{selectedDrink.caffeinePer100ml}mg per 100ml</p>
              </div>

              {/* Favorite Toggle */}
              <div className="flex justify-center">
                <button
                  onClick={() => handleToggleFavorite(selectedDrink.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all",
                    preferences.favorites.includes(selectedDrink.id)
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5", preferences.favorites.includes(selectedDrink.id) && "fill-accent")} />
                  {preferences.favorites.includes(selectedDrink.id) ? 'Favorited' : 'Add to Favorites'}
                </button>
              </div>

              {/* Volume Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Volume</span>
                  <span className="text-4xl font-black text-accent">{customAmount}<span className="text-lg text-zinc-600">ml</span></span>
                </div>
                <input 
                  type="range" min="50" max="1000" step="10" value={customAmount}
                  onChange={(e) => setCustomAmount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 250, 330, 500].filter(s => s <= 500).map(s => (
                    <button 
                      key={s} 
                      onClick={() => setCustomAmount(s)} 
                      className={cn(
                        "py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                        customAmount === s 
                          ? "bg-white text-black border-white" 
                          : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600"
                      )}
                    >
                      {s}ml
                    </button>
                  ))}
                </div>
              </div>

              {/* Caffeine Calculation */}
              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Caffeine Intake</p>
                    <div className="text-4xl font-black text-accent">
                      {Math.round((selectedDrink.caffeinePer100ml / 100) * customAmount)}
                      <span className="text-lg text-zinc-600 ml-1">mg</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-zinc-600 uppercase font-bold">After intake</p>
                    <p className={cn("text-lg font-black", (dailyTotal + Math.round((selectedDrink.caffeinePer100ml / 100) * customAmount)) > goalTarget ? "text-red-500" : "text-accent")}>
                      {dailyTotal + Math.round((selectedDrink.caffeinePer100ml / 100) * customAmount)}mg
                    </p>
                    <p className="text-[9px] text-zinc-700">daily total</p>
                  </div>
                </div>
              </div>

              {/* Log Button */}
              <button 
                onClick={() => handleAddLog(selectedDrink, customAmount)}
                className="w-full bg-accent text-black font-black py-5 rounded-2xl text-lg uppercase tracking-tighter transition-transform active:scale-[0.98] hover:brightness-110"
              >
                Log This Drink
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Entry Modal */}
      <AnimatePresence>
        {isAddingCustom && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-zinc-900 w-full max-w-lg rounded-3xl p-8 space-y-6 relative border border-zinc-800"
            >
              <button onClick={() => setIsAddingCustom(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Custom Entry</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[2px] mt-1">Add any drink not in our database</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Drink Name</label>
                  <input 
                    type="text" 
                    value={customName} 
                    onChange={(e) => setCustomName(e.target.value)} 
                    placeholder="e.g., Homemade Cold Coffee"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 px-5 font-bold outline-none focus:border-accent text-sm placeholder:text-zinc-700" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Caffeine (mg/100ml)</label>
                    <input 
                      type="number" 
                      value={customCaffeinePer100 || ''} 
                      onChange={(e) => setCustomCaffeinePer100(parseFloat(e.target.value))} 
                      placeholder="30"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 px-5 font-black text-accent outline-none focus:border-accent text-sm placeholder:text-zinc-700" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Volume (ml)</label>
                    <input 
                      type="number" 
                      value={customAmount} 
                      onChange={(e) => setCustomAmount(parseInt(e.target.value))} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 px-5 font-black outline-none focus:border-accent text-sm" 
                    />
                  </div>
                </div>

                {/* Preview */}
                {customName && customCaffeinePer100 > 0 && (
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Preview</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">{customName}</span>
                      <span className="text-accent font-black">{Math.round((customCaffeinePer100 / 100) * customAmount)}mg</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleAddCustom}
                  disabled={!customName || customCaffeinePer100 <= 0}
                  className="w-full bg-accent text-black font-black py-4 rounded-xl uppercase tracking-tighter disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                >
                  Log Custom Drink
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
        {undoAction && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 z-50 bg-zinc-900 border border-accent/30 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl shadow-accent/10 min-w-[280px]"
          >
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                {undoAction.type === 'ADD' ? '✓ Logged' : '✗ Deleted'}
              </p>
              <p className="text-sm font-bold truncate">{undoAction.entry.name} — {undoAction.entry.caffeine}mg</p>
            </div>
            <button
              onClick={handleUndo}
              className="bg-accent text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Undo
            </button>
            <button
              onClick={() => setUndoAction(null)}
              className="text-zinc-600 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Toast */}
      <AnimatePresence>
        {showExportToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-500/10 border border-green-500 rounded-xl px-5 py-3 flex items-center gap-3"
          >
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-xs font-bold text-green-400">CSV exported successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
