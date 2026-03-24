export type BeaverState = "idle" | "walk" | "hit";

export type CrackLevel = "intact" | "medium" | "heavy" | "broken";

export interface HitResult {
  readonly nextHp: number;
  readonly crackLevel: CrackLevel;
  readonly isBroken: boolean;
}

/**
 * 计算河狸与蛤蜊之间的距离
 */
export function calcDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
}

/**
 * 根据距离和当前状态，计算河狸的下一个状态
 */
export function resolveBeaverState(current: BeaverState, distance: number, attackRange: number): BeaverState {
  if (distance > attackRange) {
    return "walk";
  }
  if (current === "hit") {
    return "hit";
  }
  return "idle";
}

/**
 * 依据敲击力度和当前血量，计算蛤蜊受击结果
 */
export function applyHit(
  currentHp: number,
  baseDamage: number,
  powerMultiplier: number
): HitResult {
  const effectivePower = Math.max(0.5, powerMultiplier);
  const rawDamage = baseDamage * effectivePower;
  const damage = Math.min(Math.round(rawDamage), currentHp);
  const nextHp = Math.max(0, currentHp - damage);
  const crackLevel = resolveCrackLevel(nextHp);

  return {
    nextHp,
    crackLevel,
    isBroken: nextHp === 0
  };
}

/**
 * 按剩余血量划分可视化裂纹等级
 */
export function resolveCrackLevel(hp: number): CrackLevel {
  if (hp <= 0) {
    return "broken";
  }
  if (hp <= 30) {
    return "heavy";
  }
  if (hp <= 60) {
    return "medium";
  }
  return "intact";
}


