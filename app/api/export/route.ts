import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExcelBuffer } from "@/lib/export";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const userId = searchParams.get("userId");

  const whereUserId =
    session.user.role === "ADMIN" && userId ? userId : session.user.id;

  const sessions = await prisma.workSession.findMany({
    where: {
      userId: whereUserId,
      ...(from && { startTime: { gte: new Date(from) } }),
      ...(to && { startTime: { lte: new Date(to) } }),
    },
    include: {
      employer: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const title = `TimeTeam – Export ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`;
  const buffer = generateExcelBuffer(sessions, title);

  const filename = `timeteam-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
