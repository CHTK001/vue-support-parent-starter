/**
 * 提示词形态图标注册表。
 *
 * <p>形态的 {@code form_icon} 存的是字符串 key（随角色配置一起落库），前端在渲染
 * 切换器时才解析成组件。注册表而非组件对象入库，是为了避免把前端实现细节写死进
 * 数据：换图标库或加形态都不需要改库。</p>
 *
 * <p>内置两个形态沿用会话里原本写死的那两个图标（构建=闪电、规划=剪贴板），
 * 保证形态从写死改成可配置后，界面观感不变。</p>
 */
import type { Component } from 'vue'
import {
  Flash20Regular,
  ClipboardTask20Regular,
  DocumentSearch24Regular,
  Bug24Regular,
  ShieldTask24Regular,
  Sparkle24Regular,
  Rocket24Regular,
} from '@vicons/fluent'

/** key → 图标组件 */
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
 * 解析形态图标。
 *
 * @param key 形态的 form_icon；未知或缺失时回落默认图标
 * @returns 可直接交给 `&lt;component :is&gt;` 的组件
 */
export function resolvePromptFormIcon(key?: string | null): Component {
  if (!key) return PROMPT_FORM_DEFAULT_ICON
  return PROMPT_FORM_ICONS[key] || PROMPT_FORM_DEFAULT_ICON
}

/** 供形态编辑界面展示的可选图标清单 */
export const PROMPT_FORM_ICON_CHOICES = [
  { key: 'flash', label: '闪电' },
  { key: 'clipboard', label: '剪贴板' },
  { key: 'search', label: '放大镜' },
  { key: 'bug', label: '缺陷' },
  { key: 'shield', label: '盾牌' },
  { key: 'sparkle', label: '星光' },
  { key: 'rocket', label: '火箭' },
]
