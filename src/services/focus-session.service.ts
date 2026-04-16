import { db } from "@/lib/db";
import type {
  StartSessionInput,
  FinishSessionInput,
} from "@/lib/validators/focus-session";

export const focusSessionService = {
  async start(userId: string, data: StartSessionInput) {
    const config = await db.focusConfig.findFirst({
      where: { id: data.focusConfigId, userId },
    });
    if (!config) throw new Error("CONFIG_NOT_FOUND");

    if (data.objectiveId) {
      const objective = await db.objective.findFirst({
        where: { id: data.objectiveId, userId, deletedAt: null },
      });
      if (!objective) throw new Error("OBJECTIVE_NOT_FOUND");
    }

    // Cancel any in-progress sessions
    await db.focusSession.updateMany({
      where: { userId, status: "IN_PROGRESS" },
      data: { status: "CANCELLED", endedAt: new Date() },
    });

    return db.focusSession.create({
      data: {
        userId,
        focusConfigId: data.focusConfigId,
        objectiveId: data.objectiveId ?? null,
        plannedDuration: config.focusDuration,
        status: "IN_PROGRESS",
        intervals: {
          create: {
            type: "FOCUS",
            startedAt: new Date(),
          },
        },
      },
      include: {
        focusConfig: true,
        intervals: true,
      },
    });
  },

  async finish(userId: string, sessionId: string, data: FinishSessionInput) {
    const session = await db.focusSession.findFirst({
      where: { id: sessionId, userId, status: "IN_PROGRESS" },
      include: { intervals: true },
    });
    if (!session) return null;

    const now = new Date();
    const actualDuration = Math.round(
      (now.getTime() - session.startedAt.getTime()) / 60000
    );

    // Close open intervals
    await db.focusInterval.updateMany({
      where: { sessionId, endedAt: null },
      data: {
        endedAt: now,
        completed: true,
      },
    });

    return db.focusSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        endedAt: now,
        actualDuration,
        notes: data.notes,
        rating: data.rating,
      },
      include: {
        focusConfig: true,
        objective: true,
        intervals: true,
      },
    });
  },

  async cancel(userId: string, sessionId: string) {
    const session = await db.focusSession.findFirst({
      where: { id: sessionId, userId, status: "IN_PROGRESS" },
    });
    if (!session) return null;

    const now = new Date();
    const actualDuration = Math.round(
      (now.getTime() - session.startedAt.getTime()) / 60000
    );

    await db.focusInterval.updateMany({
      where: { sessionId, endedAt: null },
      data: { endedAt: now, completed: false },
    });

    return db.focusSession.update({
      where: { id: sessionId },
      data: {
        status: "CANCELLED",
        endedAt: now,
        actualDuration,
      },
    });
  },

  async getById(userId: string, id: string) {
    return db.focusSession.findFirst({
      where: { id, userId },
      include: {
        focusConfig: true,
        objective: true,
        intervals: { orderBy: { startedAt: "asc" } },
      },
    });
  },

  async list(
    userId: string,
    opts: { objectiveId?: string; status?: string; limit?: number; offset?: number }
  ) {
    const where = {
      userId,
      ...(opts.objectiveId ? { objectiveId: opts.objectiveId } : {}),
      ...(opts.status ? { status: opts.status as never } : {}),
    };

    const [sessions, total] = await Promise.all([
      db.focusSession.findMany({
        where,
        include: {
          focusConfig: { select: { name: true, methodology: true } },
          objective: { select: { id: true, title: true, color: true } },
        },
        orderBy: { startedAt: "desc" },
        take: opts.limit ?? 20,
        skip: opts.offset ?? 0,
      }),
      db.focusSession.count({ where }),
    ]);

    return { sessions, total };
  },

  async addInterval(
    userId: string,
    sessionId: string,
    type: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK"
  ) {
    const session = await db.focusSession.findFirst({
      where: { id: sessionId, userId, status: "IN_PROGRESS" },
    });
    if (!session) return null;

    // Close current open interval
    await db.focusInterval.updateMany({
      where: { sessionId, endedAt: null },
      data: { endedAt: new Date(), completed: true },
    });

    return db.focusInterval.create({
      data: {
        sessionId,
        type,
        startedAt: new Date(),
      },
    });
  },
};
