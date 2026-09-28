/**
 * 命中统计的 provide/inject 契约
 *
 * <p>五个页签都要读命中次数、都要能打开明细弹窗，弹窗本身也要读同一份状态。
 * 用 provide/inject 共享同一个 composable 实例，避免把 7 个成员逐个透传 5 遍。</p>
 *
 * <p>注入方统一走 {@link usePolicyHitContext} 解构，拿到的是 ref，
 * 在模板里会被自动解包，直接写 {@code hitDialogVisible} 即可，不要再写 .value。</p>
 */
import { inject, type InjectionKey } from "vue";
import type { usePolicyHit } from "./usePolicyHit";

/** 策略页内部使用，不导出到公共包 */
export const POLICY_HIT_KEY: InjectionKey<ReturnType<typeof usePolicyHit>> = Symbol("policy-hit");

/**
 * 取共享的命中统计能力
 *
 * @returns 与 {@link usePolicyHit} 相同的返回值（同一实例）
 */
export function usePolicyHitContext(): ReturnType<typeof usePolicyHit> {
  const hit = inject(POLICY_HIT_KEY);
  if (!hit) {
    throw new Error("[policy] usePolicyHitContext 必须在 provide(POLICY_HIT_KEY) 的祖先下使用");
  }
  return hit;
}
