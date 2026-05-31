import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/sessions/:id/validate - user validates their own session
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workSession = await prisma.workSession.findUnique({
    where: { id: params.id },
  });
  if (!workSession) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  // Only the owner can validate their own session
  if (workSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (workSession.validated) {
    return NextResponse.json({ error: "Session déjà validée" }, { status: 400 });
  }

  if (!workSession.endTime) {
    return NextResponse.json({ error: "Impossible de valider une session en cours" }, { status: 400 });
  }

  const updated = await prisma.workSession.update({
    where: { id: params.id },
    data: { validated: true },
    include: {
      employer: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      workType: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
