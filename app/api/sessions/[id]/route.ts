import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/sessions/:id - stop or update a session
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

  // Only owner or admin can update
  if (workSession.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { action, employerId, clientId, workType, notes, validated } = body;

  let data: Record<string, unknown> = {};

  if (action === "stop") {
    if (workSession.endTime) {
      return NextResponse.json({ error: "Session déjà terminée" }, { status: 400 });
    }
    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - workSession.startTime.getTime()) / 60000
    );
    data = { endTime, duration };
  }

  // Allow corrections on employer/client/workType regardless of action
  if (employerId !== undefined) data.employerId = employerId || null;
  if (clientId !== undefined) data.clientId = clientId || null;
  if (workType !== undefined) data.workType = workType;
  if (notes !== undefined) data.notes = notes || null;
  if (validated !== undefined && session.user.role === "ADMIN") {
    data.validated = validated;
  }

  const updated = await prisma.workSession.update({
    where: { id: params.id },
    data,
    include: {
      employer: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/sessions/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workSession = await prisma.workSession.findUnique({
    where: { id: params.id },
  });
  if (!workSession) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  if (workSession.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.workSession.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
