/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Drink } from '../data/drinks';

export interface LogEntry {
  id: string;
  drinkId: string;
  name: string;
  category: string;
  amount: number; // in ml
  caffeine: number; // in mg
  timestamp: number;
}

export interface DailyGoal {
  target: number; // mg
  enabled: boolean;
}

export interface UserPreferences {
  dailyGoal: DailyGoal;
  favorites: string[]; // drink IDs
  theme: 'dark' | 'midnight';
  notifications: boolean;
}

const STORAGE_KEY = 'caffeine_tracker_logs';
const PREFS_KEY = 'caffeine_tracker_prefs';
const STREAK_KEY = 'caffeine_tracker_streak';

// ============ LOGS ============

export const getLogs = (): LogEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveLog = (entry: LogEntry) => {
  const logs = getLogs();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...logs]));
};

export const deleteLog = (id: string) => {
  const logs = getLogs();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.filter(log => log.id !== id)));
};

export const clearLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getDailyTotal = (date: Date = new Date()): number => {
  const logs = getLogs();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return logs
    .filter(log => log.timestamp >= startOfDay.getTime() && log.timestamp <= endOfDay.getTime())
    .reduce((sum, log) => sum + log.caffeine, 0);
};

export const getWeeklyData = () => {
  const logs = getLogs();
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayStart = d.getTime();
    
    d.setHours(23, 59, 59, 999);
    const dayEnd = d.getTime();
    
    const dailyTotal = logs
      .filter(log => log.timestamp >= dayStart && log.timestamp <= dayEnd)
      .reduce((sum, log) => sum + log.caffeine, 0);
      
    data.push({
      date: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      fullDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      caffeine: dailyTotal,
    });
  }
  
  return data;
};

export const getMonthlyData = () => {
  const logs = getLogs();
  const data = [];
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayStart = d.getTime();
    
    d.setHours(23, 59, 59, 999);
    const dayEnd = d.getTime();
    
    const dailyTotal = logs
      .filter(log => log.timestamp >= dayStart && log.timestamp <= dayEnd)
      .reduce((sum, log) => sum + log.caffeine, 0);
      
    data.push({
      date: d.toLocaleDateString('en-IN', { day: 'numeric' }),
      caffeine: dailyTotal,
    });
  }
  
  return data;
};

// ============ STATS ============

export const getStats = () => {
  const logs = getLogs();
  const weeklyData = getWeeklyData();
  
  const totalLogs = logs.length;
  const totalCaffeine = logs.reduce((sum, log) => sum + log.caffeine, 0);
  const avgDaily = weeklyData.length > 0 
    ? Math.round(weeklyData.reduce((sum, d) => sum + d.caffeine, 0) / weeklyData.filter(d => d.caffeine > 0).length) || 0
    : 0;
  
  // Most consumed drink
  const drinkCounts: Record<string, { count: number; total: number }> = {};
  logs.forEach(log => {
    if (!drinkCounts[log.name]) {
      drinkCounts[log.name] = { count: 0, total: 0 };
    }
    drinkCounts[log.name].count++;
    drinkCounts[log.name].total += log.caffeine;
  });
  
  const topDrink = Object.entries(drinkCounts)
    .sort((a, b) => b[1].count - a[1].count)[0];
  
  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  logs.forEach(log => {
    categoryTotals[log.category] = (categoryTotals[log.category] || 0) + log.caffeine;
  });

  // Peak hour
  const hourCounts: Record<number, number> = {};
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + log.caffeine;
  });
  const peakHour = Object.entries(hourCounts)
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  return {
    totalLogs,
    totalCaffeine,
    avgDaily,
    topDrink: topDrink ? { name: topDrink[0], count: topDrink[1].count, total: topDrink[1].total } : null,
    categoryTotals,
    peakHour: peakHour ? { hour: Number(peakHour[0]), total: Number(peakHour[1]) } : null,
  };
};

// ============ STREAKS ============

export const getStreak = (): number => {
  const logs = getLogs();
  if (logs.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dayStart = checkDate.getTime();
    checkDate.setHours(23, 59, 59, 999);
    const dayEnd = checkDate.getTime();
    
    const hasLog = logs.some(log => log.timestamp >= dayStart && log.timestamp <= dayEnd);
    if (hasLog) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
};

// ============ CAFFEINE HALF-LIFE ============

export const estimateCaffeineRemaining = (): number => {
  const logs = getLogs();
  const now = Date.now();
  const halfLifeMs = 5 * 60 * 60 * 1000; // 5 hours in ms
  
  let remaining = 0;
  logs.forEach(log => {
    const elapsed = now - log.timestamp;
    if (elapsed >= 0) {
      const halfLives = elapsed / halfLifeMs;
      remaining += log.caffeine * Math.pow(0.5, halfLives);
    }
  });
  
  return Math.round(remaining);
};

export const getCaffeineTimeline = (): { time: string; caffeine: number }[] => {
  const logs = getLogs();
  const now = Date.now();
  const halfLifeMs = 5 * 60 * 60 * 1000;
  const timeline: { time: string; caffeine: number }[] = [];
  
  // Project forward 12 hours in 1-hour increments
  for (let h = 0; h <= 12; h++) {
    const futureTime = now + (h * 60 * 60 * 1000);
    let total = 0;
    
    logs.forEach(log => {
      const elapsed = futureTime - log.timestamp;
      if (elapsed >= 0) {
        const halfLives = elapsed / halfLifeMs;
        total += log.caffeine * Math.pow(0.5, halfLives);
      }
    });
    
    const timeLabel = h === 0 ? 'Now' : `+${h}h`;
    timeline.push({ time: timeLabel, caffeine: Math.round(total) });
  }
  
  return timeline;
};

// ============ PREFERENCES ============

export const getPreferences = (): UserPreferences => {
  const stored = localStorage.getItem(PREFS_KEY);
  if (stored) return JSON.parse(stored);
  
  return {
    dailyGoal: { target: 400, enabled: true },
    favorites: [],
    theme: 'dark',
    notifications: false,
  };
};

export const savePreferences = (prefs: UserPreferences) => {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
};

export const toggleFavorite = (drinkId: string) => {
  const prefs = getPreferences();
  const idx = prefs.favorites.indexOf(drinkId);
  if (idx >= 0) {
    prefs.favorites.splice(idx, 1);
  } else {
    prefs.favorites.push(drinkId);
  }
  savePreferences(prefs);
  return prefs.favorites;
};

// ============ EXPORT ============

export const exportToCSV = (): string => {
  const logs = getLogs();
  const headers = ['Date', 'Time', 'Drink', 'Category', 'Volume (ml)', 'Caffeine (mg)'];
  const rows = logs.map(log => {
    const d = new Date(log.timestamp);
    return [
      d.toLocaleDateString('en-IN'),
      d.toLocaleTimeString('en-IN'),
      log.name,
      log.category,
      log.amount.toString(),
      log.caffeine.toString(),
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
};

export const downloadCSV = () => {
  const csv = exportToCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `caffeine-log-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
