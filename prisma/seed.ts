import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash("Test1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "test@melonfocus.com" },
    update: {},
    create: {
      name: "Test User",
      email: "test@melonfocus.com",
      emailVerified: new Date(),
      passwordHash,
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: "system",
      language: "pt-BR",
    },
  });

  const pomodoro = await prisma.focusConfig.create({
    data: {
      userId: user.id,
      name: "Pomodoro Classico",
      methodology: "POMODORO",
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      isDefault: true,
    },
  });

  await prisma.focusConfig.create({
    data: {
      userId: user.id,
      name: "Deep Work 90min",
      methodology: "DEEP_WORK",
      focusDuration: 90,
      shortBreakDuration: 15,
      longBreakDuration: null,
      sessionsBeforeLongBreak: null,
    },
  });

  await prisma.focusConfig.create({
    data: {
      userId: user.id,
      name: "Flowtime Livre",
      methodology: "FLOWTIME",
      focusDuration: 0,
      shortBreakDuration: 10,
      longBreakDuration: null,
      sessionsBeforeLongBreak: null,
    },
  });

  const tagStudy = await prisma.tag.create({
    data: { userId: user.id, name: "Estudo", color: "#3b82f6" },
  });

  const tagWork = await prisma.tag.create({
    data: { userId: user.id, name: "Trabalho", color: "#ef4444" },
  });

  const obj1 = await prisma.objective.create({
    data: {
      userId: user.id,
      title: "Aprender TypeScript avancado",
      description: "Dominar generics, utility types e patterns avancados",
      targetHours: 50,
      status: "ACTIVE",
      color: "#6366f1",
      tags: { create: { tagId: tagStudy.id } },
    },
  });

  const obj2 = await prisma.objective.create({
    data: {
      userId: user.id,
      title: "Projeto freelance - landing page",
      targetSessions: 20,
      deadline: new Date("2026-05-15"),
      status: "ACTIVE",
      color: "#f59e0b",
      tags: { create: { tagId: tagWork.id } },
    },
  });

  const now = new Date();
  for (let i = 0; i < 15; i++) {
    const startedAt = new Date(now);
    startedAt.setDate(startedAt.getDate() - i);
    startedAt.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

    const duration = [25, 25, 45, 90][Math.floor(Math.random() * 4)];

    await prisma.focusSession.create({
      data: {
        userId: user.id,
        objectiveId: i % 2 === 0 ? obj1.id : obj2.id,
        focusConfigId: pomodoro.id,
        startedAt,
        endedAt: new Date(startedAt.getTime() + duration * 60 * 1000),
        plannedDuration: duration,
        actualDuration: duration,
        status: "COMPLETED",
        rating: 3 + Math.floor(Math.random() * 3),
        intervals: {
          create: {
            type: "FOCUS",
            startedAt,
            endedAt: new Date(startedAt.getTime() + duration * 60 * 1000),
            duration: duration * 60,
            completed: true,
          },
        },
      },
    });
  }

  console.log("Seed completed: 1 user, 3 configs, 2 tags, 2 objectives, 15 sessions");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
