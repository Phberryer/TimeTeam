import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/custom-roles/:id - update (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { name, canEditEmployer, canEditClient, canEditWorkType, canEditNotes } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (canEditEmployer !== undefined) data.canEditEmployer = canEditEmployer;
  if (canEditClient !== undefined) data.canEditClient = canEditClient;
  if (canEditWorkType !== undefined) data.canEditWorkType = canEditWorkType;
  if (canEditNotes !== undefined) data.canEditNotes = canEditNotes;

  try {
    const role = await prisma.customRole.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(role);
  } catch {
    return NextResponse.json({ error: "Rôle introuvable ou nom déjà utilisé" }, { status: 400 });
  }
}

// DELETE /api/custom-roles/:id - delete (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Unlink users first
  await prisma.user.updateMany({
    where: { customRoleId: params.id },
    data: { customRoleId: null },
  });

  await prisma.customRole.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
