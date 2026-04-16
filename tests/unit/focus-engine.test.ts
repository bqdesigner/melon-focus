import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FocusEngine,
  formatTime,
  getDefaultConfig,
  type EngineEvent,
} from "@/lib/focus-engine";

describe("FocusEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Pomodoro", () => {
    it("starts in idle, transitions to focus", () => {
      const engine = new FocusEngine(getDefaultConfig("POMODORO"));
      expect(engine.getState().phase).toBe("idle");

      engine.start();
      expect(engine.getState().phase).toBe("focus");
      expect(engine.getState().remaining).toBe(25 * 60);
      engine.destroy();
    });

    it("counts down each second", () => {
      const engine = new FocusEngine(getDefaultConfig("POMODORO"));
      engine.start();

      vi.advanceTimersByTime(5000);

      const state = engine.getState();
      expect(state.elapsed).toBe(5);
      expect(state.remaining).toBe(25 * 60 - 5);
      expect(state.totalFocusTime).toBe(5);
      engine.destroy();
    });

    it("completes focus interval after full duration", () => {
      const events: EngineEvent[] = [];
      const engine = new FocusEngine(getDefaultConfig("POMODORO"));
      engine.onEvent((e) => events.push(e));
      engine.start();

      vi.advanceTimersByTime(25 * 60 * 1000);

      const complete = events.find((e) => e.type === "interval_complete");
      expect(complete).toBeDefined();
      expect(
        complete?.type === "interval_complete" ? complete.intervalType : null
      ).toBe("FOCUS");
      expect(engine.getState().completedFocusIntervals).toBe(1);
      engine.destroy();
    });

    it("triggers long break after 4 focus intervals", () => {
      const config = {
        ...getDefaultConfig("POMODORO"),
        autoStartBreak: true,
        autoStartFocus: true,
      };
      const engine = new FocusEngine(config);
      const phases: string[] = [];
      engine.onEvent((e) => {
        if (e.type === "phase_change") phases.push(e.to);
      });

      engine.start();

      // 4 pomodoros + 3 short breaks = complete cycles
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(25 * 60 * 1000); // focus
        vi.advanceTimersByTime(5 * 60 * 1000); // short break
      }
      vi.advanceTimersByTime(25 * 60 * 1000); // 4th focus

      // After 4th focus, should be long break
      expect(phases).toContain("long_break");
      engine.destroy();
    });
  });

  describe("pause/resume", () => {
    it("pauses and resumes correctly", () => {
      const engine = new FocusEngine(getDefaultConfig("POMODORO"));
      engine.start();

      vi.advanceTimersByTime(3000);
      engine.pause();
      const pausedState = engine.getState();
      expect(pausedState.isPaused).toBe(true);
      expect(pausedState.pauseCount).toBe(1);

      vi.advanceTimersByTime(5000); // time passes while paused
      expect(engine.getState().elapsed).toBe(pausedState.elapsed); // no change

      engine.resume();
      expect(engine.getState().isPaused).toBe(false);

      vi.advanceTimersByTime(2000);
      expect(engine.getState().elapsed).toBe(pausedState.elapsed + 2);
      engine.destroy();
    });

    it("tracks total pause time", () => {
      const engine = new FocusEngine(getDefaultConfig("POMODORO"));
      engine.start();

      vi.advanceTimersByTime(1000);
      engine.pause();
      vi.advanceTimersByTime(10000); // 10s paused
      engine.resume();

      expect(engine.getState().totalPauseTime).toBe(10);
      engine.destroy();
    });
  });

  describe("skip interval", () => {
    it("skips from focus to break", () => {
      const engine = new FocusEngine(getDefaultConfig("POMODORO"));
      engine.start();
      vi.advanceTimersByTime(5000);

      engine.skipInterval();

      const state = engine.getState();
      expect(state.phase).toBe("short_break");
      expect(state.elapsed).toBe(0);
      expect(state.intervals).toHaveLength(2);
      expect(state.intervals[0].completed).toBe(true);
      engine.destroy();
    });
  });

  describe("finish", () => {
    it("returns final state with all intervals", () => {
      const engine = new FocusEngine(getDefaultConfig("POMODORO"));
      engine.start();
      vi.advanceTimersByTime(10000);

      const final = engine.finish();

      expect(final.phase).toBe("finished");
      expect(final.intervals).toHaveLength(1);
      expect(final.totalFocusTime).toBe(10);
      engine.destroy();
    });
  });

  describe("Deep Work", () => {
    it("has 90 min focus duration", () => {
      const engine = new FocusEngine(getDefaultConfig("DEEP_WORK"));
      engine.start();
      expect(engine.getState().remaining).toBe(90 * 60);
      engine.destroy();
    });
  });

  describe("Flowtime", () => {
    it("has unlimited focus (remaining = -1)", () => {
      const engine = new FocusEngine(getDefaultConfig("FLOWTIME"));
      engine.start();
      expect(engine.getState().remaining).toBe(-1);

      vi.advanceTimersByTime(60000);
      expect(engine.getState().elapsed).toBe(60);
      expect(engine.getState().remaining).toBe(-1); // still unlimited
      engine.destroy();
    });
  });
});

describe("formatTime", () => {
  it("formats seconds to MM:SS", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(25 * 60)).toBe("25:00");
    expect(formatTime(90 * 60 + 30)).toBe("90:30");
  });

  it("returns --:-- for negative (unlimited)", () => {
    expect(formatTime(-1)).toBe("--:--");
  });
});

describe("getDefaultConfig", () => {
  it("returns valid configs for all methodologies", () => {
    const methods = ["POMODORO", "DEEP_WORK", "FLOWTIME", "CUSTOM"] as const;
    for (const m of methods) {
      const config = getDefaultConfig(m);
      expect(config.methodology).toBe(m);
      expect(config.shortBreakDuration).toBeGreaterThan(0);
    }
  });
});
