import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sessions - list sessions for current user (or all if admin)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const all = searchParams.get("all") === "true";

  const whereUserId =
    session.user.role === "ADMIN" && (all || userId)
      ? userId ?? undefined
      : session.user.id;

  const sessions = await prisma.workSession.findMany({
    where: { userId: whereUserId },
    include: {
      employer: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: "desc" },
    take: 200,
  });

  return NextResponse.json(sessions);
}

// POST /api/sessions - start a new session
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { employerId, clientId, workType, notes } = body;

  // Check for an already-running session
  const running = await prisma.workSession.findFirst({
    where: { userId: session.user.id, endTime: null },
  });
  if (running) {
    return NextResponse.json(
      { error: "Une session est déjà en cours. Arrêtez-la d'abord." },
      { status: 400 }
    );
  }

  const workSession = await prisma.workSession.create({
    data: {
      userId: session.user.id,
      employerId: employerId || null,
      clientId: clientId || null,
      workType: workType || "AUTRE",
      startTime: new Date(),
      notes: notes || null,
    },
    include: {
      employer: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(workSession, { status: 201 });
}
