<script setup lang="ts">
/**
 * ServerFilter 参数分区卡片 —— 各专用面板的语义分区容器。
 *
 * 为什么抽出这个组件：原先 `.fc-section` / `.fc-section-title` / `.fc-grid` 在
 * file-storage / discovery / generic 三个面板里各抄了一份（9 处同名样式），
 * 改一次栅格断点要同步三个文件，久了必然漂移成"每个插件排版都不一样"。
 * 现在语义分区卡片只有这一处实现，新增插件只声明「分区名 + 归属字段名」。
 *
 * 样式走 EP 语义令牌而非 pages/server/src/styles/page.css 的 `.panel`
 * （那份 tokens.css 只有 :root、无暗色变体，暗色模式下会停在亮色值）。
 */
defineProps<{
  /** 分区标题（如「访问控制」「路由与负载」） */
  title: string;
  /** 分区语义说明，标题下方一行小字 */
  desc?: string;
  /** 该分区实际渲染的字段数，用于标题右侧计数徽标 */
  count?: number;
}>();
</script>

<template>
  <section class="fsc">
    <header class="fsc-head">
      <span class="fsc-bar" aria-hidden="true" />
      <div class="fsc-titles">
        <div class="fsc-title">
          <span class="fsc-title-text">{{ title }}</span>
          <span v-if="count" class="fsc-count">{{ count }}</span>
        </div>
        <div v-if="desc" class="fsc-desc">{{ desc }}</div>
      </div>
    </header>
    <div class="fsc-body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.fsc {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 14px 16px 16px;
}

/* 标题条：左侧 3px 语义色条 + 标题 + 计数徽标，替代原先三处复制的 border-left 写法 */
.fsc-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}
.fsc-bar {
  width: 3px;
  align-self: stretch;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary);
  flex-shrink: 0;
}
.fsc-titles {
  min-width: 0;
}
.fsc-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}
/* 字段数徽标：让用户一眼看出每块的参数量，替代原先靠数输入框猜 */
.fsc-count {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  padding: 2px 7px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
.fsc-desc {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 字段栅格：minmax(260px) 让两列时每个字段块等宽，字段行自身纵向堆叠，
   因此同一行内所有控件的起始位置完全对齐（原先 space-between 布局下参差不齐）。 */
.fsc-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px 20px;
  align-items: start;
}
</style>
