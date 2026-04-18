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

const STORAGE_KEY = 'caffeine_tracker_logs';

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
      caffeine: dailyTotal,
    });
  }
  
  return data;
};
