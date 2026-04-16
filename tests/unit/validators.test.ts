import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validators/auth";
import { createObjectiveSchema } from "@/lib/validators/objective";
import { createFocusConfigSchema } from "@/lib/validators/focus-config";
import { startSessionSchema } from "@/lib/validators/focus-session";

describe("auth validators", () => {
  describe("registerSchema", () => {
    it("accepts valid input", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "Test1234",
      });
      expect(result.success).toBe(true);
    });

    it("rejects short password", () => {
      const result = registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without uppercase", () => {
      const result = registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password: "test1234",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without number", () => {
      const result = registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password: "Testtest",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = registerSchema.safeParse({
        name: "Test",
        email: "not-email",
        password: "Test1234",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "any",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("objective validators", () => {
  it("accepts minimal objective", () => {
    const result = createObjectiveSchema.safeParse({
      title: "Learn TypeScript",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full objective", () => {
    const result = createObjectiveSchema.safeParse({
      title: "Learn TypeScript",
      description: "Advanced patterns",
      targetHours: 50,
      targetSessions: 20,
      color: "#6366f1",
      tagIds: ["tag1", "tag2"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createObjectiveSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color format", () => {
    const result = createObjectiveSchema.safeParse({
      title: "Test",
      color: "red",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative targetHours", () => {
    const result = createObjectiveSchema.safeParse({
      title: "Test",
      targetHours: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("focus config validators", () => {
  it("accepts valid pomodoro config", () => {
    const result = createFocusConfigSchema.safeParse({
      name: "My Pomodoro",
      methodology: "POMODORO",
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
    });
    expect(result.success).toBe(true);
  });

  it("rejects focus duration > 240 min", () => {
    const result = createFocusConfigSchema.safeParse({
      name: "Too Long",
      methodology: "CUSTOM",
      focusDuration: 300,
      shortBreakDuration: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid methodology", () => {
    const result = createFocusConfigSchema.safeParse({
      name: "Bad",
      methodology: "INVALID",
      focusDuration: 25,
      shortBreakDuration: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe("focus session validators", () => {
  it("accepts valid start session", () => {
    const result = startSessionSchema.safeParse({
      focusConfigId: "config-123",
      objectiveId: "obj-456",
    });
    expect(result.success).toBe(true);
  });

  it("accepts without objectiveId", () => {
    const result = startSessionSchema.safeParse({
      focusConfigId: "config-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty focusConfigId", () => {
    const result = startSessionSchema.safeParse({
      focusConfigId: "",
    });
    expect(result.success).toBe(false);
  });
});
