<template>
  <div
    class="set-row"
    :class="{ 'set-row--clickable': clickable, 'set-row--stack': stack, 'is-disabled': disabled }"
    @click="clickable && $emit('row-click', $event)"
  >
    <div class="set-row-body">
      <div class="set-row-text">
        <span class="set-row-label">
          <slot name="label">
            <span ref="labelEl" class="set-row-label-text">{{ label }}</span>
          </slot>
          <el-tooltip v-if="tip" :content="tip" placement="top" :show-after="150"
            :disabled="!tipOverflows" :open-delay="150">
            <el-icon class="set-row-tip"><QuestionFilled /></el-icon>
          </el-tooltip>
          <span v-if="badge" class="set-row-badge">{{ badge }}</span>
          <el-tooltip v-if="risk" :content="riskTip" placement="top" :show-after="120">
            <span class="set-row-risk" :class="`is-${risk}`" role="img" :aria-label="riskTip" />
          </el-tooltip>
        </span>
        <!-- 说明被折叠成 N 行后，完整文案靠 title 悬浮查看（有 description 插槽时由插槽自己负责） -->
        <span v-if="description || $slots.description" class="set-row-desc"
          :title="!$slots.description && description ? description : undefined">
          <slot name="description">{{ description }}</slot>
        </span>
      </div>
      <div v-if="$slots.default" class="set-row-control" :style="controlStyle">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch, nextTick } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'

/**
 * 统一的设置行（现代化扁平设计系统）：左侧标签 + 说明，右侧控件。
 * 同一卡片内相邻行自动出现内凹分隔线；控件右缘对齐；全部走 CSS 变量，自动适配深色。
 *
 * tip：标签过长时的兜底。原设计让长标签把左侧文本列撑开，右控件被挤走、
 * 甚至把整行撑破；这里改为「标签单行省略 + 溢出才显示问号图标」，
 * 完整文案只在 hover 气泡里出现，布局宽度恒定可控。
 */
defineOptions({ name: 'SettingsRow' })
const props = defineProps<{
  label?: string
  description?: string
  badge?: string
  /** 标签过长时改用 tip 气泡承载完整文案（留空则不启用） */
  tip?: string
  /**
   * 变更风险标记：`high` 红点 / `medium` 黄点，留空不显示。
   *
   * <p>用于「这一项改了会让已有数据失效」的设置项。底库已经入库时改特征模型，
   * 旧向量与新向量不在同一空间，全部人脸从此认不出来——但界面没有任何提示，
   * 用户只能事后在识别页看到「谁都不匹配」。红点把这件事提前到改之前。</p>
   */
  risk?: 'high' | 'medium'
  /** 风险点的 hover 文案 */
  riskTip?: string
  /** 控件区宽度（CSS 值，如 220px） */
  controlWidth?: string
  /** 控件区占满剩余宽度 */
  controlFlex?: boolean
  /** 整行可点击（出现 hover 反馈） */
  clickable?: boolean
  /** 控件在标签下方（竖向布局） */
  stack?: boolean
  disabled?: boolean
}>()
defineEmits<{ 'row-click': [evt: MouseEvent] }>()

const slots = useSlots()
const labelEl = ref<HTMLElement | null>(null)
/** 标签是否真的被省略号截断——只有截断了才提示，完整可见时不再重复展示气泡 */
const tipOverflows = ref(false)

/** 重新测量标签是否溢出。用 rAF 合并，避免同一轮渲染里重复读布局 */
let measureRaf = 0
function scheduleMeasure() {
  if (measureRaf) return
  measureRaf = requestAnimationFrame(() => {
    measureRaf = 0
    const el = labelEl.value
    if (!el) {
      tipOverflows.value = false
      return
    }
    // scrollWidth 含被省略掉的溢出宽度，故与 clientWidth 比较即可判断截断
    tipOverflows.value = el.scrollWidth > el.clientWidth + 1
  })
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  scheduleMeasure()
  if (labelEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(labelEl.value)
  }
})
onBeforeUnmount(() => {
  if (measureRaf) cancelAnimationFrame(measureRaf)
  resizeObserver?.disconnect()
})

watch(() => [props.label, props.tip, slots.label?.()], () => nextTick(scheduleMeasure), { flush: 'post' })

const controlStyle = computed(() => {
  /*
   * 右侧控件区默认「自己长」，不再写死宽度。
   *
   * 原来三个分支都带 flex: 0 0 auto（不给就不伸缩），宽屏上右侧会缩在一角、
   * 左边空出一大片；controlFlex 更是把 380px 焊死在计算属性里。
   * 现在：不传宽度 = 交给 CSS 的 flex 规则（可伸可缩，带上限）；
   * 只有页面**显式**要求某个固定宽度时才内联写死（少数需要像素对齐的控件）。
   */
  if (props.controlFlex) return {}
  if (props.controlWidth) {
    // 静态属性传入无单位字符串（如 "200"），补 px
    const width = /^\d+(\.\d+)?$/.test(props.controlWidth)
      ? `${props.controlWidth}px`
      : props.controlWidth
    return { width, flex: '0 0 auto' }
  }
  return {}
})
</script>

<style scoped>
.set-row { position: relative; }
.set-row + .set-row::before {
  content: ''; position: absolute; top: 0;
  left: 18px; right: 18px; height: 1px;
  background: var(--el-border-color-lighter);
  pointer-events: none;
}

.set-row-body {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; padding: 15px 18px;
}
.set-row--stack .set-row-body { flex-direction: column; align-items: stretch; gap: 12px; }

/*
  左侧文本列：固定最大宽度。
  原来只有 `flex: 1 1 auto` 没有上限，说明越长越往右吃 —— 右控件是 flex-shrink: 0，
  最后被挤成窄窄一条（用户报障：会话配置的说明太长，右侧组件宽度不够）。
  上限用变量而不是写死：个别页面（例如会话配置的多行输入）需要更宽时，
  在该行上覆盖 --set-row-text-max 即可，不必再改这个共享组件。
*/
.set-row-text {
  min-width: 0; display: flex; flex-direction: column; gap: 4px;
  flex: 1 1 auto; padding-right: 8px;
  max-width: var(--set-row-text-max, 560px);
}
.set-row-label {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13.5px; font-weight: 600; line-height: 1.4;
  color: var(--el-text-color-primary);
  /* 标签列可收缩：过长时在行内省略，完整文案交给 tip 气泡，
     避免长标题把右控件挤出可视区（原来的布局问题） */
  min-width: 0; max-width: 100%;
}
.set-row-label-text {
  min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.set-row-tip {
  font-size: 14px; flex-shrink: 0; cursor: help;
  color: var(--el-text-color-placeholder);
}
.set-row-tip:hover { color: var(--el-color-primary); }
/* 变更风险点：红=改了会让已有数据彻底失效；黄=会有影响但不至于全废 */
.set-row-risk {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: help;
  animation: risk-dot-breathe 1.8s ease-in-out infinite;
}
@keyframes risk-dot-breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.8); opacity: 0.6; }
}
.set-row-risk.is-high {
  background: var(--el-color-danger, #f56c6c);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger, #f56c6c) 20%, transparent);
}
.set-row-risk.is-medium {
  background: var(--el-color-warning, #e6a23c);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-warning, #e6a23c) 20%, transparent);
}
/* 无 label prop 但有 label 插槽时，插槽内容自己负责省略 */
.set-row-label > :deep(*) { min-width: 0; }
.set-row-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
/*
  说明文字：过长时折叠成 N 行（默认 3 行）。
  不折叠的话，长说明会在固定宽度里堆成一大段，把行撑得很高、
  控件在视觉上被顶到一边；完整文案交给 title 悬浮查看。
  行数同样用变量，单个页面可覆盖。
*/
.set-row-desc {
  font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--set-row-desc-lines, 3);
  line-clamp: var(--set-row-desc-lines, 3);
  overflow: hidden;
  /* 中文长串（例如一长串字段名）没有空格可断行，默认会撑破容器 */
  overflow-wrap: anywhere;
}

/*
  右侧控件区：默认**可伸缩**，不再写死宽度。
  - flex: 1 1 auto → 宽屏上把多余空间给控件，而不是让左侧文本列一直吃到边；
  - min-width 保证窄屏时控件不被压没（换行交给 flex-wrap）；
  - max-width 用变量兜一下，避免多行输入这类控件在超宽屏上拉成一整面墙。
  显式传了 control-width 的行仍走内联固定宽度（少数要像素对齐的控件），
  那条内联规则会盖住这里的 flex。
*/
.set-row-control {
  display: flex; align-items: center; justify-content: flex-end;
  /*
    保底 200px：内部 el-select / el-input 被上面的 `width: 100%` 撑满，
    容器一旦没有固有宽度（原来 flex: 0 0 auto + min-width: 0），
    100% 就塌成很窄一条 —— 下拉框里只看得见一个「3」，
    用户没法直观看出来「最多联想条数 / 初始加载记录数量」到底设了什么。
  */
  min-width: var(--set-row-control-min, 200px);
  max-width: var(--set-row-control-max, 100%);
  flex: 1 1 auto;
}
/* 极窄屏：控件整体换到下一行，而不是被挤成一条竖线 */
@media (max-width: 720px) {
  .set-row-body { flex-wrap: wrap; }
  .set-row-text { max-width: 100%; }
  .set-row-control { justify-content: flex-start; }
}
.set-row--stack .set-row-control { justify-content: flex-start; }
.set-row-control :deep(.el-switch) { flex-shrink: 0; }

.set-row--clickable { cursor: pointer; transition: background 0.16s ease; }
.set-row--clickable:hover { background: var(--el-fill-color-light); }
.set-row.is-disabled { opacity: 0.55; }

/* 控件宽度占满时，内部表单元素跟随 */
.set-row-control :deep(.el-select),
.set-row-control :deep(.el-input-number),
.set-row-control :deep(.el-input) { width: 100%; }

/* 动效降级：系统开启「减少动态效果」时，可点击行的悬停底色直接到位。
   只关 .set-row--clickable 自己的 transition，不写 `*` / `.set-row *` 通配，
   避免把行内 el-switch / el-select / el-input 内部 Element Plus 组件的合法过渡
   （尤其输入框的 focus 描边）一起掐掉。
   本文件只有 transition、无 animation，hover 底色本身是静态样式。 */
@media (prefers-reduced-motion: reduce) {
  .set-row--clickable {
    transition: none;
  }
  .set-row-risk {
    animation: none;
  }
}

/* 键盘焦点可见性：可点击设置行是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 行底色透明、落在设置卡片表面色上，一档主色描边足够可见。 */
.set-row--clickable {
  outline: none;
}

.set-row--clickable:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
