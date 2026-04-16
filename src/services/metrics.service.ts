import { db } from "@/lib/db";

export const metricsService = {
  async getOverview(userId: string) {
    const sessions = await db.focusSession.findMany({
      where: { userId, status: "COMPLETED" },
      select: {
        actualDuration: true,
        startedAt: true,
        rating: true,
      },
      orderBy: { startedAt: "desc" },
    });

    const totalMinutes = sessions.reduce(
      (sum, s) => sum + (s.actualDuration ?? 0),
      0
    );
    const totalSessions = sessions.length;
    const avgDuration =
      totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    const avgRating =
      sessions.filter((s) => s.rating).length > 0
        ? Math.round(
            (sessions
              .filter((s) => s.rating)
              .reduce((sum, s) => sum + s.rating!, 0) /
              sessions.filter((s) => s.rating).length) *
              10
          ) / 10
        : null;

    const streak = this.calculateStreak(sessions.map((s) => s.startedAt));

    return {
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalSessions,
      avgDuration,
      avgRating,
      currentStreak: streak.current,
      longestStreak: streak.longest,
    };
  },

  async getDaily(userId: string, from: Date, to: Date) {
    const sessions = await db.focusSession.findMany({
      where: {
        userId,
        status: "COMPLETED",
        startedAt: { gte: from, lte: to },
      },
      select: {
        startedAt: true,
        actualDuration: true,
      },
      orderBy: { startedAt: "asc" },
    });

    const dailyMap = new Map<string, { minutes: number; sessions: number }>();

    for (const s of sessions) {
      const day = s.startedAt.toISOString().split("T")[0];
      const entry = dailyMap.get(day) ?? { minutes: 0, sessions: 0 };
      entry.minutes += s.actualDuration ?? 0;
      entry.sessions += 1;
      dailyMap.set(day, entry);
    }

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      hours: Math.round((data.minutes / 60) * 10) / 10,
      sessions: data.sessions,
    }));
  },

  async getByObjective(userId: string) {
    const objectives = await db.objective.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        color: true,
        targetHours: true,
        targetSessions: true,
        focusSessions: {
          where: { status: "COMPLETED" },
          select: { actualDuration: true },
        },
      },
    });

    return objectives.map((obj) => {
      const totalMinutes = obj.focusSessions.reduce(
        (sum, s) => sum + (s.actualDuration ?? 0),
        0
      );
      return {
        id: obj.id,
        title: obj.title,
        color: obj.color,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalSessions: obj.focusSessions.length,
        targetHours: obj.targetHours,
        targetSessions: obj.targetSessions,
      };
    });
  },

  async getInsights(userId: string) {
    const sessions = await db.focusSession.findMany({
      where: { userId, status: "COMPLETED" },
      select: {
        startedAt: true,
        actualDuration: true,
        rating: true,
        plannedDuration: true,
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    if (sessions.length < 5) return [];

    const insights: { type: string; message: string }[] = [];

    // Most productive hour
    const hourCounts = new Map<number, number>();
    for (const s of sessions) {
      const hour = s.startedAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }
    const topHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topHour) {
      insights.push({
        type: "productive_hour",
        message: `Seu horario mais produtivo e por volta das ${topHour[0]}h`,
      });
    }

    // Most productive day of week
    const dayNames = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    const dayCounts = new Map<number, number>();
    for (const s of sessions) {
      const day = s.startedAt.getDay();
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }
    const topDay = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topDay) {
      insights.push({
        type: "productive_day",
        message: `Voce foca mais nas ${dayNames[topDay[0]]}s`,
      });
    }

    // Completion rate
    const allSessions = await db.focusSession.count({ where: { userId } });
    const completedCount = sessions.length;
    if (allSessions > 0) {
      const rate = Math.round((completedCount / allSessions) * 100);
      insights.push({
        type: "completion_rate",
        message: `Sua taxa de conclusao e de ${rate}%`,
      });
    }

    // Streak
    const streak = this.calculateStreak(sessions.map((s) => s.startedAt));
    if (streak.current >= 3) {
      insights.push({
        type: "streak",
        message: `Voce manteve foco por ${streak.current} dias seguidos!`,
      });
    }

    return insights;
  },

  calculateStreak(dates: Date[]) {
    if (dates.length === 0) return { current: 0, longest: 0 };

    const uniqueDays = [
      ...new Set(dates.map((d) => d.toISOString().split("T")[0])),
    ].sort((a, b) => b.localeCompare(a)); // desc

    let current = 1;
    let longest = 1;
    let tempStreak = 1;

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    // Current streak only counts if most recent is today or yesterday
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
      current = 0;
    }

    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;

      if (diff === 1) {
        tempStreak++;
        if (i <= current || current > 0) current = tempStreak;
      } else {
        tempStreak = 1;
        if (current === 0) current = 0;
      }
      longest = Math.max(longest, tempStreak);
    }

    return { current, longest };
  },
};
