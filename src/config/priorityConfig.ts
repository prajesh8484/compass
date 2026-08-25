export const PRIORITY_CONFIG = {
  importanceMultiplier: 4,
  manualBoost: 30,
  contextBonus: 10,
  
  deadline: {
    overdue: 120,
    today: 90,
    tomorrow: 60,
    threeDays: 35,
    week: 18,
    month: 8,
    future: 2,
  },

  estimatedTime: {
    under10m: 18,
    under30m: 10,
    under1h: 4,
    under3h: 0,
    under6h: -6,
    over6h: -12,
  },

  difficulty: {
    easy: 6,
    medium: 0,
    hard: -5,
    very_hard: -10,
  },

  longTerm: {
    maxBonus: 20,
    daysPerTick: 14,
    bonusPerTick: 2,
  },

  aging: {
    twoMonths: 15,
    oneMonth: 8,
    twoWeeks: 4,
    oneWeek: 2,
  }
} as const;
