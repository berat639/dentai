import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@dentai.com" },
    update: {},
    create: {
      email: "admin@dentai.com",
      password: hashedPassword,
      name: "Admin",
      role: "admin",
    },
  });
  console.log("✅ Admin user created (admin@dentai.com / admin123)");

  // 2. Create treatments
  const treatments = [
    { name: "Dolgu (Kompozit)", minPrice: 1500, maxPrice: 3000, category: "genel", duration: "30-60 dakika", sortOrder: 1 },
    { name: "Kanal Tedavisi", minPrice: 3000, maxPrice: 5000, category: "genel", duration: "60-90 dakika", sortOrder: 2 },
    { name: "Diş Çekimi (Normal)", minPrice: 1000, maxPrice: 2000, category: "cerrahi", duration: "15-30 dakika", sortOrder: 3 },
    { name: "Diş Çekimi (Cerrahi/20 yaş)", minPrice: 3000, maxPrice: 5000, category: "cerrahi", duration: "30-60 dakika", sortOrder: 4 },
    { name: "Diş Taşı Temizliği", minPrice: 1500, maxPrice: 2500, category: "genel", duration: "30-45 dakika", sortOrder: 5 },
    { name: "Beyazlatma (Ofis Tipi)", minPrice: 5000, maxPrice: 8000, category: "estetik", duration: "60-90 dakika", sortOrder: 6 },
    { name: "Zirkonyum Kaplama (Adet)", minPrice: 7000, maxPrice: 12000, category: "estetik", duration: "2-3 seans", sortOrder: 7 },
    { name: "İmplant (Adet)", minPrice: 15000, maxPrice: 30000, category: "cerrahi", duration: "3-6 ay süreç", sortOrder: 8 },
    { name: "Ortodonti (Tel Tedavisi)", minPrice: 40000, maxPrice: 80000, category: "ortodonti", duration: "12-24 ay", sortOrder: 9 },
    { name: "Şeffaf Plak (Invisalign)", minPrice: 60000, maxPrice: 120000, category: "ortodonti", duration: "6-18 ay", sortOrder: 10 },
    { name: "Laminate Veneer (Adet)", minPrice: 8000, maxPrice: 15000, category: "estetik", duration: "2-3 seans", sortOrder: 11 },
    { name: "Protez (Tam)", minPrice: 15000, maxPrice: 30000, category: "protez", duration: "3-5 seans", sortOrder: 12 },
  ];

  for (const treatment of treatments) {
    await prisma.treatment.upsert({
      where: { id: treatment.name.toLowerCase().replace(/[^a-z0-9]/g, "-") },
      update: treatment,
      create: {
        id: treatment.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        ...treatment,
      },
    });
  }
  console.log(`✅ ${treatments.length} treatments created`);

  // 3. Create knowledge base entries
  const knowledgeEntries = [
    {
      title: "Kliniğimiz Hakkında",
      content: "DentAI Diş Kliniği, Kadıköy'de modern teknoloji ve deneyimli kadrosuyla hizmet vermektedir. Kliniğimizde dijital röntgen, panoramik röntgen, intraoral kamera ve lazer tedavi cihazları bulunmaktadır.",
      category: "genel",
      sortOrder: 1,
    },
    {
      title: "Çalışma Saatleri",
      content: "Pazartesi-Cuma: 09:00-18:00\nCumartesi: 09:00-14:00\nPazar: Kapalı\n\nRandevu almak için 0216 555 00 00 numaralı telefondan bize ulaşabilirsiniz.",
      category: "genel",
      sortOrder: 2,
    },
    {
      title: "Acil Durumlar",
      content: "Şiddetli diş ağrısı, kanama veya şişlik durumunda acil hattımız olan 0532 555 00 00 numarasını arayabilirsiniz. Acil durumlarda mesai saatleri dışında da hizmet verilmektedir.",
      category: "acil",
      sortOrder: 1,
    },
    {
      title: "İmplant Tedavisi Süreci",
      content: "İmplant tedavisi genellikle 3-6 ay sürer. İlk aşamada cerrahi olarak implant vidalanır, ardından iyileşme süreci beklenir. Son aşamada implant üzerine protez yerleştirilir. İşlem lokal anestezi altında yapılır ve ağrısızdır.",
      category: "tedavi",
      sortOrder: 1,
    },
    {
      title: "Ortodonti Tedavisi",
      content: "Ortodonti tedavisi diş ve çene düzensizliklerini düzeltmek için uygulanır. Hem metal braketler hem de şeffaf plak (Invisalign) seçenekleri mevcuttur. Tedavi süresi kişiye göre 6 ay ile 2 yıl arasında değişebilir.",
      category: "tedavi",
      sortOrder: 2,
    },
    {
      title: "Diş Bakım Önerileri",
      content: "Dişlerinizi günde en az 2 kez fırçalayın. Diş ipi kullanmayı ihmal etmeyin. 6 ayda bir düzenli kontrol yaptırın. Şekerli ve asitli yiyeceklerden kaçının. Sigara diş sağlığına ciddi zarar verir.",
      category: "bakim",
      sortOrder: 1,
    },
    {
      title: "Diş Beyazlatma SSS",
      content: "Diş beyazlatma dişlere zarar verir mi?\nHayır, profesyonel beyazlatma dişlere zarar vermez.\n\nSonuçlar ne kadar sürer?\nOrtalama 6-12 ay sürer, bakıma bağlıdır.\n\nBeyazlatma sonrası neler yapılmalıdır?\nİlk 48 saat çay, kahve, sigara ve renkli yiyeceklerden kaçınılmalıdır.",
      category: "sss",
      sortOrder: 1,
    },
  ];

  for (const entry of knowledgeEntries) {
    await prisma.knowledgeBase.create({
      data: entry,
    });
  }
  console.log(`✅ ${knowledgeEntries.length} knowledge base entries created`);

  // 4. Create sample appointments
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const appointments = [
    {
      patientName: "Ahmet Yılmaz",
      patientPhone: "0532 123 45 67",
      treatmentType: "Dolgu (Kompozit)",
      date: tomorrow,
      time: "10:00",
      status: "confirmed",
      source: "phone",
    },
    {
      patientName: "Fatma Kaya",
      patientPhone: "0533 234 56 78",
      treatmentType: "Diş Taşı Temizliği",
      date: tomorrow,
      time: "14:00",
      status: "pending",
      source: "phone",
    },
    {
      patientName: "Mehmet Demir",
      patientPhone: "0534 345 67 89",
      treatmentType: "Kanal Tedavisi",
      date: nextWeek,
      time: "11:00",
      status: "pending",
      source: "admin",
    },
  ];

  for (const apt of appointments) {
    await prisma.appointment.create({ data: apt });
  }
  console.log(`✅ ${appointments.length} sample appointments created`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("📧 Admin login: admin@dentai.com");
  console.log("🔑 Admin password: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
