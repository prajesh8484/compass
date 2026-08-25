import { create } from 'zustand';

interface TimerState {
  selectedMinutes: number;
  timeLeft: number;
  isRunning: boolean;
  isCompleted: boolean;
  activeTaskId: string | null;

  setPreset: (minutes: number) => void;
  togglePlay: () => void;
  resetTimer: () => void;
  tick: () => void;
}

const playChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio context not supported or user gesture required
  }
};

export const useTimerStore = create<TimerState>((set, get) => ({
  selectedMinutes: 25,
  timeLeft: 25 * 60,
  isRunning: false,
  isCompleted: false,
  activeTaskId: null,

  setPreset: (minutes: number) => {
    set({
      selectedMinutes: minutes,
      timeLeft: minutes * 60,
      isRunning: false,
      isCompleted: false,
    });
  },

  togglePlay: () => {
    const { isRunning, isCompleted, selectedMinutes } = get();
    if (isCompleted) {
      set({
        timeLeft: selectedMinutes * 60,
        isCompleted: false,
        isRunning: true,
      });
    } else {
      set({ isRunning: !isRunning });
    }
  },

  resetTimer: () => {
    const { selectedMinutes } = get();
    set({
      isRunning: false,
      timeLeft: selectedMinutes * 60,
      isCompleted: false,
    });
  },

  tick: () => {
    const { isRunning, timeLeft } = get();
    if (!isRunning) return;

    if (timeLeft <= 1) {
      set({ timeLeft: 0, isRunning: false, isCompleted: true });
      playChime();
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },
}));
