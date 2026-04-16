import { describe, it, expect, vi } from "vitest";
import { metricsService } from "@/services/metrics.service";

describe("metricsService.calculateStreak", () => {
  it("returns 0 for empty dates", () => {
    const result = metricsService.calculateStreak([]);
    expect(result).toEqual({ current: 0, longest: 0 });
  });

  it("returns 1 for single date today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));

    const result = metricsService.calculateStreak([
      new Date("2026-04-15T10:00:00Z"),
    ]);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);

    vi.useRealTimers();
  });

  it("calculates consecutive days streak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));

    const dates = [
      new Date("2026-04-15T10:00:00Z"),
      new Date("2026-04-14T10:00:00Z"),
      new Date("2026-04-13T10:00:00Z"),
      new Date("2026-04-12T10:00:00Z"),
    ];

    const result = metricsService.calculateStreak(dates);
    expect(result.current).toBe(4);
    expect(result.longest).toBe(4);

    vi.useRealTimers();
  });

  it("breaks streak on gap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));

    const dates = [
      new Date("2026-04-15T10:00:00Z"),
      new Date("2026-04-14T10:00:00Z"),
      // gap on 13th
      new Date("2026-04-12T10:00:00Z"),
      new Date("2026-04-11T10:00:00Z"),
    ];

    const result = metricsService.calculateStreak(dates);
    expect(result.current).toBe(2); // 15, 14
    expect(result.longest).toBe(2);

    vi.useRealTimers();
  });

  it("current streak is 0 if last session not today or yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));

    const dates = [
      new Date("2026-04-10T10:00:00Z"),
      new Date("2026-04-09T10:00:00Z"),
    ];

    const result = metricsService.calculateStreak(dates);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(2);

    vi.useRealTimers();
  });
});
