import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateToken() {
  const token = "8765966306:AAGlgHgxpFU0y0f9H7mOXYe5ie4KYCxPsAM";
  const setting = await prisma.appSetting.findUnique({ where: { key: 'telegram_bot_settings' } });
  const current = (setting?.valueJson as any) || {};
  
  await prisma.appSetting.upsert({
    where: { key: 'telegram_bot_settings' },
    update: { valueJson: { ...current, botToken: token } },
    create: { key: 'telegram_bot_settings', valueJson: { botToken: token } }
  });
  
  console.log("Telegram Bot Token updated successfully.");
}

updateToken().catch(console.error).finally(() => prisma.$disconnect());
