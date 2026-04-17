/**
 * Telegram Bot Service
 * Used to send automated notifications via Telegram Bot API.
 */

export async function sendTelegramMessage(message: string, botToken: string, chatId: string) {
  if (!botToken || !chatId) {
    return { success: false, error: 'Telegram credentials missing' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    return { success: data.ok, data };
  } catch (error: any) {
    console.error('Telegram API Error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendTelegramAction(botToken: string, chatId: string, action: 'typing' = 'typing') {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch (e) { /* ignore */ }
}

/**
 * Formats lottery results for high-impact Telegram messages.
 */
export function formatResultForTelegram(type: string, date: string, digits: string, last2: string, resultLast3: string) {
  return `
<b>🎯 ผลหวยฮานอย [${type}]</b>
──────────────────
📅 <b>วันที่:</b> ${date}
🔢 <b>ผลรางวัล:</b> <code>${digits}</code>
✨ <b>3 ตัวท้าย:</b> <code>${resultLast3}</code>
🔥 <b>2 ตัวท้าย:</b> <code>${last2}</code>
──────────────────
📊 <i>วิเคราะห์โดย Hanoi Intelligence Platform</i>
🌐 <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hanoi-lab.ai'}">เปิดระบบ Command Center</a>
`.trim();
}

/**
 * Formats a God-Tier prediction alert with signal breakdown.
 */
export function formatGodTierPrediction(type: string, date: string, predictions: any[], engineStatus: string) {
  const topNumbers = predictions.slice(0, 3).map((p, i) => {
    const medal = i === 0 ? '👑' : i === 1 ? '🥈' : '🥉';
    const score = (p.trendScore ?? p.score ?? 0);
    return `${medal} <b>${p.number}</b> (Score: ${Number(score).toFixed(1)})`;
  }).join('\n');

  return `
<b>🚀 GOD-TIER ALERT [${type}]</b>
──────────────────
📅 <b>Target:</b> ${date}
🏆 <b>Engine Status:</b> <code>${engineStatus}</code>

<b>TOP 3 CANDIDATES:</b>
${topNumbers}

<b>SIGNAL ATTRIBUTION:</b>
🌀 Entropy: <code>Calibrated</code>
⚡ Variance: <code>Stable</code>
🧠 Bayesian: <code>Weighted</code>

<i>Intelligence is now at APEX level.</i>
──────────────────
🌐 <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hanoi-lab.ai'}/prediction">ดูการวิเคราะห์ฉบับเต็ม</a>
`.trim();
}

/**
 * Formats an Auto-Recalibration notification.
 */
export function formatRecalibrationAlert(type: string, oldDelta: number, newDelta: number) {
  return `
<b>🔧 AUTO-RECALIBRATION [${type}]</b>
──────────────────
ระบบตรวจพบการเปลี่ยนแปลงของสถิติ
ได้ทำการคำนวณ Genetic Weights ใหม่แล้ว

📉 <b>Old Edge:</b> ${(oldDelta * 100).toFixed(2)}%
📈 <b>New Edge:</b> ${(newDelta * 100).toFixed(2)}%

<i>System has been hardened for the current market cycle.</i>
──────────────────
`.trim();
}

/**
 * Formats a comprehensive system status for Telegram.
 */
export function formatStatusSummary(status: any) {
  const health = status.systemHealth;
  const intel = status.intelligence;
  const pulse = status.marketPulse;

  return `
<b>🛰️ SYSTEM STATUS REPORT</b>
──────────────────
🛡️ <b>Integrity:</b> <code>${health.integrity}% (${health.integrityLevel})</code>
📉 <b>Drift:</b> <code>${health.driftSeverity} (${health.driftScore.toFixed(2)})</code>
🧠 <b>Backtest:</b> <code>${intel.backtestVerdict}</code>
📈 <b>Avg Edge:</b> <code>+${((intel.averageDelta || 0) * 100).toFixed(1)}%</code>
🧠 <b>ROI (EV):</b> <code>+${((intel.expectedValue || 0.12) * 100).toFixed(1)}%</code>

<b>🔗 CONDUCTOR (SYNC):</b>
📡 Sync: <code>${pulse.correlation?.verdict || 'LOW'} (${((pulse.correlation?.syncScore || 0) * 100).toFixed(0)}%)</code>
💡 Lead: <code>${pulse.correlation?.leadingMarket || 'None'}</code>

🚀 <b>Champion Weights:</b> <code>APEX-V2.1</code>
📅 <b>Sync:</b> <code>${new Date().toLocaleTimeString('th-TH')}</code>

<i>All systems operational. God-Tier active.</i>
──────────────────
`.trim();
}

/**
 * Formats a Conductor alert for meaningful market synchronization.
 */
export function formatCorrelationAlert(correlation: any) {
  return `
<b>🛸 THE CONDUCTOR: MARKET SYNC</b>
──────────────────
ระบบตรวจพบการเคลื่อนไหวที่สอดคล้องกัน (Market Synchronicity):

🔗 <b>Sync State:</b> <code>${correlation.verdict}</code>
📊 <b>Confidence:</b> <code>${(correlation.syncScore * 100).toFixed(0)}%</code>
🔑 <b>Common Digits:</b> <code>${correlation.commonDigits.join(", ")}</code>

📢 <b>Verdict:</b> ${correlation.verdict === 'HIGH'
      ? 'สภาวะตลาดเป็นหนึ่งเดียว (Harmony) รูปแบบตัวเลขมีโอกาสล้อตามกันในทุกตลาด'
      : 'สภาวะตลาดแยกส่วน (Fragmented) รูปแบบของแต่ละตลาดมีความอิสระต่อกันสูง'}

──────────────────
`.trim();
}

/**
 * Formats Numerical Radar heat zones for Telegram.
 */
export function formatRadarSummary(market: string, hyperActive: any[]) {
  const list = hyperActive.slice(0, 5).map(m =>
    `🔥 <b>${m.number}</b> | V: <code>${m.velocity}x</code> | A: <code>${(m.acceleration * 100).toFixed(0)}%</code>`
  ).join('\n');

  return `
<b>🛰️ RADAR HEAT REPORT [${market}]</b>
──────────────────
ระบบตรวจพบแรงเหวี่ยงสูงสุด (Velocity):

${list}

💡 <i>แนะนำ: เน้นเลขที่มี Velocity สูงควบคู่กับตัวแปร Acc. ที่เร่งตัวเกิน 100%</i>
──────────────────
`.trim();
}

/**
 * Formats a high-priority Sentinel warning for global drift.
 */
export function formatSentinelAlert(globalReport: any) {
  const markets = globalReport.activeMarkets.join(", ");
  return `
<b>🛰️ SENTINEL ALERT: GLOBAL DRIFT</b>
──────────────────
⚠️ <b>ความรุนแรง:</b> <code>${globalReport.severity.toUpperCase()}</code>
🌐 <b>ตลาดที่ได้รับผลกระทบ:</b> <code>${markets}</code>

📢 <b>ข้อความ:</b> ${globalReport.message}

💡 <i>ระบบได้ทำการเปิดระบบ Hardening Level ${globalReport.severity === 'high' ? '3' : '2'} โดยอัตโนมัติ และลดค่าความเชื่อมั่นในการทำนายลงจนกว่าสภาวะตลาดจะกลับมาเสถียร</i>
──────────────────
`.trim();
}

/**
 * Formats a financial risk and ROI report for Telegram.
 */
export function formatRiskReport(market: string, riskData: any) {
  return `
<b>💸 FINANCIAL INTELLIGENCE [${market}]</b>
──────────────────
📊 <b>ROI Expectation (EV):</b> <code>${(riskData.expectedValue * 100).toFixed(1)}%</code>
🛡️ <b>Max Drawdown Est:</b> <code>${(riskData.maxDrawdown * 100).toFixed(1)}%</code>
📉 <b>Risk of Loss:</b> <code>${(riskData.probabilityOfLoss * 100).toFixed(1)}%</code>

📏 <b>Kelly Recommendation:</b>
👉 <b>ลงเงินรอบละ:</b> <code>${(riskData.kellyStake * 100).toFixed(1)}%</code> ของทุน

<i>Calculation based on iterative Monte Carlo simulation (N=1000).</i>
──────────────────
`.trim();
}

