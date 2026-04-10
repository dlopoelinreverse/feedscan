import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Realistic score distribution: mostly 4-5, some 1-2, few 3
function weightedScore(): number {
  const r = Math.random();
  if (r < 0.45) return 5;
  if (r < 0.75) return 4;
  if (r < 0.82) return 3;
  if (r < 0.92) return 2;
  return 1;
}

const FOOD_LOW = ["Plat froid", "Goût décevant", "Portion petite"];
const FOOD_HIGH = ["Saveurs", "Fraîcheur", "Présentation"];
const SERVICE_LOW = ["Attente longue", "Personnel peu aimable", "Erreur commande"];
const SERVICE_HIGH = ["Rapidité", "Sourire", "Attention"];

const COMMENTS = [
  "Excellente soirée, on reviendra !",
  "Les pâtes étaient parfaites.",
  "Service un peu lent mais l'ambiance rattrape.",
  "Mon plat était froid, dommage.",
  "Équipe adorable, merci !",
  "Bon rapport qualité-prix.",
  "Trop de bruit pour discuter.",
  "La pizza était divine.",
  "Serveur très attentionné.",
  "Attente beaucoup trop longue.",
  "Parfait pour un dîner en amoureux.",
  "Ambiance chaleureuse, plats savoureux.",
];

async function main() {
  console.log("🌱 Seeding database...");

  // Use first existing User (logged-in dev) if present, otherwise create a placeholder
  let user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: "demo@feedscan.local",
        name: "Demo",
        businessName: "Chez Marco — Trattoria",
        businessType: "Restaurant",
        plan: "PRO",
      },
    });
    console.log("  ⚠ No existing user; created demo user", user.email);
    console.log("     → You'll need to sign up with this email or update the seed.");
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        businessName: "Chez Marco — Trattoria",
        businessType: "Restaurant",
        plan: "PRO",
      },
    });
    console.log(`  ✓ Using existing user ${user.email}`);
  }

  // Wipe previous seeded forms for this user (cascades questions, responses)
  await prisma.form.deleteMany({ where: { userId: user.id } });

  // --- Form 1: Satisfaction restaurant (ACTIVE) ---
  const form1 = await prisma.form.create({
    data: {
      userId: user.id,
      title: "Satisfaction restaurant",
      titleFr: "Satisfaction restaurant",
      titleEn: "Restaurant satisfaction",
      description: "Merci de partager votre avis !",
      descriptionFr: "Merci de partager votre avis !",
      descriptionEn: "Thanks for sharing your feedback!",
      status: "ACTIVE",
      slug: `satisfaction-${randomUUID().slice(0, 8)}`,
      rateLimitMode: "PER_24H",
    },
  });

  const q1 = await prisma.question.create({
    data: {
      formId: form1.id,
      type: "STARS",
      label: "Comment évaluez-vous la qualité des plats ?",
      labelFr: "Comment évaluez-vous la qualité des plats ?",
      labelEn: "How would you rate the quality of the food?",
      order: 0,
      hasBranching: true,
    },
  });
  await prisma.followUpRule.createMany({
    data: [
      {
        questionId: q1.id,
        triggerType: "LOW",
        triggerMin: 1,
        triggerMax: 2,
        followUpLabel: "Qu'est-ce qui a cloché ?",
        followUpLabelFr: "Qu'est-ce qui a cloché ?",
        followUpOptions: FOOD_LOW,
      },
      {
        questionId: q1.id,
        triggerType: "HIGH",
        triggerMin: 4,
        triggerMax: 5,
        followUpLabel: "Qu'avez-vous apprécié ?",
        followUpLabelFr: "Qu'avez-vous apprécié ?",
        followUpOptions: FOOD_HIGH,
      },
    ],
  });

  const q2 = await prisma.question.create({
    data: {
      formId: form1.id,
      type: "EMOJI",
      label: "Comment était le service ?",
      labelFr: "Comment était le service ?",
      labelEn: "How was the service?",
      order: 1,
      hasBranching: true,
      options: ["😞", "😐", "🙂", "😊", "🤩"],
    },
  });
  await prisma.followUpRule.createMany({
    data: [
      {
        questionId: q2.id,
        triggerType: "LOW",
        triggerMin: 1,
        triggerMax: 2,
        followUpLabel: "Que pouvons-nous améliorer ?",
        followUpLabelFr: "Que pouvons-nous améliorer ?",
        followUpOptions: SERVICE_LOW,
      },
      {
        questionId: q2.id,
        triggerType: "HIGH",
        triggerMin: 4,
        triggerMax: 5,
        followUpLabel: "Qu'avez-vous apprécié ?",
        followUpLabelFr: "Qu'avez-vous apprécié ?",
        followUpOptions: SERVICE_HIGH,
      },
    ],
  });

  const q3 = await prisma.question.create({
    data: {
      formId: form1.id,
      type: "CHOICE",
      label: "Qu'est-ce qui vous a le plus plu ?",
      labelFr: "Qu'est-ce qui vous a le plus plu ?",
      labelEn: "What did you enjoy most?",
      order: 2,
      options: ["Les plats", "Le service", "L'ambiance", "Le prix"],
    },
  });

  const q4 = await prisma.question.create({
    data: {
      formId: form1.id,
      type: "STARS",
      label: "Propreté des lieux ?",
      labelFr: "Propreté des lieux ?",
      labelEn: "Cleanliness?",
      order: 3,
    },
  });

  const q5 = await prisma.question.create({
    data: {
      formId: form1.id,
      type: "TEXT",
      label: "Un commentaire ?",
      labelFr: "Un commentaire ?",
      labelEn: "Any comment?",
      order: 4,
      required: false,
    },
  });

  // QR code for the form
  const qr1 = await prisma.qRCode.create({
    data: {
      formId: form1.id,
      label: "Table principale",
      uniqueCode: `qr-${randomUUID().slice(0, 10)}`,
      scans: 0, // incremented below
    },
  });

  // --- Form 2: Feedback brunch (ARCHIVED) ---
  const form2 = await prisma.form.create({
    data: {
      userId: user.id,
      title: "Feedback brunch",
      titleFr: "Feedback brunch",
      titleEn: "Brunch feedback",
      status: "ARCHIVED",
      slug: `brunch-${randomUUID().slice(0, 8)}`,
      rateLimitMode: "PER_24H",
    },
  });
  await prisma.question.createMany({
    data: [
      { formId: form2.id, type: "STARS", label: "Qualité du brunch ?", labelFr: "Qualité du brunch ?", order: 0 },
      { formId: form2.id, type: "EMOJI", label: "Accueil ?", labelFr: "Accueil ?", order: 1, options: ["😞", "😐", "🙂", "😊", "🤩"] },
      { formId: form2.id, type: "CHOICE", label: "Ce qui vous a plu ?", labelFr: "Ce qui vous a plu ?", order: 2, options: ["Café", "Viennoiseries", "Œufs", "Ambiance"] },
      { formId: form2.id, type: "TEXT", label: "Commentaire", labelFr: "Commentaire", order: 3, required: false },
    ],
  });

  // --- Visitors ---
  const visitors = await Promise.all(
    Array.from({ length: 30 }, () =>
      prisma.visitor.create({
        data: {
          fingerprintHash: randomUUID(),
          cookieId: randomUUID(),
        },
      })
    )
  );

  // --- Responses for form1 over last 60 days ---
  const now = new Date();
  const totalResponses = randInt(160, 200);
  let recentBoostBudget = Math.floor(totalResponses * 0.3);

  for (let i = 0; i < totalResponses; i++) {
    let daysAgo: number;
    if (recentBoostBudget > 0 && Math.random() < 0.55) {
      daysAgo = randInt(0, 7);
      recentBoostBudget--;
    } else {
      daysAgo = randInt(0, 60);
    }
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(randInt(10, 22), randInt(0, 59), 0, 0);

    const s1 = weightedScore();
    const s2 = weightedScore();
    const s4 = weightedScore();
    const choice = rand(["Les plats", "Le service", "L'ambiance", "Le prix"]);

    const answers: Record<string, {
      value: number | string;
      followUp?: { selected: string[]; freeText?: string };
    }> = {
      [q1.id]: {
        value: s1,
        ...(s1 <= 2
          ? { followUp: { selected: [rand(FOOD_LOW), rand(FOOD_LOW)].filter((v, i, a) => a.indexOf(v) === i) } }
          : s1 >= 4
          ? { followUp: { selected: [rand(FOOD_HIGH)] } }
          : {}),
      },
      [q2.id]: {
        value: s2,
        ...(s2 <= 2
          ? { followUp: { selected: [rand(SERVICE_LOW), rand(SERVICE_LOW)].filter((v, i, a) => a.indexOf(v) === i) } }
          : s2 >= 4
          ? { followUp: { selected: [rand(SERVICE_HIGH)] } }
          : {}),
      },
      [q3.id]: { value: choice },
      [q4.id]: { value: s4 },
      ...(Math.random() < 0.4 ? { [q5.id]: { value: rand(COMMENTS) } } : {}),
    };

    await prisma.response.create({
      data: {
        formId: form1.id,
        qrCodeId: qr1.id,
        visitorId: rand(visitors).id,
        answers,
        metadata: { device: rand(["mobile", "tablet", "desktop"]), lang: rand(["fr", "en"]) },
        createdAt,
      },
    });
  }

  // Scans = responses × ~1.15 to give ~87% completion
  await prisma.qRCode.update({
    where: { id: qr1.id },
    data: { scans: Math.round(totalResponses / 0.87) },
  });

  console.log(`✓ Seeded ${totalResponses} responses for form '${form1.title}'`);
  console.log("🌱 Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
