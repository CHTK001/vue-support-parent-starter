<template>
  <section class="set-card-wrap">
    <header v-if="title || $slots.header || $slots.actions" class="set-card-head">
      <slot name="header">
        <span v-if="icon" class="set-card-ico"><el-icon :size="17"><component :is="icon" /></el-icon></span>
        <div class="set-card-titles">
          <h3 v-if="title" class="set-card-title">{{ title }}</h3>
          <p v-if="subtitle" class="set-card-subtitle">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="set-card-actions"><slot name="actions" /></div>
    </header>

    <div class="set-card" :class="{ 'set-card--flush': flush, 'set-card--bare': bare }">
      <slot />
    </div>

    <div v-if="footer || $slots.footer" class="set-card-footer">
      <slot name="footer">{{ footer }}</slot>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 统一的设置分组卡片（现代化扁平设计系统）。
 * 视觉：16px 圆角、发丝边框、极柔分层阴影、表面背景；全部走 CSS 变量，自动适配深色。
 */
defineOptions({ name: 'SettingsCard' })
defineProps<{
  title?: string
  subtitle?: string
  icon?: any
  /** 卡片内容去掉内边距（内部自行排版） */
  flush?: boolean
  /** 卡片完全无底色无边框（仅保留分组结构） */
  bare?: boolean
  /** 卡片底部一行说明文字 */
  footer?: string
}>()
</script>

<style scoped>
.set-card-wrap + .set-card-wrap { margin-top: 26px; }

.set-card-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 12px; padding: 0 2px;
}
.set-card-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px;
  /* 原值 11px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  flex-shrink: 0;
}
.set-card-titles { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.set-card-title {
  margin: 0; font-size: 14.5px; font-weight: 700; letter-spacing: 0.1px;
  color: var(--el-text-color-primary); line-height: 1.35;
}
.set-card-subtitle {
  margin: 0; font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.45;
}
.set-card-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.set-card {
  /* 原值 16px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow: hidden;
  /* 设置卡是页面区块，不加常驻投影 */
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
/* 仅保留悬浮浮起反馈这一类投影 */
.set-card:hover {
  border-color: var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
}
.set-card--flush { padding: 0; }
.set-card--bare {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}
.set-card--bare:hover { border-color: transparent; box-shadow: none; }

.set-card-footer {
  margin: 10px 4px 0; font-size: 12px; line-height: 1.55;
  color: var(--el-text-color-secondary);
}

/* 动效降级：系统开启「减少动态效果」时，卡片悬浮的描边与投影直接到位。
   只关 .set-card 自己的 transition，不写 `*` / .set-card * 通配，
   避免把插槽里 el-switch / el-select / el-input 内部 Element Plus 组件的合法过渡
   （尤其输入框的 focus 描边）一起掐掉。
   .set-card--bare 的透明态与 hover 态都是静态声明，停掉过渡后照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .set-card {
    transition: none;
  }
}
</style>
