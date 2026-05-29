import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/users/:id - update role or employer assignments
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { role, employerIds } = body;

  const updateData: Record<string, unknown> = {};
  if (role) updateData.role = role;

  // If employerIds provided, replace the assignments
  if (Array.isArray(employerIds)) {
    await prisma.userEmployer.deleteMany({ where: { userId: params.id } });
    if (employerIds.length > 0) {
      await prisma.userEmployer.createMany({
        data: employerIds.map((eid: string) => ({
          userId: params.id,
          employerId: eid,
        })),
      });
    }
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      employers: {
        include: { employer: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(user);
}
