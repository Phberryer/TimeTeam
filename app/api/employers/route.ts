import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // If admin: return all employers with user counts
  if (session.user.role === "ADMIN") {
    const employers = await prisma.employer.findMany({
      include: { _count: { select: { users: true, workSessions: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(employers);
  }

  // Regular user: only their assigned employers
  const employers = await prisma.employer.findMany({
    where: { users: { some: { userId: session.user.id } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(employers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const employer = await prisma.employer.create({ data: { name: name.trim() } });
  return NextResponse.json(employer, { status: 201 });
}
