import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/custom-roles - list all custom roles
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const roles = await prisma.customRole.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
  return NextResponse.json(roles);
}

// POST /api/custom-roles - create (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { name, canEditEmployer, canEditClient, canEditWorkType, canEditNotes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  try {
    const role = await prisma.customRole.create({
      data: {
        name: name.trim(),
        canEditEmployer: canEditEmployer ?? true,
        canEditClient: canEditClient ?? true,
        canEditWorkType: canEditWorkType ?? true,
        canEditNotes: canEditNotes ?? true,
      },
    });
    return NextResponse.json(role);
  } catch {
    return NextResponse.json({ error: "Ce nom est déjà utilisé" }, { status: 400 });
  }
}
