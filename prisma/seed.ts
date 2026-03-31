import {
  PrismaClient,
  UserRole,
  CostCenterType,
  ConnectorType,
  InvoiceDirection,
  InvoiceStatus,
  ExpenseFrequency,
  ExpenseCategory,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Data ───────────────────────────────────────────────────

const CLIENTS = [
  { name: "Acme Italia Srl", vat: "IT01234567890" },
  { name: "Tech Solutions SpA", vat: "IT09876543210" },
  { name: "Digital Factory Srl", vat: "IT11223344556" },
  { name: "Innovazione Digitale Srl", vat: "IT22334455667" },
  { name: "Green Energy Srl", vat: "IT33445566778" },
  { name: "Studio Legale Bianchi", vat: "IT44556677889" },
  { name: "Farmacia Centrale Snc", vat: "IT55667788990" },
  { name: "Ristorante Da Mario Srl", vat: "IT66778899001" },
  { name: "Edil Costruzioni SpA", vat: "IT77889900112" },
  { name: "Auto Service Srl", vat: "IT88990011223" },
  { name: "Mediacom Agency Srl", vat: "IT99001122334" },
  { name: "Logistica Express Srl", vat: "IT10203040506" },
];

const SUPPLIERS = [
  { name: "Amazon Web Services EMEA", vat: "IE9692928F" },
  { name: "Microsoft Ireland Operations", vat: "IE8256796U" },
  { name: "Google Cloud Italy Srl", vat: "IT09596321006" },
  { name: "Aruba SpA", vat: "IT01573850516" },
  { name: "TIM SpA", vat: "IT00488410010" },
  { name: "Enel Energia SpA", vat: "IT06655971007" },
  { name: "Vodafone Italia SpA", vat: "IT08539010010" },
  { name: "Studio Commercialista Rossi", vat: "IT12345670158" },
  { name: "Assicurazioni Generali SpA", vat: "IT00079760328" },
  { name: "Mondadori Retail Srl", vat: "IT07333330964" },
  { name: "Ikea Italia Retail Srl", vat: "IT11049670152" },
  { name: "JetBrains Srl", vat: "CZ28204590" },
];

const ACTIVE_INVOICE_DESCRIPTIONS = [
  "Sviluppo applicazione web React/Next.js",
  "Consulenza architettura cloud AWS",
  "Manutenzione trimestrale sistemi IT",
  "Sviluppo API REST backend Node.js",
  "Workshop formativo TypeScript avanzato",
  "Migrazione database PostgreSQL",
  "Implementazione sistema CI/CD",
  "Consulenza GDPR e sicurezza informatica",
  "Sviluppo app mobile React Native",
  "Supporto tecnico mensile",
  "Audit infrastruttura IT",
  "Sviluppo e-commerce headless",
  "Configurazione server e networking",
  "Formazione team sviluppo agile",
  "Integrazione API fatturazione elettronica",
];

const PASSIVE_INVOICE_DESCRIPTIONS = [
  "Servizio hosting cloud mensile",
  "Licenza software Enterprise annuale",
  "Canone servizi telefonici",
  "Fornitura energia elettrica",
  "Consulenza fiscale trimestrale",
  "Abbonamento piattaforma cloud",
  "Servizi di connettività internet",
  "Polizza assicurativa RC professionale",
  "Acquisto licenze Microsoft 365",
  "Servizi di co-working mensile",
  "Noleggio stampanti e materiale ufficio",
  "Abbonamento strumenti sviluppo",
];

// ─── Main Seed ──────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.bankStatement.deleteMany();
  await prisma.cashflowSnapshot.deleteMany();
  await prisma.forecastScenario.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.oneOffExpense.deleteMany();
  await prisma.costCenter.deleteMany();
  await prisma.connector.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // ─── Organization ───────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: "BLM Project Srl",
      vatNumber: "IT03927890982",
      address: "Via Roma 42",
      city: "Bologna",
      province: "BO",
      zipCode: "40121",
      country: "IT",
    },
  });
  console.log("✅ Organization created:", org.name);

  // ─── Users ──────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: "admin@blmproject.com",
      name: "Admin BLM",
      passwordHash: hashSync("Password123!", 12),
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "viewer@blmproject.com",
      name: "Viewer BLM",
      passwordHash: hashSync("Password123!", 12),
      role: UserRole.VIEWER,
      organizationId: org.id,
    },
  });
  console.log("✅ Users created");

  // ─── Connector ──────────────────────────────────────────
  await prisma.connector.create({
    data: {
      organizationId: org.id,
      type: ConnectorType.MANUAL,
      name: "Inserimento Manuale",
      isActive: true,
    },
  });
  console.log("✅ Connector created");

  // ─── Cost Centers ───────────────────────────────────────
  const costCentersData = [
    // COST centers
    {
      name: "Personale",
      type: CostCenterType.COST,
      color: "#EF4444",
      keywords: [
        "stipendio",
        "stipendi",
        "busta paga",
        "INPS",
        "contributi",
        "TFR",
        "cedolino",
        "welfare",
      ],
      description: "Costi del personale dipendente e collaboratori",
    },
    {
      name: "Ufficio e Struttura",
      type: CostCenterType.COST,
      color: "#F97316",
      keywords: [
        "affitto",
        "mutuo",
        "coworking",
        "utenze",
        "luce",
        "gas",
        "acqua",
        "pulizia",
        "condominio",
        "arredamento",
      ],
      description: "Costi di struttura, affitto e utenze",
    },
    {
      name: "Tecnologia e Software",
      type: CostCenterType.COST,
      color: "#8B5CF6",
      keywords: [
        "hosting",
        "cloud",
        "AWS",
        "Azure",
        "licenza",
        "software",
        "SaaS",
        "dominio",
        "server",
        "GitHub",
        "JetBrains",
        "Vercel",
      ],
      description: "Costi tecnologici, hosting, licenze software",
    },
    {
      name: "Marketing e Comunicazione",
      type: CostCenterType.COST,
      color: "#EC4899",
      keywords: [
        "marketing",
        "pubblicità",
        "social",
        "ads",
        "Google Ads",
        "Meta",
        "brand",
        "grafica",
        "sito web",
        "SEO",
      ],
      description: "Spese di marketing e comunicazione",
    },
    {
      name: "Consulenze Professionali",
      type: CostCenterType.COST,
      color: "#14B8A6",
      keywords: [
        "commercialista",
        "avvocato",
        "consulente",
        "notaio",
        "revisore",
        "fiscale",
        "legale",
        "tributario",
      ],
      description: "Consulenze fiscali, legali e professionali",
    },
    {
      name: "Formazione",
      type: CostCenterType.COST,
      color: "#F59E0B",
      keywords: [
        "corso",
        "formazione",
        "workshop",
        "conferenza",
        "certificazione",
        "training",
        "aggiornamento",
      ],
      description: "Spese per formazione e aggiornamento professionale",
    },
    {
      name: "Assicurazioni e Tasse",
      type: CostCenterType.COST,
      color: "#6366F1",
      keywords: ["assicurazione", "polizza", "IRAP", "IMU", "tassa", "F24", "bollo", "tributo"],
      description: "Assicurazioni, imposte e tasse",
    },
    {
      name: "Trasporti e Logistica",
      type: CostCenterType.COST,
      color: "#06B6D4",
      keywords: [
        "trasporto",
        "viaggio",
        "treno",
        "aereo",
        "carburante",
        "taxi",
        "auto",
        "parcheggio",
        "pedaggi",
        "Trenitalia",
      ],
      description: "Costi di trasporto e trasferte",
    },
    // REVENUE centers
    {
      name: "Sviluppo Software",
      type: CostCenterType.REVENUE,
      color: "#22C55E",
      keywords: [
        "sviluppo",
        "programmazione",
        "coding",
        "web app",
        "mobile app",
        "frontend",
        "backend",
        "fullstack",
        "React",
        "Next.js",
      ],
      description: "Ricavi da progetti di sviluppo software",
    },
    {
      name: "Consulenza IT",
      type: CostCenterType.REVENUE,
      color: "#3B82F6",
      keywords: [
        "consulenza",
        "advisory",
        "architettura",
        "cloud",
        "infrastruttura",
        "audit",
        "assessment",
        "strategia IT",
      ],
      description: "Ricavi da attività di consulenza IT",
    },
    {
      name: "Formazione e Workshop",
      type: CostCenterType.REVENUE,
      color: "#A855F7",
      keywords: ["formazione", "workshop", "corso", "training", "docenza", "mentoring", "coaching"],
      description: "Ricavi da attività formative e workshop",
    },
    {
      name: "Manutenzione e Supporto",
      type: CostCenterType.REVENUE,
      color: "#10B981",
      keywords: [
        "manutenzione",
        "supporto",
        "assistenza",
        "SLA",
        "help desk",
        "monitoring",
        "bug fix",
        "aggiornamento",
      ],
      description: "Ricavi da contratti di manutenzione e supporto",
    },
  ];

  const costCenters: Record<string, string> = {};
  for (const cc of costCentersData) {
    const created = await prisma.costCenter.create({
      data: {
        organizationId: org.id,
        ...cc,
      },
    });
    costCenters[cc.name] = created.id;
  }
  console.log("✅ Cost centers created:", Object.keys(costCenters).length);

  // ─── Revenue center IDs for active invoices ─────────────
  const revenueCenterIds = [
    costCenters["Sviluppo Software"],
    costCenters["Consulenza IT"],
    costCenters["Formazione e Workshop"],
    costCenters["Manutenzione e Supporto"],
  ];

  // ─── Cost center IDs for passive invoices ───────────────
  const costCenterIds = [
    costCenters["Tecnologia e Software"],
    costCenters["Ufficio e Struttura"],
    costCenters["Consulenze Professionali"],
    costCenters["Marketing e Comunicazione"],
    costCenters["Assicurazioni e Tasse"],
    costCenters["Formazione"],
    costCenters["Trasporti e Logistica"],
    costCenters["Personale"],
  ];

  // ─── Invoices ───────────────────────────────────────────
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  let invoiceCount = 0;

  // Active invoices (70)
  for (let i = 0; i < 70; i++) {
    const client = randomItem(CLIENTS);
    const date = randomDate(oneYearAgo, now);
    const dueDate = addDays(date, randomItem([30, 60, 90]));
    const netAmount = randomBetween(500, 25000);
    const vatRate = 0.22;
    const vatAmount = Math.round(netAmount * vatRate * 100) / 100;
    const grossAmount = Math.round((netAmount + vatAmount) * 100) / 100;
    const needsTagging = Math.random() > 0.85;
    const assignedCenter = needsTagging ? null : randomItem(revenueCenterIds);

    const status: InvoiceStatus = Math.random() < 0.55 ? InvoiceStatus.PAID : InvoiceStatus.PENDING;

    const paidAt = status === InvoiceStatus.PAID ? addDays(date, randomBetween(5, 45)) : null;

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: org.id,
        direction: InvoiceDirection.ACTIVE,
        status,
        number: `FT-${date.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
        date,
        dueDate,
        counterpart: client.name,
        vatNumber: client.vat,
        description: randomItem(ACTIVE_INVOICE_DESCRIPTIONS),
        netAmount: netAmount,
        vatAmount: vatAmount,
        grossAmount: grossAmount,
        costCenterId: assignedCenter,
        needsTagging,
        paidAt,
      },
    });

    // Add 1-3 invoice lines
    const lineCount = Math.floor(Math.random() * 3) + 1;
    const lineAmounts: number[] = [];
    for (let l = 0; l < lineCount; l++) {
      const lineAmt = Math.round((netAmount / lineCount) * 100) / 100;
      lineAmounts.push(lineAmt);
    }

    for (let l = 0; l < lineCount; l++) {
      await prisma.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          description: `${randomItem(ACTIVE_INVOICE_DESCRIPTIONS)} - Riga ${l + 1}`,
          quantity: randomItem([1, 2, 5, 10, 20]),
          unitPrice: lineAmounts[l],
          amount: lineAmounts[l],
          costCenterId: assignedCenter,
        },
      });
    }

    invoiceCount++;
  }

  // Passive invoices (50)
  for (let i = 0; i < 50; i++) {
    const supplier = randomItem(SUPPLIERS);
    const date = randomDate(oneYearAgo, now);
    const dueDate = addDays(date, randomItem([30, 60]));
    const netAmount = randomBetween(100, 8000);
    const vatRate = 0.22;
    const vatAmount = Math.round(netAmount * vatRate * 100) / 100;
    const grossAmount = Math.round((netAmount + vatAmount) * 100) / 100;
    const needsTagging = Math.random() > 0.85;
    const assignedCenter = needsTagging ? null : randomItem(costCenterIds);

    const status: InvoiceStatus = Math.random() < 0.6 ? InvoiceStatus.PAID : InvoiceStatus.PENDING;

    const paidAt = status === InvoiceStatus.PAID ? addDays(date, randomBetween(3, 30)) : null;

    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        direction: InvoiceDirection.PASSIVE,
        status,
        number: `ACQ-${date.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
        date,
        dueDate,
        counterpart: supplier.name,
        vatNumber: supplier.vat,
        description: randomItem(PASSIVE_INVOICE_DESCRIPTIONS),
        netAmount: netAmount,
        vatAmount: vatAmount,
        grossAmount: grossAmount,
        costCenterId: assignedCenter,
        needsTagging,
        paidAt,
      },
    });

    invoiceCount++;
  }
  console.log("✅ Invoices created:", invoiceCount);

  // ─── Recurring Expenses ─────────────────────────────────
  const recurringExpensesData = [
    {
      name: "Rata mutuo ufficio",
      category: ExpenseCategory.RENT,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 1850,
      costCenter: "Ufficio e Struttura",
      counterpart: "Banca Intesa Sanpaolo",
      dayOfMonth: 5,
    },
    {
      name: "Affitto coworking",
      category: ExpenseCategory.RENT,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 650,
      costCenter: "Ufficio e Struttura",
      counterpart: "Talent Garden Bologna",
      dayOfMonth: 1,
    },
    {
      name: "Hosting AWS",
      category: ExpenseCategory.SOFTWARE,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 380,
      costCenter: "Tecnologia e Software",
      counterpart: "Amazon Web Services EMEA",
      dayOfMonth: 1,
    },
    {
      name: "Licenze JetBrains Team",
      category: ExpenseCategory.SOFTWARE,
      frequency: ExpenseFrequency.ANNUAL,
      amount: 2490,
      costCenter: "Tecnologia e Software",
      counterpart: "JetBrains Srl",
      dayOfMonth: 15,
    },
    {
      name: "Microsoft 365 Business",
      category: ExpenseCategory.SOFTWARE,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 220,
      costCenter: "Tecnologia e Software",
      counterpart: "Microsoft Ireland Operations",
      dayOfMonth: 10,
    },
    {
      name: "GitHub Team",
      category: ExpenseCategory.SOFTWARE,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 95,
      costCenter: "Tecnologia e Software",
      counterpart: "GitHub Inc.",
      dayOfMonth: 1,
    },
    {
      name: "Commercialista",
      category: ExpenseCategory.CONSULTING,
      frequency: ExpenseFrequency.QUARTERLY,
      amount: 1200,
      costCenter: "Consulenze Professionali",
      counterpart: "Studio Commercialista Rossi",
      dayOfMonth: 10,
    },
    {
      name: "Utenza elettrica",
      category: ExpenseCategory.UTILITIES,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 185,
      costCenter: "Ufficio e Struttura",
      counterpart: "Enel Energia SpA",
      dayOfMonth: 20,
    },
    {
      name: "Utenza gas",
      category: ExpenseCategory.UTILITIES,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 95,
      costCenter: "Ufficio e Struttura",
      counterpart: "Eni Plenitude SpA",
      dayOfMonth: 22,
    },
    {
      name: "Telefonia e internet",
      category: ExpenseCategory.UTILITIES,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 145,
      costCenter: "Ufficio e Struttura",
      counterpart: "TIM SpA",
      dayOfMonth: 15,
    },
    {
      name: "Stipendi netti",
      category: ExpenseCategory.SALARIES,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 12500,
      costCenter: "Personale",
      counterpart: "Dipendenti",
      dayOfMonth: 27,
    },
    {
      name: "Contributi INPS",
      category: ExpenseCategory.TAXES,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 4200,
      costCenter: "Personale",
      counterpart: "INPS",
      dayOfMonth: 16,
    },
    {
      name: "Polizza RC Professionale",
      category: ExpenseCategory.INSURANCE,
      frequency: ExpenseFrequency.ANNUAL,
      amount: 1800,
      costCenter: "Assicurazioni e Tasse",
      counterpart: "Assicurazioni Generali SpA",
      dayOfMonth: 1,
    },
    {
      name: "Google Workspace",
      category: ExpenseCategory.SOFTWARE,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 138,
      costCenter: "Tecnologia e Software",
      counterpart: "Google Cloud Italy Srl",
      dayOfMonth: 1,
    },
    {
      name: "Vercel Pro",
      category: ExpenseCategory.SOFTWARE,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 45,
      costCenter: "Tecnologia e Software",
      counterpart: "Vercel Inc.",
      dayOfMonth: 1,
    },
    {
      name: "Pulizia ufficio",
      category: ExpenseCategory.OTHER,
      frequency: ExpenseFrequency.MONTHLY,
      amount: 250,
      costCenter: "Ufficio e Struttura",
      counterpart: "Cooperativa Pulizie Bologna",
      dayOfMonth: 1,
    },
  ];

  for (const exp of recurringExpensesData) {
    await prisma.recurringExpense.create({
      data: {
        organizationId: org.id,
        name: exp.name,
        category: exp.category,
        frequency: exp.frequency,
        amount: exp.amount,
        vatIncluded: true,
        costCenterId: costCenters[exp.costCenter],
        startDate: oneYearAgo,
        dayOfMonth: exp.dayOfMonth,
        counterpart: exp.counterpart,
        description: exp.name,
      },
    });
  }
  console.log("✅ Recurring expenses created:", recurringExpensesData.length);

  // ─── One-Off Expenses ───────────────────────────────────
  const oneOffExpensesData = [
    {
      name: 'MacBook Pro 16" M3 Max',
      category: ExpenseCategory.HARDWARE,
      amount: 4299,
      costCenter: "Tecnologia e Software",
      counterpart: "Apple Store Bologna",
      isPaid: true,
      date: new Date(2025, 2, 15),
    },
    {
      name: "Conferenza React Summit",
      category: ExpenseCategory.TRAINING,
      amount: 890,
      costCenter: "Formazione",
      counterpart: "GitNation",
      isPaid: true,
      date: new Date(2025, 5, 10),
    },
    {
      name: "Arredamento sala riunioni",
      category: ExpenseCategory.OTHER,
      amount: 3200,
      costCenter: "Ufficio e Struttura",
      counterpart: "Ikea Italia Retail Srl",
      isPaid: true,
      date: new Date(2025, 1, 20),
    },
    {
      name: "Certificazione AWS Solutions Architect",
      category: ExpenseCategory.TRAINING,
      amount: 450,
      costCenter: "Formazione",
      counterpart: "Amazon Web Services EMEA",
      isPaid: true,
      date: new Date(2025, 3, 5),
    },
    {
      name: 'Monitor 4K Dell 32"',
      category: ExpenseCategory.HARDWARE,
      amount: 720,
      costCenter: "Tecnologia e Software",
      counterpart: "Dell Technologies",
      isPaid: true,
      date: new Date(2025, 7, 12),
    },
    {
      name: "Campagna Google Ads Q1",
      category: ExpenseCategory.MARKETING,
      amount: 2500,
      costCenter: "Marketing e Comunicazione",
      counterpart: "Google Cloud Italy Srl",
      isPaid: true,
      date: new Date(2025, 0, 8),
    },
    {
      name: "Servizio fotografico aziendale",
      category: ExpenseCategory.MARKETING,
      amount: 850,
      costCenter: "Marketing e Comunicazione",
      counterpart: "Studio Foto Bologna",
      isPaid: false,
      date: new Date(2025, 10, 15),
    },
    {
      name: "Consulenza legale contratti",
      category: ExpenseCategory.CONSULTING,
      amount: 1500,
      costCenter: "Consulenze Professionali",
      counterpart: "Studio Legale Bianchi",
      isPaid: false,
      date: new Date(2025, 11, 1),
    },
    {
      name: "Licenza Figma Organization",
      category: ExpenseCategory.SOFTWARE,
      amount: 540,
      costCenter: "Tecnologia e Software",
      counterpart: "Figma Inc.",
      isPaid: true,
      date: new Date(2025, 4, 1),
    },
    {
      name: "Corso Kubernetes avanzato",
      category: ExpenseCategory.TRAINING,
      amount: 1200,
      costCenter: "Formazione",
      counterpart: "Cloud Academy",
      isPaid: false,
      date: new Date(2026, 1, 10),
    },
  ];

  for (const exp of oneOffExpensesData) {
    await prisma.oneOffExpense.create({
      data: {
        organizationId: org.id,
        name: exp.name,
        category: exp.category,
        amount: exp.amount,
        vatIncluded: true,
        costCenterId: costCenters[exp.costCenter],
        date: exp.date,
        isPaid: exp.isPaid,
        paidAt: exp.isPaid ? addDays(exp.date, Math.floor(Math.random() * 10)) : null,
        counterpart: exp.counterpart,
        description: exp.name,
      },
    });
  }
  console.log("✅ One-off expenses created:", oneOffExpensesData.length);

  // ─── Bank Statements ────────────────────────────────────
  let balance = 45000; // Starting balance
  const bankStatements: Array<{
    date: Date;
    description: string;
    amount: number;
    balance: number;
    costCenterId: string | null;
  }> = [];

  // Generate monthly entries for 12 months
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + m, 1);

    // Inflows: client payments
    const inflowCount = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < inflowCount; i++) {
      const amount = randomBetween(1500, 30000);
      balance = Math.round((balance + amount) * 100) / 100;
      bankStatements.push({
        date: new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          Math.floor(Math.random() * 25) + 1,
        ),
        description: `Bonifico da ${randomItem(CLIENTS).name}`,
        amount,
        balance,
        costCenterId: randomItem(revenueCenterIds),
      });
    }

    // Outflows: expense payments
    const outflowCount = Math.floor(Math.random() * 5) + 4;
    for (let i = 0; i < outflowCount; i++) {
      const amount = -randomBetween(100, 5000);
      balance = Math.round((balance + amount) * 100) / 100;
      bankStatements.push({
        date: new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          Math.floor(Math.random() * 25) + 1,
        ),
        description: `Pagamento a ${randomItem(SUPPLIERS).name}`,
        amount,
        balance,
        costCenterId: randomItem(costCenterIds),
      });
    }

    // Salary payment
    balance = Math.round((balance - 12500) * 100) / 100;
    bankStatements.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 27),
      description: "Stipendi dipendenti",
      amount: -12500,
      balance,
      costCenterId: costCenters["Personale"],
    });

    // INPS
    balance = Math.round((balance - 4200) * 100) / 100;
    bankStatements.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 16),
      description: "Contributi INPS F24",
      amount: -4200,
      balance,
      costCenterId: costCenters["Personale"],
    });
  }

  // Sort by date
  bankStatements.sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const stmt of bankStatements) {
    await prisma.bankStatement.create({
      data: {
        organizationId: org.id,
        date: stmt.date,
        description: stmt.description,
        amount: stmt.amount,
        balance: stmt.balance,
        costCenterId: stmt.costCenterId,
      },
    });
  }
  console.log("✅ Bank statements created:", bankStatements.length);

  // ─── Cashflow Snapshots ─────────────────────────────────
  let runningBalance = 45000;
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + m, 1);
    const inflows = randomBetween(25000, 65000);
    const outflows = randomBetween(18000, 40000);
    const netFlow = Math.round((inflows - outflows) * 100) / 100;
    runningBalance = Math.round((runningBalance + netFlow) * 100) / 100;

    await prisma.cashflowSnapshot.create({
      data: {
        organizationId: org.id,
        date: monthDate,
        inflows: inflows,
        outflows: outflows,
        netFlow: netFlow,
        balance: runningBalance,
      },
    });
  }
  console.log("✅ Cashflow snapshots created: 12");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
