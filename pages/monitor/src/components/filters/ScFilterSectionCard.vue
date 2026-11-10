<script setup lang="ts">
/**
 * ServerFilter 参数分区卡片 —— 各专用面板的语义分区容器。
 *
 * 为什么抽出这个组件：原先 `.fc-section` / `.fc-section-title` / `.fc-grid` 在
 * file-storage / discovery / generic 三个面板里各抄了一份（9 处同名样式），
 * 改一次栅格断点要同步三个文件，久了必然漂移成"每个插件排版都不一样"。
 * 现在语义分区卡片只有这一处实现，新增插件只声明「分区名 + 归属字段名」。
 *
 * 结构按「编号 → 标题 → 字段」三级：编号让参数分区有了可指代的顺序
 * （「第 2 区的 watermark」），与详情页的流水线环号同一种表达。
 * 字段栅格默认三列，窄屏自动回落两列 / 一列。
 *
 * 样式走 EP 语义令牌而非 pages/server/src/styles/page.css 的 `.panel`
 * （那份 tokens.css 只有 :root、无暗色变体，暗色模式下会停在亮色值）。
 */
withDefaults(
  defineProps<{
    /** 分区标题（如「访问控制」「路由与负载」） */
    title: string;
    /** 分区语义说明，标题下方一行小字 */
    desc?: string;
    /** 该分区实际渲染的字段数，用于标题右侧计数徽标 */
    count?: number;
    /** 分区序号（从 1 开始）；面板按渲染顺序传入，缺省不显示 */
    no?: number;
  }>(),
  { no: 0 },
);
</script>

<template>
  <section class="fsc">
    <header class="fsc-head">
      <span class="fsc-bar" aria-hidden="true" />
      <span v-if="no" class="fsc-no">{{ String(no).padStart(2, '0') }}</span>
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
  padding: 12px 14px 14px;
  transition: border-color 0.2s ease;
  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, var(--el-border-color-lighter));
  }
}

/* 标题条：左侧 3px 语义色条 + 编号 + 标题 + 计数徽标 */
.fsc-head {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 12px;
}
.fsc-bar {
  width: 3px;
  align-self: stretch;
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(to bottom,
    var(--el-color-primary) 0%,
    color-mix(in srgb, var(--el-color-primary) 45%, transparent) 100%);
  flex-shrink: 0;
}
/* 分区编号：等宽小字，与参数名同一种「技术标识」语义，但不抢标题权重 */
.fsc-no {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.fsc-titles {
  min-width: 0;
}
.fsc-title {
  display: flex;
  align-items: center;
  gap: 7px;
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
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 字段栅格：三列起步。字段行自身纵向堆叠，因此同一行内所有控件的
   起始位置完全对齐（原先 space-between 布局下参差不齐）。 */
.fsc-body {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 16px;
  align-items: start;
}
@media (max-width: 1100px) {
  .fsc-body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 680px) {
  .fsc-body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
