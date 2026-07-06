import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      totalTreatments,
      totalKnowledge,
      recentAppointments,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({
        where: { date: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.appointment.count({
        where: { status: "pending" },
      }),
      prisma.treatment.count({ where: { isActive: true } }),
      prisma.knowledgeBase.count({ where: { isActive: true } }),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        totalTreatments,
        totalKnowledge,
      },
      recentAppointments,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "İstatistikler alınamadı" },
      { status: 500 }
    );
  }
}
