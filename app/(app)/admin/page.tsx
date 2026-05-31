import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "@/components/admin-client";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const [users, employers, clients, workTypes, recentSessions, customRoles] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        customRoleId: true,
        createdAt: true,
        employers: {
          include: { employer: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.employer.findMany({
      include: { _count: { select: { users: true, workSessions: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      include: { _count: { select: { workSessions: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.workType.findMany({
      include: { _count: { select: { workSessions: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.workSession.findMany({
      take: 50,
      orderBy: { startTime: "desc" },
      include: {
        employer: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        workType: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.customRole.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminClient
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialEmployers={JSON.parse(JSON.stringify(employers))}
      initialClients={JSON.parse(JSON.stringify(clients))}
      initialWorkTypes={JSON.parse(JSON.stringify(workTypes))}
      initialSessions={JSON.parse(JSON.stringify(recentSessions))}
      initialCustomRoles={JSON.parse(JSON.stringify(customRoles))}
    />
  );
}
