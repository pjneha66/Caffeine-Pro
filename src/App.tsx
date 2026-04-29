/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Search, 
  Coffee, 
  CupSoda, 
  Clock, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  Leaf, 
  ChevronRight,
  PlusCircle,
  X,
  History,
  Activity,
  GlassWater
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
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
  getWeeklyData 
} from './utils/storage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIES = ['All', 'Energy', 'Soft Drink', 'Coffee', 'Tea', 'Other'] as const;
type Category = typeof CATEGORIES[number];

export default function App() {
  const [activeTab, setActiveTab] = useState<'track' | 'history'>('track');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [customAmount, setCustomAmount] = useState(250);

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

  const refreshData = () => {
    setLogs(getLogs());
    setDailyTotal(getDailyTotal());
    setWeeklyData(getWeeklyData());
  };

  const filteredDrinks = useMemo(() => {
    return INDIAN_DRINKS.filter(drink => {
      const matchesSearch = drink.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             drink.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || drink.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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

  const safetyColor = dailyTotal > 400 ? 'text-red-500' : dailyTotal > 300 ? 'text-orange-500' : 'text-accent';
  const safetyPercentage = Math.min((dailyTotal / 400) * 100, 100);

  const lastDrink = logs[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-accent selection:text-black lg:h-screen lg:overflow-hidden flex flex-col">
      {/* Header - Styled for BOLD TOPOGRAPHY */}
      <header className="bg-zinc-950 border-b border-zinc-800 p-8 lg:px-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 shrink-0">
        <div className="branding flex flex-col justify-center">
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
            Caffeine<span className="text-accent">.</span>Pro
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500 mt-2">
            Made by Pramod Jadhav
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3 min-w-[200px]">
          <div className="flex justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500">Daily Budget</span>
            <span className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500">400mg</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${safetyPercentage}%` }}
              className={cn(
                "h-full transition-colors duration-500",
                dailyTotal > 400 ? "bg-red-500" : dailyTotal > 300 ? "bg-orange-500" : "bg-accent"
              )}
            />
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 lg:grid lg:grid-cols-[320px_1fr_300px] gap-[1px] bg-zinc-800 overflow-auto lg:overflow-hidden">
        
        {/* SIDEBAR LEFT: Drink Selection (Visible on Desktop, Tab 1 on Mobile) */}
        <aside className={cn(
          "bg-zinc-950 p-6 flex flex-col gap-6 overflow-auto scrollbar-hide no-scrollbar",
          activeTab !== 'track' && "hidden lg:flex"
        )}>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search India Database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 px-4 text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-accent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all border",
                  selectedCategory === cat 
                    ? "bg-accent text-black border-accent" 
                    : "bg-zinc-900 text-zinc-400 border-transparent hover:border-zinc-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-auto no-scrollbar">
            {filteredDrinks.map(drink => (
              <button
                key={drink.id}
                onClick={() => setSelectedDrink(drink)}
                className="w-full bg-zinc-900 p-4 rounded-xl flex items-center justify-between group hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
              >
                <div className="text-left">
                  <h4 className="text-sm font-black tracking-tight">{drink.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{drink.defaultSize}ml • {drink.brand}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-accent group-hover:text-black flex items-center justify-center text-zinc-400 font-black transition-colors">
                  +
                </div>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-800">
             <div className="p-4 bg-zinc-900 rounded-xl border border-dashed border-zinc-700">
                <span className="text-[10px] text-accent font-black uppercase tracking-widest block mb-1">Pro 100ml Calc</span>
                <div className="text-xl font-black">
                  {lastDrink ? lastDrink.caffeinePer100ml : '--'} <span className="text-[10px] opacity-50">mg / 100ml</span>
                </div>
                {lastDrink && <p className="text-[9px] text-zinc-600 mt-1 uppercase font-bold tracking-tight">Based on last entry: {lastDrink.name}</p>}
             </div>
          </div>
        </aside>

        {/* CENTER VIEW: Main Statistics */}
        <main className={cn(
          "bg-zinc-950 p-8 lg:p-12 flex flex-col items-center justify-center relative",
          activeTab === 'history' && !isAddingCustom && "hidden lg:flex"
        )}>
          <div className="text-center relative z-10">
            <motion.div 
              key={dailyTotal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("text-brand-display", safetyColor)}
            >
              {dailyTotal}
            </motion.div>
            <div className="text-2xl font-black uppercase tracking-[8px] mt-4 text-zinc-300">mg Total</div>
          </div>

          <div className={cn(
            "mt-12 px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[2px] transition-colors",
            dailyTotal > 400 
              ? "bg-red-500/10 border-red-500 text-red-500" 
              : "bg-accent/10 border-accent text-accent"
          )}>
            {dailyTotal > 400 ? "Maximum Limit Exceeded" : dailyTotal > 300 ? "Approaching Threshold" : "Optimal Consumption Level"}
          </div>

          {/* Footer status line (Desktop only) */}
          <div className="hidden lg:flex absolute bottom-12 left-12 right-12 justify-between border-t border-zinc-800 pt-8">
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px] mb-1">Last Drink</p>
              <p className="font-black text-sm">{lastDrink ? `${lastDrink.name} (${new Date(lastDrink.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : 'No drinks logged'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px] mb-1">Caffeine Outlook</p>
              <p className="font-black text-sm text-accent">Active metabolic peak</p>
            </div>
          </div>
        </main>

        {/* SIDEBAR RIGHT: Trends & History (Visible on Desktop, Tab 2 on Mobile) */}
        <aside className={cn(
          "bg-zinc-950 p-8 border-l border-zinc-800 flex flex-col gap-10 overflow-auto no-scrollbar",
          activeTab !== 'history' && "hidden lg:flex"
        )}>
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500 mb-6">7-Day Trend</h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <Bar dataKey="caffeine" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.caffeine > 400 ? '#ef4444' : (index === 6 ? '#E1FC6F' : '#333')} />
                    ))}
                  </Bar>
                  <XAxis dataKey="date" hide />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 px-1">
                {weeklyData.map(d => (
                  <span key={d.date} className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">{d.date[0]}</span>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500 mb-6">Recent Records</h3>
            <div className="space-y-4">
              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="flex justify-between items-center text-xs pb-4 border-b border-zinc-800">
                  <span className="font-bold text-zinc-300">{log.name}</span>
                  <span className="font-black text-accent">{log.caffeine}mg</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-[10px] italic text-zinc-600">No logs found.</p>}
            </div>
          </section>

          {dailyTotal > 300 && (
            <div className="mt-auto p-5 bg-red-500/10 border border-red-500 rounded-2xl">
              <h4 className="text-red-500 text-[10px] font-black uppercase tracking-[2px] mb-2">Safety Alert</h4>
              <p className="text-[11px] leading-tight text-red-200/70 font-medium">
                Approaching peak capacity. Consider caffeine-free alternatives for the next 6 hours.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile Tab Navigation */}
      <footer className="lg:hidden sticky bottom-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 p-4 flex justify-around">
        <button 
          onClick={() => setActiveTab('track')}
          className={cn(
            "flex flex-col items-center gap-1",
            activeTab === 'track' ? "text-accent" : "text-zinc-500"
          )}
        >
          <Zap className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-[2px]">Track</span>
        </button>
        <button 
          onClick={() => setIsAddingCustom(true)}
          className="bg-accent text-black p-3 rounded-full -mt-10 border-4 border-zinc-950 shadow-2xl"
        >
          <PlusCircle className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex flex-col items-center gap-1",
            activeTab === 'history' ? "text-accent" : "text-zinc-500"
          )}
        >
          <Activity className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-[2px]">Stats</span>
        </button>
      </footer>

      {/* Modals and Overlays (Same logic as before, just styled to theme) */}
      <AnimatePresence>
        {selectedDrink && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 lg:p-12"
          >
             <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 w-full max-w-xl rounded-[40px] p-10 space-y-10 relative border border-zinc-800"
            >
              <button onClick={() => setSelectedDrink(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X /></button>
              
              <div className="text-center">
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Activity Log</h2>
                <p className="text-accent text-xs font-black uppercase tracking-[3px]">{selectedDrink.name} ({selectedDrink.brand})</p>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Portion</span>
                  <span className="text-5xl font-black text-accent">{customAmount}ml</span>
                </div>
                <input 
                  type="range" min="50" max="1000" step="10" value={customAmount}
                  onChange={(e) => setCustomAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-full appearance-none accent-accent"
                />
                <div className="flex gap-2">
                  {[100, 250, 330, 500].map(s => (
                    <button key={s} onClick={() => setCustomAmount(s)} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all", customAmount === s ? "bg-white text-black border-white" : "bg-zinc-800 text-zinc-500 border-zinc-700")}>{s}ml</button>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-zinc-950 rounded-3xl flex items-center justify-between border border-zinc-800">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Total Caffeine</p>
                  <div className="text-5xl font-black text-accent">{Math.round((selectedDrink.caffeinePer100ml / 100) * customAmount)}mg</div>
                </div>
                <div className="text-right text-[10px] font-black text-zinc-700 space-y-1 uppercase tracking-tighter">
                  <p>Ratio: {selectedDrink.caffeinePer100ml}mg/100ml</p>
                  <p>Data Verified for India</p>
                </div>
              </div>

              <button 
                onClick={() => handleAddLog(selectedDrink, customAmount)}
                className="w-full bg-accent text-black font-black py-6 rounded-3xl text-xl uppercase tracking-tighter transition-transform active:scale-95"
              >
                Log Drink Record
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingCustom && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 w-full max-w-lg rounded-[40px] p-10 space-y-8 relative border border-zinc-800"
            >
              <button onClick={() => setIsAddingCustom(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X /></button>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Custom Entry</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Drink Name</label>
                  <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 font-bold outline-none focus:border-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">mg / 100ml</label>
                    <input type="number" value={customCaffeinePer100 || ''} onChange={(e) => setCustomCaffeinePer100(parseFloat(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 font-black text-accent outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Volume (ml)</label>
                    <input type="number" value={customAmount} onChange={(e) => setCustomAmount(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 font-black outline-none focus:border-accent" />
                  </div>
                </div>
                <button 
                  onClick={handleAddCustom}
                  className="w-full bg-accent text-black font-black py-4 rounded-2xl uppercase tracking-tighter mt-4"
                >
                  Create Custom Record
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
            className="fixed bottom-24 left-1/2 z-50 bg-zinc-900 border border-accent rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl min-w-[280px]"
          >
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                {undoAction.type === 'ADD' ? 'Activity Logged' : 'Activity Deleted'}
              </p>
              <p className="text-sm font-bold truncate max-w-[150px]">{undoAction.entry.name}</p>
            </div>
            <button
              onClick={handleUndo}
              className="bg-accent text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Undo
            </button>
            <button
              onClick={() => setUndoAction(null)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
