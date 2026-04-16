import { db } from "@/lib/db";
import type {
  CreateFocusConfigInput,
  UpdateFocusConfigInput,
} from "@/lib/validators/focus-config";

export const focusConfigService = {
  async list(userId: string) {
    return db.focusConfig.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
  },

  async getById(userId: string, id: string) {
    return db.focusConfig.findFirst({
      where: { id, userId },
    });
  },

  async create(userId: string, data: CreateFocusConfigInput) {
    if (data.isDefault) {
      await db.focusConfig.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return db.focusConfig.create({
      data: { ...data, userId },
    });
  },

  async update(userId: string, id: string, data: UpdateFocusConfigInput) {
    const existing = await db.focusConfig.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    if (data.isDefault) {
      await db.focusConfig.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return db.focusConfig.update({
      where: { id },
      data,
    });
  },

  async delete(userId: string, id: string) {
    const existing = await db.focusConfig.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    const sessionsUsing = await db.focusSession.count({
      where: { focusConfigId: id },
    });
    if (sessionsUsing > 0) {
      throw new Error("CONFIG_IN_USE");
    }

    return db.focusConfig.delete({ where: { id } });
  },
};
