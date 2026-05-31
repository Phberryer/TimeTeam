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
  const { action, employerId, clientId, workTypeId, notes, validated } = body;

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
  } else {
    // Non-stop update: check if session is validated and user is not admin
    if (workSession.validated && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Session validée — modification non autorisée" }, { status: 403 });
    }

    // Fetch user's customRole permissions if not admin
    let customRole: {
      canEditEmployer: boolean;
      canEditClient: boolean;
      canEditWorkType: boolean;
      canEditNotes: boolean;
    } | null = null;

    if (session.user.role !== "ADMIN") {
      const userWithRole = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { customRole: true },
      });
      customRole = userWithRole?.customRole ?? null;
    }

    // Apply field updates with permission checks
    if (employerId !== undefined) {
      if (session.user.role === "ADMIN" || !customRole || customRole.canEditEmployer) {
        data.employerId = employerId || null;
      } else {
        return NextResponse.json({ error: "Non autorisé à modifier l'employeur" }, { status: 403 });
      }
    }
    if (clientId !== undefined) {
      if (session.user.role === "ADMIN" || !customRole || customRole.canEditClient) {
        data.clientId = clientId || null;
      } else {
        return NextResponse.json({ error: "Non autorisé à modifier le client" }, { status: 403 });
      }
    }
    if (workTypeId !== undefined) {
      if (session.user.role === "ADMIN" || !customRole || customRole.canEditWorkType) {
        data.workTypeId = workTypeId || null;
      } else {
        return NextResponse.json({ error: "Non autorisé à modifier le type de travail" }, { status: 403 });
      }
    }
    if (notes !== undefined) {
      if (session.user.role === "ADMIN" || !customRole || customRole.canEditNotes) {
        data.notes = notes || null;
      } else {
        return NextResponse.json({ error: "Non autorisé à modifier les notes" }, { status: 403 });
      }
    }
  }

  // Admin-only: toggle validated directly via PATCH body
  if (validated !== undefined && session.user.role === "ADMIN") {
    data.validated = validated;
  }

  const updated = await prisma.workSession.update({
    where: { id: params.id },
    data,
    include: {
      employer: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      workType: { select: { id: true, name: true } },
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
