import type { ScoreWeights } from "@/types";
import { DEFAULT_SCORE_WEIGHTS } from "@/lib/constants";

// ═══════════════════════════════════════════════
// Default Score Configuration
// ═══════════════════════════════════════════════

export function getDefaultWeights(): ScoreWeights {
  return { ...DEFAULT_SCORE_WEIGHTS };
}

export const FACTOR_DESCRIPTIONS: Record<string, string> = {
  frequencyAllTime: "ความถี่สะสมตลอดข้อมูลทั้งหมด",
  frequencyRecent: "ความถี่ในช่วงล่าสุด (rolling window)",
  gapFactor: "ระยะห่างจากการปรากฏครั้งล่าสุด",
  transitionFactor: "ความน่าจะเป็นของการเปลี่ยนผ่านจากหมายเลขก่อนหน้า",
  digitBalanceFactor: "ความสมดุลของหลักสิบและหลักหน่วย",
  repeatBehaviorFactor: "รูปแบบการซ้ำในข้อมูลย้อนหลัง",
  weekdayAlignmentFactor: "ความสอดคล้องกับวันในสัปดาห์ปัจจุบัน",
};

export const FACTOR_NAMES: Record<string, string> = {
  frequencyAllTime: "ความถี่รวม",
  frequencyRecent: "ความถี่ล่าสุด",
  gapFactor: "Gap Factor",
  transitionFactor: "Transition Factor",
  digitBalanceFactor: "Digit Balance",
  repeatBehaviorFactor: "Repeat Behavior",
  weekdayAlignmentFactor: "Weekday Alignment",
};
