/**
 * 提示词形态图标注册表。
 *
 * <p>形态的 {@code form_icon} 存的是字符串 key（随角色配置一起落库），前端在渲染
 * 切换器时才解析成组件。注册表而非组件对象入库，是为了避免把前端实现细节写死进
 * 数据：换图标库或加形态都不需要改库。</p>
 *
 * <p>三种取值口径并存（2026-11-21 起）：</p>
 * <ul>
 *   <li><b>存量裸 key</b>：{@code flash / clipboard / search / bug / shield /
 *       sparkle / rocket}，对应 Fluent 图标注册表，历史数据照常渲染；</li>
 *   <li><b>新值 {@code ep:<name>}</b>：角色设置里的图标选择器（ReIconSelect default 主题）产出，
 *       按 Element Plus 图标名解析（与 ReIcon 的 {@code ep:} 解析同口径）；</li>
 *   <li><b>裸 Element 图标名</b>：运行时 themeId=koi（config shared 默认值），ReIconSelect
 *       实际加载 koi 主题，产出不带 {@code ep:} 前缀的 Element 图标名（如 {@code Camera}），
 *       解析时按 EP 名直接命中（存量裸 key 优先级更高，不受影响）。</li>
 * </ul>
 *
 * <p>内置两个形态沿用会话里原本写死的那两个图标（构建=闪电、规划=剪贴板），
 * 保证形态从写死改成可配置后，界面观感不变。</p>
 */
import type { Component } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import {
  Flash20Regular,
  ClipboardTask20Regular,
  DocumentSearch24Regular,
  Bug24Regular,
  ShieldTask24Regular,
  Sparkle24Regular,
  Rocket24Regular,
} from '@vicons/fluent'

/** 存量裸 key → 图标组件（历史 form_icon 口径，只读不再扩充） */
export const PROMPT_FORM_ICONS: Record<string, Component> = {
  // 内置形态，与改造前写死的图标保持一致
  flash: Flash20Regular,
  clipboard: ClipboardTask20Regular,
  // 可选图标，供自定义形态挑选
  search: DocumentSearch24Regular,
  bug: Bug24Regular,
  shield: ShieldTask24Regular,
  sparkle: Sparkle24Regular,
  rocket: Rocket24Regular,
}

/** 形态未指定图标时使用的默认图标 */
export const PROMPT_FORM_DEFAULT_ICON = Flash20Regular

/**
 * 解析 Element Plus 图标名（{@code ep:} 前缀后的短名）。
 *
 * <p>与 packages/ui ReIcon 的 resolveElement 同口径：先按原名命中，
 * 再把 kebab/snake 名转 PascalCase 兜底（{@code alarm-clock → AlarmClock}）。</p>
 */
function resolveElementPlusIcon(name: string): Component | null {
  if (!name) return null
  const icons = ElementPlusIconsVue as unknown as Record<string, Component | undefined>
  const direct = icons[name]
  if (direct) return direct
  const pascal = name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return icons[pascal] ?? null
}

/**
 * 解析形态图标。
 *
 * @param key 形态的 form_icon：存量裸 key、{@code ep:<name>}、koi 主题产出的裸 EP 图标名；
 *            未知或缺失时回落默认图标
 * @returns 可直接交给 `&lt;component :is&gt;` 的组件
 */
export function resolvePromptFormIcon(key?: string | null): Component {
  if (!key) return PROMPT_FORM_DEFAULT_ICON
  const legacy = PROMPT_FORM_ICONS[key]
  if (legacy) return legacy
  if (key.startsWith('ep:')) {
    return resolveElementPlusIcon(key.slice(3)) ?? PROMPT_FORM_DEFAULT_ICON
  }
  // ReIconSelect 运行时按 themeId=koi 加载 koi 主题，产出裸 Element 图标名（如 Camera），按 EP 名解析
  return resolveElementPlusIcon(key) ?? PROMPT_FORM_DEFAULT_ICON
}
