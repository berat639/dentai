import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Fetch active treatments and knowledge base from DB
    const [treatments, knowledgeEntries] = await Promise.all([
      prisma.treatment.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.knowledgeBase.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      }),
    ]);

    // Build treatment price list
    const priceList = treatments
      .map((t) => `- ${t.name}: ${t.minPrice.toLocaleString("tr-TR")} - ${t.maxPrice.toLocaleString("tr-TR")} TL${t.duration ? ` (${t.duration})` : ""}`)
      .join("\n");

    // Build knowledge base content
    const knowledgeContent = knowledgeEntries
      .map((k) => `### ${k.title}\n${k.content}`)
      .join("\n\n");

    const systemPrompt = `Sen bir diş kliniği asistanısın. Adın "DentAI". Türkçe konuşuyorsun. Görevlerin:

1. RANDEVU YÖNETİMİ:
- Hasta randevu almak istediğinde: Adını, telefon numarasını, tercih ettiği tarih ve saati sor.
- Randevu saatleri: Pazartesi-Cuma 09:00-18:00, Cumartesi 09:00-14:00, Pazar kapalı.
- Randevuyu onayladığında özet bilgiyi tekrarla.
- Randevu iptal veya değiştirmek isteyenlere yardımcı ol.

2. TEDAVİ BİLGİLERİ VE FİYATLAR:
${priceList || "Fiyat bilgisi henüz girilmemiş."}

3. BİLGİ TABANI:
${knowledgeContent || "Ek bilgi henüz girilmemiş."}

4. GENEL KURALLAR:
- Her zaman nazik, profesyonel ve yardımsever ol.
- Tıbbi teşhis koyma, sadece genel bilgi ver ve muayene öner.
- Acil durumlarda (şiddetli ağrı, kanama, şişlik) en kısa sürede kliniğe gelmelerini söyle.
- Fiyatlar yaklaşıktır, kesin fiyat muayene sonrası belirlenir bunu belirt.
- Kliniğin adresi: Atatürk Cad. No:123, Kadıköy/İstanbul
- Telefon: 0216 555 00 00
- Acil hat: 0532 555 00 00

Konuşmaya "Merhaba! DentAI diş kliniği asistanıyım. Size nasıl yardımcı olabilirim? Randevu almak, tedaviler hakkında bilgi edinmek veya fiyatlarımızı öğrenmek ister misiniz?" diye başla.`;

    return NextResponse.json({ systemPrompt });
  } catch (error) {
    console.error("System prompt error:", error);
    // Fallback to hardcoded prompt
    return NextResponse.json({
      systemPrompt: `Sen bir diş kliniği asistanısın. Adın "DentAI". Türkçe konuşuyorsun. Randevu yönetimi, tedavi bilgileri ve fiyat bilgisi verme görevlerin var. Konuşmaya "Merhaba! DentAI diş kliniği asistanıyım. Size nasıl yardımcı olabilirim?" diye başla.`,
    });
  }
}
