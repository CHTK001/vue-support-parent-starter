<template>
  <SettingsCard>
    <SettingsRow
      :title="t('settings.display.askPanelWidth.title')"
      :desc="t('settings.display.askPanelWidth.desc')"
    >
      <SegmentedToggle
        :model-value="askWidth"
        :options="widthOptions"
        @update:model-value="onAskWidthChange"
      />
    </SettingsRow>

    <!-- 布局预览：把「窄屏 / 满屏」两种形态画出来，切换前就能看见效果 -->
    <div class="display-preview">
      <div class="display-preview__label">
        {{ t('settings.display.askPanelWidth.preview') }}
      </div>
      <div
        class="display-preview__stage"
        :class="{ 'is-full': askWidth === 'full' }"
        aria-hidden="true"
      >
        <div class="display-preview__content">
          <i /><i /><i /><i /><i />
        </div>
      </div>
      <p class="display-preview__hint">{{ previewHint }}</p>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
/**
 * 显示设置面板（常规组，所有登录用户可用）。
 *
 * <p><b>当前唯一配置项</b>：右侧内容区显示宽度（MainLayout 注入
 * {@code --content-max-width} 驱动）。作用于会话页消息流/输入框列、设置中心卡片列、
 * 知识库详情页问答栏。narrow = 舒适阅读宽度（约 820px）居中；full = 撑满剩余空间。
 *
 * <p><b>持久化</b>：走 appearance 分组的按用户覆盖层（origin=USER），字段名
 * {@code kbAskPanelWidth} 与后端种子字段逐字一致，跨设备同步。读失败一律回落
 * narrow —— 与重构前的默认行为一致，不因为配置读不到就改变用户的既有观感。
 *
 * <p><b>视觉</b>：表单外壳由 kb-refactor.css 的 kb-form 系列统一；
 * 本组件只负责布局预览那一小块自有样式。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import SegmentedToggle from '../ui/SegmentedToggle.vue'
import { useKbDisplay } from '@/composables/useKbDisplay'

const { t } = useI18n()
const { askWidth, setKbAskWidth } = useKbDisplay()

const widthOptions = computed(() => [
  { label: t('settings.display.askPanelWidth.narrow'), value: 'narrow' },
  { label: t('settings.display.askPanelWidth.full'), value: 'full' },
])

const previewHint = computed(() =>
  askWidth.value === 'full'
    ? t('settings.display.askPanelWidth.hintFull')
    : t('settings.display.askPanelWidth.hintNarrow')
)

/**
 * 切换问答栏宽度。
 *
 * <p>本地先生效（store 是单例，页面通过 data-kb-ask 立刻响应），落库失败不阻塞 UI：
 * 用户已经看到效果了，为一次网络抖动回滚反而更糟。此时只提示一次。
 */
async function onAskWidthChange(value: string | number | boolean) {
  // SegmentedToggle 的 update:model-value 统一声明为 string | number | boolean，
  // 这里实际只会收到 widthOptions 里的 'narrow' / 'full'；其余值一律按 'narrow' 兜底，
  // 不把非法值透给 setKbAskWidth（它会写进后端配置）
  const v: 'narrow' | 'full' = value === 'full' ? 'full' : 'narrow'
  const ok = await setKbAskWidth(v)
  if (!ok) {
    ElMessage.warning(t('settings.display.askPanelWidth.saveFailed'))
  }
}
</script>

<style scoped>
/*
 * 预览区配色一律用 --el-* 令牌，**不要**用 --kb-*。
 *
 * <p>--kb-* 令牌的作用域被限定在 kb-refactor.css 的 `.kb-refactor` 类上
 * （深色态写作 `html.dark .kb-refactor`）。设置页不在这个类里，变量取不到，
 * 之前于是全靠写死的浅色兜底值（`var(--kb-surface, #fff)` 等）撑着 ——
 * 结果深色模式下卡片里嵌出一个纯白面板。
 * --el-* 由 element-plus 的 dark/css-vars.css 提供，随 `html.dark` 自动翻转，
 * 也正是设置中心其余面板（SettingsCard / AppearanceSettings）在用的那套。</p>
 */
.display-preview {
  margin-top: 4px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.display-preview__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.display-preview__stage {
  display: flex;
  justify-content: center;
  height: 92px;
}

/* 内容列：窄屏时居中定宽（模拟舒适阅读列），满屏时撑满舞台 —— 两态差别一眼可见。
   overlay 比外层面板再亮一档，两层边框在明暗两态下都分得开。 */
.display-preview__content {
  width: 55%;
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: width 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* 假文字条：跟着前景色走，明暗两态都有足够对比，又不会抢过真实文字 */
.display-preview__content i {
  display: block;
  height: 7px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-text-color-primary) 14%, transparent);
}

.display-preview__content i:nth-child(2) { width: 82%; }
.display-preview__content i:nth-child(3) { width: 91%; }
.display-preview__content i:nth-child(4) { width: 68%; }
.display-preview__content i:nth-child(5) { width: 86%; }

.display-preview__stage.is-full .display-preview__content {
  width: 100%;
}


.display-preview__hint {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

@media (prefers-reduced-motion: reduce) {
  .display-preview__stage,
  .display-preview__content {
    transition: none;
  }
}

@media (max-width: 720px) {
  .display-preview__stage { height: 78px; }
}
</style>