import { db } from "@/lib/db";
import type {
  CreateObjectiveInput,
  UpdateObjectiveInput,
} from "@/lib/validators/objective";

export const objectiveService = {
  async list(userId: string, status?: string) {
    return db.objective.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        tags: { include: { tag: true } },
        _count: { select: { focusSessions: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async getById(userId: string, id: string) {
    return db.objective.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        _count: { select: { focusSessions: true } },
      },
    });
  },

  async create(userId: string, data: CreateObjectiveInput) {
    const { tagIds, deadline, ...rest } = data;
    return db.objective.create({
      data: {
        ...rest,
        userId,
        deadline: deadline ? new Date(deadline) : undefined,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });
  },

  async update(userId: string, id: string, data: UpdateObjectiveInput) {
    const existing = await db.objective.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!existing) return null;

    const { tagIds, deadline, ...rest } = data;

    if (tagIds !== undefined) {
      await db.tagOnObjective.deleteMany({ where: { objectiveId: id } });
    }

    return db.objective.update({
      where: { id },
      data: {
        ...rest,
        deadline: deadline ? new Date(deadline) : undefined,
        tags:
          tagIds !== undefined
            ? { create: tagIds.map((tagId) => ({ tagId })) }
            : undefined,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });
  },

  async delete(userId: string, id: string) {
    const existing = await db.objective.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!existing) return null;

    return db.objective.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async getProgress(userId: string, id: string) {
    const objective = await db.objective.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!objective) return null;

    const sessions = await db.focusSession.findMany({
      where: {
        objectiveId: id,
        userId,
        status: "COMPLETED",
      },
      select: {
        actualDuration: true,
      },
    });

    const totalMinutes = sessions.reduce(
      (sum, s) => sum + (s.actualDuration ?? 0),
      0
    );
    const totalHours = totalMinutes / 60;
    const totalSessions = sessions.length;

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalSessions,
      targetHours: objective.targetHours,
      targetSessions: objective.targetSessions,
      percentHours: objective.targetHours
        ? Math.min(100, Math.round((totalHours / objective.targetHours) * 100))
        : null,
      percentSessions: objective.targetSessions
        ? Math.min(
            100,
            Math.round((totalSessions / objective.targetSessions) * 100)
          )
        : null,
    };
  },
};
