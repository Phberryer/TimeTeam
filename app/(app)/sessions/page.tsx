import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionsClient } from "@/components/sessions-client";

export default async function SessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [sessions, employers, clients, currentUser] = await Promise.all([
    prisma.workSession.findMany({
      where: { userId: session.user.id },
      include: {
        employer: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        workType: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "desc" },
      take: 200,
    }),
    prisma.employer.findMany({
      where: { users: { some: { userId: session.user.id } } },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { customRole: true },
    }),
  ]);

  const isAdmin = session.user.role === "ADMIN";
  const customRole = currentUser?.customRole ?? null;
  const permissions = {
    canEditEmployer: isAdmin || !customRole || customRole.canEditEmployer,
    canEditClient: isAdmin || !customRole || customRole.canEditClient,
    canEditWorkType: isAdmin || !customRole || customRole.canEditWorkType,
    canEditNotes: isAdmin || !customRole || customRole.canEditNotes,
    canValidate: true, // evaluated per-session in client
    canReopen: isAdmin,
  };

  return (
    <SessionsClient
      initialSessions={JSON.parse(JSON.stringify(sessions))}
      employers={employers}
      clients={clients}
      userId={session.user.id}
      permissions={permissions}
    />
  );
}
