import { db } from "@/lib/db";
import { hash, compare } from "bcryptjs";

export const userService = {
  async getProfile(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        preferences: true,
        accounts: {
          select: { provider: true },
        },
      },
    });
  },

  async updateProfile(
    userId: string,
    data: { name?: string; image?: string }
  ) {
    return db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new Error("NO_PASSWORD"); // OAuth-only account
    }

    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("WRONG_PASSWORD");
    }

    const passwordHash = await hash(newPassword, 12);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },

  async updatePreferences(
    userId: string,
    data: {
      theme?: string;
      language?: string;
      soundEnabled?: boolean;
      notificationsEnabled?: boolean;
    }
  ) {
    return db.userPreferences.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  },

  async deleteAccount(userId: string) {
    // Cascade delete handles all related data
    await db.user.delete({ where: { id: userId } });
  },

  async exportData(userId: string) {
    const [user, objectives, sessions, configs, tags] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          createdAt: true,
          preferences: true,
        },
      }),
      db.objective.findMany({
        where: { userId },
        include: { tags: { include: { tag: true } } },
      }),
      db.focusSession.findMany({
        where: { userId },
        include: { intervals: true },
      }),
      db.focusConfig.findMany({ where: { userId } }),
      db.tag.findMany({ where: { userId } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      objectives,
      focusSessions: sessions,
      focusConfigs: configs,
      tags,
    };
  },
};
