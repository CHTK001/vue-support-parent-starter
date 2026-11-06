/**
 * 协同编辑器的「定时异步保存」调度
 *
 * <p><b>为什么要单独抽出来</b>：三个编辑器（excel / word / text）都要同一套节流纪律 ——
 * 输入期间一条请求都不发、停下来才写、但连续输入也不能永远不写。这段逻辑写错不会报错，
 * 只会表现成「打字卡顿」或「写了一小时没保存」，所以钉成纯函数 + 单测。</p>
 *
 * <p>两条时间线：</p>
 * <ul>
 *   <li><b>空闲延迟</b> {@link COLLAB_AUTOSAVE_DELAY_MS}：最后一次编辑之后等这么久；
 *       期间每次新编辑都往后推 —— 输入过程中零请求。</li>
 *   <li><b>最长等待</b> {@link COLLAB_AUTOSAVE_MAX_WAIT_MS}：从第一次改动算起，
 *       再连续输入也不能超过这个上限，到点强制写一次。没有它，一直打字就永远不保存，
 *       一次崩溃/误关页面就是整段内容丢失。</li>
 * </ul>
 *
 * @author Buffy
 * @since 2026/11/06
 */

/** 空闲自动保存延迟（毫秒）：最后一次编辑后等这么久才写 */
export const COLLAB_AUTOSAVE_DELAY_MS = 3000;

/** 自动保存最长等待（毫秒）：从第一次改动算起，到点强制保存 */
export const COLLAB_AUTOSAVE_MAX_WAIT_MS = 15_000;

/** 定时器最短间隔（毫秒）：避免 max-wait 用尽后落成 0ms 空转 */
export const COLLAB_AUTOSAVE_MIN_DELAY_MS = 200;

/**
 * 算出「这次编辑之后，定时器该定多久」。
 *
 * <p>取两者较小值：空闲延迟，以及「距最长等待还剩多久」。后者用于连续输入的场景 ——
 * 每次编辑都会重新计算，剩余时间越来越短，到点即触发一次保存。</p>
 *
 * @param dirtySince 首次变脏的时刻（毫秒时间戳）；未知时传当前时间
 * @param now        当前时刻（毫秒时间戳）
 * @param delayMs    空闲延迟（默认 {@link COLLAB_AUTOSAVE_DELAY_MS}）
 * @param maxWaitMs  最长等待（默认 {@link COLLAB_AUTOSAVE_MAX_WAIT_MS}）
 * @returns 定时器延迟（毫秒，不小于 {@link COLLAB_AUTOSAVE_MIN_DELAY_MS}）
 */
export function nextAutoSaveDelay(
  dirtySince: number,
  now: number,
  delayMs: number = COLLAB_AUTOSAVE_DELAY_MS,
  maxWaitMs: number = COLLAB_AUTOSAVE_MAX_WAIT_MS,
): number {
  const idleDelay = Math.max(0, delayMs);
  const remaining = Math.max(0, dirtySince + maxWaitMs - now);
  return Math.max(COLLAB_AUTOSAVE_MIN_DELAY_MS, Math.min(idleDelay, remaining));
}

/**
 * 轮询要不要现在发。
 *
 * <p>三条门禁：页面不可见（后台标签页）不发、正在保存不发、本地有未保存改动不发
 * —— 最后一条是因为此时服务端版本检查没有意义（本地还没写上去），
 * 而且旧实现的提示会打扰正在输入的人。</p>
 *
 * @param visible   页面是否可见
 * @param saving    是否正在保存
 * @param dirty     是否有未保存改动
 * @returns 可以轮询为 true
 */
export function shouldPollCollab(visible: boolean, saving: boolean, dirty: boolean): boolean {
  return visible && !saving && !dirty;
}
