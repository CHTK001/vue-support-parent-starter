<script setup lang="ts">
/**
 * 主机命令面板（Ctrl+K / 连按两次 Shift）
 *
 * <p>主机一多，左侧列表里「找那台机器」的成本就上来了：滚动、认名字、认 IP。
 * 命令面板把三件事收进一个输入框 —— 按名称/IP/标签搜主机、按名字跳已开页签、
 * 按关键字执行全局动作（刷新列表、新增主机、暂停实时推送…）。</p>
 *
 * <p>键盘约定与主流面板一致：↑↓ 移动、Enter 执行、Esc 关闭；
 * 分组标题不参与选中，移动时自动跳过。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ReIcon from "@repo/ui/re-icon";
import type { PaletteItem } from "./HostCommandPalette.types";

interface Props {
  /** 是否显示 */
  modelValue?: boolean;
  /** 待展示的条目（父级已按分组排好序） */
  items?: PaletteItem[];
  /** 空结果文案 */
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  items: () => [],
  emptyText: "没有匹配的主机或功能",
});

const emit = defineEmits<{
  "update:modelValue": [boolean];
  /** 执行某条命令 */
  select: [PaletteItem];
}>();

const keyword = ref("");
const cursor = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

/**
 * 过滤后的条目（保持父级给的顺序，并按分组重新插入标题）。
 *
 * <p>不能直接过滤整份列表：分组标题的文本不参与匹配，一旦输入关键字就会被一起滤掉，
 * 结果面板变成一长串无分段的条目。这里先筛出命中的可选项，再按原分组顺序补回标题，
 * 只有该分组还有命中项时才补。</p>
 */
const visible = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const all = props.items;
  const matched = kw
    ? all.filter(it => it.key && (
      it.label.toLowerCase().includes(kw)
      || (it.hint ?? "").toLowerCase().includes(kw)
      || it.group.toLowerCase().includes(kw)))
    : all.filter(it => it.key);

  // 按出现顺序收集分组，命中项归组
  const order: string[] = [];
  const bucket = new Map<string, PaletteItem[]>();
  for (const it of matched) {
    if (!bucket.has(it.group)) {
      order.push(it.group);
      bucket.set(it.group, []);
    }
    bucket.get(it.group)!.push(it);
  }
  const out: PaletteItem[] = [];
  for (const g of order) {
    out.push({ key: "", label: "", group: g });
    out.push(...(bucket.get(g) ?? []));
  }
  return out;
});

/** 可选中条目在 visible 里的下标 */
const selectableIndexes = computed(() =>
  visible.value.reduce<number[]>((acc, it, i) => {
    if (it.key) acc.push(i);
    return acc;
  }, []));

/** 光标当前落在哪个可选中条目上（无结果时为 -1） */
const activeIndex = computed(() => selectableIndexes.value[cursor.value] ?? -1);

function close(): void {
  emit("update:modelValue", false);
}

/**
 * 把光标夹回合法范围。
 *
 * <p>关键字一变，结果集就变了，原来的 cursor 可能越界或落在分组标题上。</p>
 */
function clampCursor(): void {
  const max = selectableIndexes.value.length - 1;
  cursor.value = max < 0 ? 0 : Math.min(Math.max(0, cursor.value), max);
}

function move(delta: number): void {
  const max = selectableIndexes.value.length - 1;
  if (max < 0) return;
  cursor.value = Math.min(Math.max(0, cursor.value + delta), max);
  scrollActiveIntoView();
}

/**
 * 把当前项滚进可视区。
 *
 * <p>只动面板自己的列表，不碰外层页面 —— 用 scrollIntoView 会连带滚动父级，
 * 面板背后整页跟着跳一下。</p>
 */
function scrollActiveIntoView(): void {
  nextTick(() => {
    const list = listRef.value;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-idx="${activeIndex.value}"]`);
    if (!el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  });
}

function run(it: PaletteItem | undefined): void {
  if (!it || !it.key) return;
  emit("select", it);
  close();
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    move(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    move(-1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    run(visible.value[activeIndex.value]);
  } else if (e.key === "Escape") {
    e.preventDefault();
    close();
  }
}

/** 打开时清空关键字并聚焦，让用户直接开打 */
watch(() => props.modelValue, async (open) => {
  if (!open) return;
  keyword.value = "";
  cursor.value = 0;
  // 两段 nextTick：第一段等 v-if 渲染出输入框，第二段等它真正挂载完成。
  // 只等一段时 focus() 偶尔落空（浮层刚插入、浏览器还没把它算进布局），
  // 结果是面板打开了但按键打不进去。
  await nextTick();
  await nextTick();
  inputRef.value?.focus();
});

watch(keyword, () => {
  cursor.value = 0;
  clampCursor();
});

watch(() => props.items, clampCursor);

/** 点击面板外部关闭 */
function onDocDown(e: MouseEvent): void {
  if (!props.modelValue) return;
  const el = document.getElementById("host-palette-root");
  if (el && !el.contains(e.target as Node)) close();
}

onMounted(() => document.addEventListener("mousedown", onDocDown));
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocDown));
</script>

<template>
  <Teleport to="body">
    <transition name="hp-fade">
      <div v-if="modelValue" class="hp-mask">
        <div id="host-palette-root" class="hp" role="dialog" aria-modal="true" aria-label="命令面板">
          <div class="hp-input">
            <ReIcon name="Search" :size="15" class="hp-input__icon" />
            <input
              ref="inputRef"
              v-model="keyword"
              class="hp-input__el"
              placeholder="搜索主机、页签或功能…"
              spellcheck="false"
              @keydown="onKeydown"
            />
            <kbd class="hp-input__kbd">ESC</kbd>
          </div>

          <div ref="listRef" class="hp-list">
            <template v-if="visible.length">
              <template v-for="(it, i) in visible" :key="it.key || `g-${i}`">
                <!-- 分组标题：不可选中，只做视觉分段 -->
                <div v-if="!it.key" class="hp-group">{{ it.group }}</div>
                <div
                  v-else
                  class="hp-item"
                  :class="{ 'is-active': i === activeIndex }"
                  :data-idx="i"
                  @mouseenter="cursor = selectableIndexes.indexOf(i)"
                  @click="run(it)"
                >
                  <ReIcon v-if="it.icon" :name="it.icon" :size="14" class="hp-item__icon" />
                  <span class="hp-item__label">{{ it.label }}</span>
                  <span v-if="it.hint" class="hp-item__hint mono">{{ it.hint }}</span>
                </div>
              </template>
            </template>
            <div v-else class="hp-empty">{{ emptyText }}</div>
          </div>

          <div class="hp-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
            <span><kbd>↵</kbd> 执行</span>
            <span><kbd>Esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.hp-mask {
  position: fixed;
  inset: 0;
  z-index: 3050;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 12vh;
  background: color-mix(in srgb, var(--el-text-color-primary) 22%, transparent);
  backdrop-filter: blur(2px);
}

.hp {
  display: flex;
  flex-direction: column;
  width: min(560px, calc(100vw - 32px));
  max-height: 62vh;
  overflow: hidden;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}

.hp-input {
  display: flex;
  flex: none;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hp-input__icon {
  flex: none;
  color: var(--el-text-color-placeholder);
}

.hp-input__el {
  flex: 1;
  min-width: 0;
  font-family: inherit;
  font-size: 13.5px;
  color: var(--el-text-color-primary);
  background: transparent;
  border: none;
  outline: none;
}

.hp-input__el::placeholder {
  color: var(--el-text-color-placeholder);
}

.hp-input__kbd,
.hp-foot kbd {
  padding: 1px 5px;
  font-family: inherit;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.hp-list {
  flex: 1 1 auto;
  min-height: 0;
  padding: 6px;
  overflow-y: auto;
}

.hp-group {
  padding: 8px 8px 4px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
}

.hp-item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 34px;
  padding: 0 9px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.hp-item.is-active {
  background: var(--el-color-primary-light-9);
}

.hp-item__icon {
  flex: none;
  color: var(--el-text-color-secondary);
}

.hp-item.is-active .hp-item__icon {
  color: var(--el-color-primary);
}

.hp-item__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hp-item__hint {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.hp-empty {
  padding: 28px 12px;
  font-size: 12.5px;
  text-align: center;
  color: var(--el-text-color-placeholder);
}

.hp-foot {
  display: flex;
  flex: none;
  align-items: center;
  gap: 14px;
  padding: 7px 14px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  border-top: 1px solid var(--el-border-color-lighter);
}

.hp-foot span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.hp-fade-enter-active,
.hp-fade-leave-active {
  transition: opacity 0.13s ease;
}

.hp-fade-enter-from,
.hp-fade-leave-to {
  opacity: 0;
}
</style>
