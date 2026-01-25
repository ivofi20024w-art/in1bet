import type { DoubleBetType } from "@shared/schema";

export const multipliers: Record<DoubleBetType, number> = {
  red: 2,
  green: 7,
  black: 2,
  crown: 14,
};

function generateWheelPattern(): DoubleBetType[] {
  const pattern: DoubleBetType[] = [];
  
  for (let i = 0; i < 99; i++) {
    if (i === 24 || i === 74) {
      pattern.push("green");
    } else if (i === 49) {
      pattern.push("crown");
    } else {
      const adjustedIndex = i - (i > 24 ? 1 : 0) - (i > 49 ? 1 : 0) - (i > 74 ? 1 : 0);
      pattern.push(adjustedIndex % 2 === 0 ? "black" : "red");
    }
  }
  
  return pattern;
}

export const WHEEL_PATTERN: DoubleBetType[] = generateWheelPattern();
export const WHEEL_SIZE = WHEEL_PATTERN.length;
