import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Load today's sessions
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todaySessions, runningSession, userEmployers, clients] = await Promise.all([
    prisma.workSession.findMany({
      where: {
        userId: session.user.id,
        startTime: { gte: todayStart, lte: todayEnd },
      },
      include: {
        employer: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "desc" },
    }),
    prisma.workSession.findFirst({
      where: { userId: session.user.id, endTime: null },
      include: {
        employer: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.employer.findMany({
      where: { users: { some: { userId: session.user.id } } },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <DashboardClient
      initialSessions={JSON.parse(JSON.stringify(todaySessions))}
      initialRunning={runningSession ? JSON.parse(JSON.stringify(runningSession)) : null}
      employers={userEmployers}
      clients={clients}
      userName={session.user.name ?? session.user.email ?? ""}
    />
  );
}
