/**
 * Focus Engine — pure client-side timer logic.
 * No DOM, no React, no server deps. Designed to run in main thread or Web Worker.
 */

export type FocusMethodology = "POMODORO" | "DEEP_WORK" | "FLOWTIME" | "CUSTOM";

export type IntervalType = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";

export type SessionPhase = "idle" | "focus" | "short_break" | "long_break" | "finished";

export interface FocusEngineConfig {
  methodology: FocusMethodology;
  focusDuration: number; // minutes (0 = unlimited for flowtime)
  shortBreakDuration: number; // minutes
  longBreakDuration?: number; // minutes
  sessionsBeforeLongBreak?: number;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
}

export interface EngineInterval {
  type: IntervalType;
  startedAt: number; // timestamp ms
  endedAt?: number;
  duration: number; // seconds elapsed
  completed: boolean;
}

export interface EngineState {
  phase: SessionPhase;
  elapsed: number; // seconds in current interval
  remaining: number; // seconds remaining (-1 if unlimited)
  totalFocusTime: number; // total focus seconds this session
  totalBreakTime: number; // total break seconds this session
  completedFocusIntervals: number;
  intervals: EngineInterval[];
  pauseCount: number;
  totalPauseTime: number; // seconds
  isPaused: boolean;
}

type EventCallback = (event: EngineEvent) => void;

export type EngineEvent =
  | { type: "tick"; state: EngineState }
  | { type: "interval_complete"; intervalType: IntervalType; state: EngineState }
  | { type: "session_complete"; state: EngineState }
  | { type: "phase_change"; from: SessionPhase; to: SessionPhase; state: EngineState };

export class FocusEngine {
  private config: FocusEngineConfig;
  private state: EngineState;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private pauseStartedAt: number | null = null;
  private intervalStartedAt: number = 0;
  private listeners: EventCallback[] = [];

  constructor(config: FocusEngineConfig) {
    this.config = config;
    this.state = this.createInitialState();
  }

  private createInitialState(): EngineState {
    return {
      phase: "idle",
      elapsed: 0,
      remaining: this.getFocusDurationSeconds(),
      totalFocusTime: 0,
      totalBreakTime: 0,
      completedFocusIntervals: 0,
      intervals: [],
      pauseCount: 0,
      totalPauseTime: 0,
      isPaused: false,
    };
  }

  private getFocusDurationSeconds(): number {
    if (this.config.focusDuration === 0) return -1; // unlimited (flowtime)
    return this.config.focusDuration * 60;
  }

  private getBreakDurationSeconds(): number {
    if (this.isLongBreakDue()) {
      return (this.config.longBreakDuration ?? this.config.shortBreakDuration) * 60;
    }
    return this.config.shortBreakDuration * 60;
  }

  private isLongBreakDue(): boolean {
    if (!this.config.sessionsBeforeLongBreak || !this.config.longBreakDuration) {
      return false;
    }
    return (
      this.state.completedFocusIntervals > 0 &&
      this.state.completedFocusIntervals % this.config.sessionsBeforeLongBreak === 0
    );
  }

  // Public API

  start(): void {
    if (this.state.phase !== "idle") return;

    this.setPhase("focus");
    this.startInterval("FOCUS");
    this.startTicking();
  }

  pause(): void {
    if (this.state.isPaused || this.state.phase === "idle" || this.state.phase === "finished") {
      return;
    }

    this.state.isPaused = true;
    this.state.pauseCount++;
    this.pauseStartedAt = Date.now();
    this.stopTicking();
  }

  resume(): void {
    if (!this.state.isPaused) return;

    if (this.pauseStartedAt) {
      const pauseDuration = (Date.now() - this.pauseStartedAt) / 1000;
      this.state.totalPauseTime += Math.round(pauseDuration);
      this.pauseStartedAt = null;
    }

    this.state.isPaused = false;
    this.startTicking();
  }

  skipInterval(): void {
    if (this.state.phase === "idle" || this.state.phase === "finished") return;
    if (this.state.isPaused) this.resume();

    this.completeCurrentInterval();
    this.advanceToNextPhase();
  }

  finish(): EngineState {
    this.completeCurrentInterval();
    this.setPhase("finished");
    this.stopTicking();
    this.emit({ type: "session_complete", state: this.getState() });
    return this.getState();
  }

  getState(): EngineState {
    return { ...this.state, intervals: [...this.state.intervals] };
  }

  onEvent(callback: EventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  destroy(): void {
    this.stopTicking();
    this.listeners = [];
  }

  // Internal

  private startTicking(): void {
    this.stopTicking();
    this.tickInterval = setInterval(() => this.tick(), 1000);
  }

  private stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private tick(): void {
    if (this.state.isPaused || this.state.phase === "idle" || this.state.phase === "finished") {
      return;
    }

    this.state.elapsed++;

    // Update current interval duration
    const currentInterval = this.state.intervals[this.state.intervals.length - 1];
    if (currentInterval && !currentInterval.endedAt) {
      currentInterval.duration = this.state.elapsed;
    }

    // Track total times
    if (this.state.phase === "focus") {
      this.state.totalFocusTime++;
    } else {
      this.state.totalBreakTime++;
    }

    // Calculate remaining
    const targetDuration = this.getTargetDuration();
    if (targetDuration > 0) {
      this.state.remaining = Math.max(0, targetDuration - this.state.elapsed);
    }

    this.emit({ type: "tick", state: this.getState() });

    // Check if interval complete (not for unlimited)
    if (targetDuration > 0 && this.state.elapsed >= targetDuration) {
      this.completeCurrentInterval();

      if (this.state.phase === "focus") {
        this.state.completedFocusIntervals++;
      }

      this.emit({
        type: "interval_complete",
        intervalType: currentInterval?.type ?? "FOCUS",
        state: this.getState(),
      });

      // Auto-advance based on config
      if (this.state.phase === "focus") {
        if (this.config.autoStartBreak) {
          this.advanceToNextPhase();
        } else {
          this.stopTicking();
        }
      } else {
        // Break finished
        if (this.config.autoStartFocus) {
          this.advanceToNextPhase();
        } else {
          this.stopTicking();
        }
      }
    }
  }

  private getTargetDuration(): number {
    if (this.state.phase === "focus") {
      return this.getFocusDurationSeconds(); // -1 = unlimited
    }
    return this.getBreakDurationSeconds();
  }

  private advanceToNextPhase(): void {
    if (this.state.phase === "focus") {
      // Go to break
      const breakType = this.isLongBreakDue() ? "long_break" : "short_break";
      this.setPhase(breakType);
      this.startInterval(breakType === "long_break" ? "LONG_BREAK" : "SHORT_BREAK");
    } else {
      // Go to focus
      this.setPhase("focus");
      this.startInterval("FOCUS");
    }

    if (!this.tickInterval) {
      this.startTicking();
    }
  }

  private setPhase(phase: SessionPhase): void {
    const from = this.state.phase;
    this.state.phase = phase;

    if (from !== phase) {
      this.emit({ type: "phase_change", from, to: phase, state: this.getState() });
    }
  }

  private startInterval(type: IntervalType): void {
    this.state.elapsed = 0;
    this.intervalStartedAt = Date.now();

    const targetDuration = this.getTargetDuration();
    this.state.remaining = targetDuration > 0 ? targetDuration : -1;

    this.state.intervals.push({
      type,
      startedAt: this.intervalStartedAt,
      duration: 0,
      completed: false,
    });
  }

  private completeCurrentInterval(): void {
    const current = this.state.intervals[this.state.intervals.length - 1];
    if (current && !current.endedAt) {
      current.endedAt = Date.now();
      current.completed = true;
      current.duration = Math.round((current.endedAt - current.startedAt) / 1000);
    }
  }

  private emit(event: EngineEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

// Helpers

export function formatTime(seconds: number): string {
  if (seconds < 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function getDefaultConfig(methodology: FocusMethodology): FocusEngineConfig {
  switch (methodology) {
    case "POMODORO":
      return {
        methodology: "POMODORO",
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4,
        autoStartBreak: false,
        autoStartFocus: false,
      };
    case "DEEP_WORK":
      return {
        methodology: "DEEP_WORK",
        focusDuration: 90,
        shortBreakDuration: 15,
        autoStartBreak: false,
        autoStartFocus: false,
      };
    case "FLOWTIME":
      return {
        methodology: "FLOWTIME",
        focusDuration: 0, // unlimited
        shortBreakDuration: 10,
        autoStartBreak: false,
        autoStartFocus: false,
      };
    case "CUSTOM":
      return {
        methodology: "CUSTOM",
        focusDuration: 30,
        shortBreakDuration: 5,
        autoStartBreak: false,
        autoStartFocus: false,
      };
  }
}
