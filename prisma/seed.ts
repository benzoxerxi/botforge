import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding BotForge database...\n");

  // Create super admin
  const hashedPassword = await bcrypt.hash("BenzoAdmin2026!", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@benzos.uk" },
    update: {},
    create: {
      email: "admin@benzos.uk",
      name: "Super Admin",
      password: hashedPassword,
      role: "super_admin",
      active: true,
    },
  });
  console.log(`✅ Super admin: admin@benzos.uk / BenzoAdmin2026!`);

  // Create a demo company
  const demoCompany = await prisma.company.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Company",
      slug: "demo",
      plan: "business",
      tokenLimit: 250000,
      enableHumanHandoff: true,
      systemPrompt:
        "You are a helpful AI assistant for Demo Company. Answer questions based on the provided knowledge base.",
    },
  });
  console.log(`✅ Demo company: ${demoCompany.name}`);

  // Create company admin
  const companyAdminPassword = await bcrypt.hash("DemoAdmin2026!", 10);
  const companyAdmin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Demo Admin",
      password: companyAdminPassword,
      role: "company_admin",
      companyId: demoCompany.id,
      active: true,
    },
  });
  console.log(`✅ Company admin: admin@demo.com / DemoAdmin2026!`);

  // Create a demo bot
  const demoBot = await prisma.bot.create({
    data: {
      name: "Demo Support Bot",
      companyId: demoCompany.id,
      systemPrompt:
        "You are a helpful customer support assistant for Demo Company.",
      useRag: true,
    },
  });
  console.log(`✅ Demo bot: ${demoBot.name}`);

  // Create chat widget for demo with stable widget code
  // Delete any existing widgets for this bot first to handle DB without unique constraint
  await prisma.chatWidget.deleteMany({
    where: { companyId: demoCompany.id },
  });
  const demoWidget = await prisma.chatWidget.create({
    data: {
      widgetCode: "demo-company-widget",
      botId: demoBot.id,
      companyId: demoCompany.id,
      title: "Need help?",
      subtitle: "Ask us anything about our products",
      greetingMessage: "Hi there! How can I help you today?",
    },
  });
  console.log(`✅ Chat widget created: ${demoWidget.widgetCode}`);

  // Create default platform settings
  const smtpSettings = [
    { key: "smtp_host", value: "smtp.mailgun.org" },
    { key: "smtp_port", value: "587" },
    { key: "smtp_user", value: "" },
    { key: "smtp_pass", value: "" },
    { key: "smtp_from", value: "noreply@benzos.uk" },
  ];
  for (const setting of smtpSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }
  console.log(`✅ SMTP settings seeded`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
