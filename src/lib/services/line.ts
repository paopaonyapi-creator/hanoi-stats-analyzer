/**
 * Line Notify Service
 * Used to send automated notifications to Line app.
 */
export async function sendLineNotify(message: string, token: string) {
    if (!token) return { success: false, error: 'Token is missing' };
  
    try {
      const response = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({ message }).toString(),
      });
  
      const data = await response.json();
      return { success: data.status === 200, data };
    } catch (error: any) {
      console.error('Line Notify Error:', error);
      return { success: false, error: error.message };
    }
  }
  
/**
 * Formats lottery results for a clean Line message.
 */
export function formatResultForLine(type: string, date: string, digits: string, last2: string) {
    return `
📊 ผลหวยฮานอย [${type}]
📅 วันที่: ${date}
🔢 ผลรางวัล: ${digits}
🎯 2 ตัวท้าย: ${last2}

Check stats at: ${process.env.NEXT_PUBLIC_APP_URL || 'your-app-url.com'}
    `.trim();
}
