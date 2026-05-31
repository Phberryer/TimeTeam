import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/sessions/:id/reopen - admin reopens a validated session
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const workSession = await prisma.workSession.findUnique({
    where: { id: params.id },
  });
  if (!workSession) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  if (!workSession.validated) {
    return NextResponse.json({ error: "Session déjà ouverte" }, { status: 400 });
  }

  const updated = await prisma.workSession.update({
    where: { id: params.id },
    data: { validated: false },
    include: {
      employer: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      workType: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
