<!--
  RePageVariantDock —— 页面方向坞（右下角浮动切换器）

  职责：让用户在同一份真实数据上比较「这个页面可以怎么排」，并记住选择。
  不是产品 UI 的一部分，所以刻意做成深色浮动胶囊（与 pages/ai 的
  DesignVariantSwitcher 同一语言），与页面本体的浅色卡片明显分层——
  用户不会误以为这是页面的正式功能。

  为什么用原生 button 而不是 ReRadioGroup：
    坞是 fixed 定位的窄条，Element 的 radio-group 会带一层表单上下文样式
    （label 行高、margin、disabled 语义），逐条覆盖反而更长；
    且这里需要 role=group + aria-pressed 的语义（一组开关），
    不是 radiogroup 的单选语义。键盘可达性由原生 button 自带。

  为什么折叠状态不持久化：坞是「探索期工具」，每次进页面都从展开态开始
  才容易被发现；折叠只是当下嫌它挡着时的一次性动作。
-->
<template>
  <div
    v-if="items.length > 1"
    class="pk-dock"
    :class="{ 'is-collapsed': collapsed }"
    role="group"
    :aria-label="pageLabel ? `${pageLabel}：页面方向` : '页面方向'"
  >
    <span v-if="!collapsed" class="pk-dock__cap">方向</span>
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="pk-dock__btn"
      :class="{ 'is-on': item.id === modelValue }"
      :aria-pressed="item.id === modelValue"
      :title="item.thesis"
      @click="pick(item.id)"
    >{{ item.label }}</button>
    <button
      type="button"
      class="pk-dock__toggle"
      :title="collapsed ? '展开方向切换' : '收起'"
      :aria-expanded="!collapsed"
      @click="collapsed = !collapsed"
    >{{ collapsed ? '◧' : '×' }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import './re-page-kit.css'
import type { PageVariantId, PageVariantMeta } from './variant'

const props = defineProps<{
  /** 该页开放的方向（已是过滤后的列表） */
  items: PageVariantMeta[]
  /** 当前方向 */
  modelValue: PageVariantId
  /** 页面名，进 aria-label，读屏时能听出这是哪一页的方向 */
  pageLabel?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: PageVariantId): void }>()

const collapsed = ref(false)

function pick(id: PageVariantId): void {
  if (id === props.modelValue) return
  emit('update:modelValue', id)
}
</script>

<style scoped>
.pk-dock {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9000;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: var(--el-radius-full, 9999px);
  /* 深色底与页面浅色卡片分层：这块不是产品 UI */
  background: color-mix(in srgb, #0f172a 90%, transparent);
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 28px color-mix(in srgb, #0f172a 34%, transparent),
    inset 0 0 0 1px color-mix(in srgb, #ffffff 8%, transparent);
}

.pk-dock__cap {
  padding: 0 6px 0 8px;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: color-mix(in srgb, #ffffff 46%, transparent);
  user-select: none;
}

.pk-dock__btn {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: color-mix(in srgb, #ffffff 72%, transparent);
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  white-space: nowrap;
  outline: none;
  transition:
    color 140ms ease,
    background-color 140ms ease;
}

.pk-dock__btn:hover {
  color: #ffffff;
  background: color-mix(in srgb, #ffffff 12%, transparent);
}

.pk-dock__btn.is-on {
  color: #0f172a;
  background: #ffffff;
}

.pk-dock__btn:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, #ffffff 60%, transparent);
}

.pk-dock__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 26px;
  margin-left: 2px;
  font-size: 12px;
  color: color-mix(in srgb, #ffffff 46%, transparent);
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  outline: none;
}

.pk-dock__toggle:hover {
  color: #ffffff;
  background: color-mix(in srgb, #ffffff 12%, transparent);
}

.pk-dock__toggle:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, #ffffff 60%, transparent);
}

/* 折叠态只留一个圆钮，不再占横向空间 */
.pk-dock.is-collapsed {
  padding: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .pk-dock__btn,
  .pk-dock__toggle {
    transition: none;
  }
}

/* 窄屏：坞会盖住页面右下角的内容，收到左上角不现实（会盖标题），
   改为贴底居中并允许横向滚动 */
@media (max-width: 560px) {
  .pk-dock {
    right: 8px;
    left: 8px;
    bottom: 8px;
    justify-content: center;
    overflow-x: auto;
  }

  .pk-dock__cap {
    display: none;
  }
}
</style>
