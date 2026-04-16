import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
    sendTelegramMessage, 
    sendTelegramAction,
    formatStatusSummary,
    formatGodTierPrediction,
    formatRadarSummary,
    formatRiskReport
} from '@/lib/services/telegram';

export async function POST(req: Request) {
    try {
        // 0. Security Guard: Verify Secret Token
        const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
        const expectedToken = process.env.TELEGRAM_SECRET || "hanoi_default_secret";
        
        if (secretToken !== expectedToken) {
            console.warn("Unauthorized Webhook Attempt detected.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        
        // Telegram Webhook structure: { message: { text, chat: { id } } }
        const message = body.message;
        if (!message || !message.text) return NextResponse.json({ ok: true });

        const chatId = message.chat.id.toString();
        const text = message.text.toLowerCase();
        
        // 1. Get Bot Configuration
        const tgSetting = await prisma.appSetting.findUnique({ where: { key: 'telegram_bot_settings' } });
        const { botToken, chatId: allowedChatId } = (tgSetting?.valueJson as any) || {};

        if (!botToken || (allowedChatId && chatId !== allowedChatId)) {
            console.warn("Unauthorized Telegram Access attempt from:", chatId);
            return NextResponse.json({ ok: true }); // Still return OK to Telegram
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 2. Route Commands
        if (text.startsWith('/start')) {
            await sendTelegramMessage(
                "🏁 <b>Hanoi Intelligence Oracle Active.</b>\n\nCommands:\n/status - System Health\n/predict [type] - On-demand intelligence\n/radar [type] - Numerical Momentum\n/risk [type] - ROI & Risk Management\n/sync - Trigger Daily Intel Sync",
                botToken,
                chatId
            );
        }
        
        else if (text.startsWith('/status')) {
            await sendTelegramAction(botToken, chatId);
            const status = await fetch(`${appUrl}/api/truth/status`).then(r => r.json());
            if (!status.error) {
                await sendTelegramMessage(formatStatusSummary(status), botToken, chatId);
            }
        }
        
        else if (text.startsWith('/predict')) {
            const parts = text.split(' ');
            const type = (parts[1] || 'NORMAL').toUpperCase();
            await sendTelegramAction(botToken, chatId);
            
            const predData = await fetch(`${appUrl}/api/predict?type=${type}`).then(r => r.json());
            const status = await fetch(`${appUrl}/api/truth/status`).then(r => r.json());
            
            if (predData.predictions) {
                const msg = formatGodTierPrediction(type, "Next Draw", predData.predictions, status.intelligence.backtestVerdict);
                await sendTelegramMessage(msg, botToken, chatId);
            }
        }
        
        else if (text.startsWith('/radar')) {
            const parts = text.split(' ');
            const type = (parts[1] || 'NORMAL').toUpperCase();
            await sendTelegramAction(botToken, chatId);
            
            const radarData = await fetch(`${appUrl}/api/truth/momentum`).then(r => r.json());
            const marketHeat = radarData.marketMomentum?.[type] || {};
            const hyperActive = Object.values(marketHeat)
                .filter((m: any) => m.compositeScore > 1.3)
                .sort((a: any, b: any) => b.compositeScore - a.compositeScore);
                
            await sendTelegramMessage(formatRadarSummary(type, hyperActive), botToken, chatId);
        }
        
        else if (text.startsWith('/risk')) {
            const parts = text.split(' ');
            const type = (parts[1] || 'NORMAL').toUpperCase();
            await sendTelegramAction(botToken, chatId);
            
            const analysisData = await fetch(`${appUrl}/api/analysis/summary?drawType=${type}`).then(r => r.json());
            if (analysisData.riskIntelligence) {
                await sendTelegramMessage(formatRiskReport(type, analysisData.riskIntelligence), botToken, chatId);
            } else {
                await sendTelegramMessage(`❌ <b>Insufficient Data</b> for risk analysis in [${type}]. Need at least 40 records.`, botToken, chatId);
            }
        }
        
        else if (text.startsWith('/sync')) {
            await sendTelegramMessage("⏳ <b>Starting Intelligent Sync...</b>\nRecalibrating Genetic Weights...", botToken, chatId);
            await sendTelegramAction(botToken, chatId);
            
            const syncResult = await fetch(`${appUrl}/api/cron/sync-daily?key=${process.env.CRON_SECRET}`).then(r => r.json());
            
            if (syncResult.success) {
                await sendTelegramMessage(`✅ <b>Sync Complete!</b>\n${syncResult.message}`, botToken, chatId);
            } else {
                await sendTelegramMessage(`❌ <b>Sync Failed:</b> ${syncResult.error || 'Unknown Error'}`, botToken, chatId);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("Telegram Webhook Error:", err);
        return NextResponse.json({ ok: true }); // Always return OK to TG to avoid retry loops
    }
}
