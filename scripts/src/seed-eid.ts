import { db, casesTable, suspectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  const existing = await db.select().from(casesTable).where(eq(casesTable.title, "جريمة ليلة العيد"));
  if (existing.length > 0) {
    console.log("Eid case already exists, id:", existing[0].id);
    process.exit(0);
  }

  const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

  const [caseRow] = await db
    .insert(casesTable)
    .values({
      title: "جريمة ليلة العيد",
      description:
        "في ليلة عيد الأضحى المبارك، وُجد جثة تاجر ماشية ثري في منزله الفخم. الباب كان مقفلاً من الداخل، والنوافذ مغلقة — غرفة مقفلة وسط احتفالات العيد. هل يمكنك كشف الجاني قبل أن ينتهي موسم العيد؟",
      difficulty: 3,
      isPublished: true,
      isPremium: false,
      location: "مزرعة آل حمدان — الرياض",
      crimeType: "جريمة قتل",
      reward: 750,
      evidenceList: [
        "سكين ذبح مطلية بدم متجفف في مخزن الماشية",
        "بصمة إبهام جزئية على حافة النافذة المغلقة",
        "رسالة تهديد ورقية بالحناء في جيب الضحية",
        "ساعة مكسورة توقفت عند الثانية عشرة والربع",
        "آثار عطر نسائي فاخر داخل الغرفة المقفلة",
        "مبلغ ضخم من المال مفقود من الخزنة الشخصية",
      ],
      isSeasonal: true,
      seasonName: "عيد الأضحى",
      seasonColor: "#10b981",
      seasonEndDate: endDate,
    })
    .returning();

  console.log("Created Eid case:", caseRow.id);

  await db.insert(suspectsTable).values([
    {
      caseId: caseRow.id,
      name: "فاطمة آل حمدان",
      role: "زوجة الضحية",
      backstory:
        "زوجة التاجر الثري. اكتشفت قبل أسبوع أن زوجها يخطط لتطليقها وسيحرمها من الميراث. لديها إلمام بأمور الذبح من عائلتها البدوية.",
      isGuilty: false,
      deceptionLevel: 7,
      personality:
        "هادئة ومحكومة بالانفعالات. تُظهر الحزن لكنها تُخفي غضباً عميقاً. تتحدث بأدب مفرط وتتهرب من الأسئلة المباشرة.",
      secretInfo:
        "كانت تعلم بمحتوى الوصية لكنها كانت تعتقد أن شقيق الضحية هو الكاتب الحقيقي للرسالة التهديدية.",
      photoUrl:
        "https://api.dicebear.com/7.x/personas/svg?seed=fatima-hamdan&backgroundColor=fef3c7",
    },
    {
      caseId: caseRow.id,
      name: "سالم الحربي",
      role: "شريك الأعمال",
      backstory:
        "شريك التاجر المتأزم مالياً. الضحية رفضت منحه قرضاً طارئاً في عيد الأضحى ما أفقده توازنه. لديه مفتاح نسخة من المنزل من صفقة قديمة.",
      isGuilty: true,
      deceptionLevel: 8,
      personality:
        "متوتر ومتشنج. يُكثر من الحركات العصبية ويُحاول تحويل الاتهامات لشخص آخر. يدّعي أنه كان في حفلة العيد طوال الليل.",
      secretInfo:
        "استخدم مفتاح النسخة للدخول، نفذ الجريمة وغادر بالمال، ثم أقفل الباب من الخارج بحيلة قديمة باستخدام خيط.",
      photoUrl:
        "https://api.dicebear.com/7.x/personas/svg?seed=salem-harbi&backgroundColor=dcfce7",
    },
    {
      caseId: caseRow.id,
      name: "يوسف القحطاني",
      role: "ابن الضحية البكر",
      backstory:
        "الابن الأكبر المقصي من الوصية لخلافات مالية مع والده. عاد للرياض قبل 3 أيام من الجريمة بعد غياب سنتين.",
      isGuilty: false,
      deceptionLevel: 5,
      personality:
        "مشحون عاطفياً ومتمرد. يُظهر حزناً حقيقياً ممزوجاً بالمرارة. صريح أحياناً أكثر مما ينبغي حول كرهه لوالده.",
      secretInfo:
        "كان يعلم بوجود الخزنة المخفية لكنه لم يعلم بمبلغها. زار والده يوم الجريمة أثناء النهار وليس الليل.",
      photoUrl:
        "https://api.dicebear.com/7.x/personas/svg?seed=yousef-qahtani&backgroundColor=dbeafe",
    },
  ]);

  console.log("Inserted 3 suspects for Eid case. Done!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
