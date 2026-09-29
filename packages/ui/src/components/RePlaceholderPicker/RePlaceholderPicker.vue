<script setup lang="ts">
/**
 * RePlaceholderPicker —— 占位字段选择组件
 *
 * 用于在采集流程的配置项里动态检索并插入占位符（形如 ${变量名}，
 * 与采集平台 CollectExpression 的占位语法一致），让用户不必手打。
 *
 * 设计要点：
 *   - 数据完全由 groups prop 传入，组件不发起任何 HTTP 请求，可单测、可复用；
 *   - mode="button"：渲染一个「插入占位」按钮，弹层内置搜索框，按关键字本地过滤；
 *   - mode="input"：渲染一个内联检索输入框，关键字通过 search 事件抛出，
 *     列表按传入的 groups 原样渲染（由外部做远程 / 自定义过滤）；
 *   - 列表项使用原生 <button>，天然支持 Tab 聚焦与 Enter 选中，不依赖鼠标。
 */
import { computed, onBeforeUnmount, ref } from "vue";
import { ElButton, ElInput, ElPopover } from "element-plus";
import { Search } from "@element-plus/icons-vue";

defineOptions({ name: "RePlaceholderPicker", inheritAttrs: true });

/** 单个占位字段 */
interface PlaceholderField {
  /** 插入时会包成 ${name} */
  name: string;
  /** 可选：悬浮说明 / 用途描述 */
  description?: string;
  /** 可选：取值示例，便于对照 */
  sample?: string;
}

/** 占位字段分组 */
interface PlaceholderGroup {
  /** 分组标题，如「全局变量」「内置函数」「自定义函数」 */
  label: string;
  /** 该分组下的字段 */
  items: PlaceholderField[];
}

const props = withDefaults(
  defineProps<{
    /** 可选的占位字段分组；不传则组件不自己取数，只渲染空态 */
    groups?: PlaceholderGroup[];
    /** 触发方式：'button'（默认，一个「插入占位」按钮）| 'input'（附带一个检索输入框） */
    mode?: "button" | "input";
    /** 是否在插入前把选中的占位符复制到剪贴板 */
    copyOnPick?: boolean;
    /** 无匹配时的提示文案 */
    emptyText?: string;
  }>(),
  {
    groups: () => [],
    mode: "button",
    copyOnPick: false,
    emptyText: "暂无可用占位字段",
  },
);

const emit = defineEmits<{
  /** 选中一个占位字段；value 是已经包好 ${} 的字符串 */
  (e: "pick", value: string, item: { name: string; description?: string }): void;
  /** mode='input' 时的检索关键字变化（方便外部按需远程检索） */
  (e: "search", keyword: string): void;
}>();

/** 弹层显隐（仅 button 模式使用） */
const visible = ref(false);
/** 检索关键字 */
const keyword = ref("");

/** 把字段名包成 ${name} 形式，与采集平台占位语法保持一致 */
function toPlaceholder(name: string): string {
  return "${" + name + "}";
}

/**
 * 可渲染的分组列表。
 *
 * - button 模式：按关键字在 name / description / sample 上做本地过滤；
 * - input 模式：过滤交给外部，原样返回传入的 groups。
 */
const filteredGroups = computed<PlaceholderGroup[]>(() => {
  if (props.mode === "input") {
    return props.groups;
  }
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) {
    return props.groups;
  }
  return props.groups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) =>
        [item.name, item.description ?? "", item.sample ?? ""].some((text) =>
          text.toLowerCase().includes(kw),
        ),
      ),
    }))
    .filter((group) => group.items.length > 0);
});

/** 是否存在可渲染的字段（用于切换空态） */
const hasResult = computed(() => filteredGroups.value.length > 0);

/** 关键字变化：input 模式抛给外部，button 模式仅内部过滤 */
function onKeywordChange(value: string): void {
  keyword.value = value;
  if (props.mode === "input") {
    emit("search", value);
  }
}

/** 最近一次已复制的占位符，用于展示「已复制」提示 */
const copiedValue = ref("");
let copiedTimer: number | null = null;

/** 复制到剪贴板；不可用（非安全上下文 / 无权限）时静默降级，不影响插入 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    copiedValue.value = text;
    if (copiedTimer !== null) {
      window.clearTimeout(copiedTimer);
    }
    copiedTimer = window.setTimeout(() => {
      copiedValue.value = "";
      copiedTimer = null;
    }, 1200);
  } catch {
    // 剪贴板不可用时忽略，插入行为不受影响
  }
}

/** 选中一个字段：按需复制，emit 包好 ${} 的 value，button 模式下关闭弹层 */
async function onPick(item: PlaceholderField): Promise<void> {
  const value = toPlaceholder(item.name);
  if (props.copyOnPick) {
    await copyToClipboard(value);
  }
  emit("pick", value, { name: item.name, description: item.description });
  if (props.mode === "button") {
    visible.value = false;
  }
}

onBeforeUnmount(() => {
  if (copiedTimer !== null) {
    window.clearTimeout(copiedTimer);
    copiedTimer = null;
  }
});
</script>

<template>
  <div class="re-placeholder-picker" :class="`is-${mode}`">
    <!-- button 模式：触发器 + 弹层（teleported=false 保持 DOM 顺序，保证 Tab 可达） -->
    <ElPopover
      v-if="mode === 'button'"
      v-model:visible="visible"
      :width="340"
      :teleported="false"
      trigger="click"
      placement="bottom-start"
      popper-class="re-placeholder-picker__popper"
    >
      <template #reference>
        <ElButton class="rpp-trigger" :icon="Search">插入占位</ElButton>
      </template>

      <div class="rpp-panel">
        <ElInput
          :model-value="keyword"
          class="rpp-search"
          placeholder="搜索占位字段"
          clearable
          :prefix-icon="Search"
          @update:model-value="onKeywordChange"
        />
        <div class="rpp-body">
          <div v-if="hasResult" class="rpp-groups">
            <section v-for="group in filteredGroups" :key="group.label" class="rpp-group">
              <div class="rpp-group__label">{{ group.label }}</div>
              <ul class="rpp-list">
                <li v-for="item in group.items" :key="item.name">
                  <button
                    type="button"
                    class="rpp-item"
                    :title="item.description || item.name"
                    @click="onPick(item)"
                  >
                    <span class="rpp-item__row">
                      <code class="rpp-item__name">{{ toPlaceholder(item.name) }}</code>
                      <span
                        v-if="copiedValue === toPlaceholder(item.name)"
                        class="rpp-item__copied"
                      >已复制</span>
                    </span>
                    <span v-if="item.description" class="rpp-item__desc">{{ item.description }}</span>
                    <span v-if="item.sample" class="rpp-item__sample">示例：{{ item.sample }}</span>
                  </button>
                </li>
              </ul>
            </section>
          </div>
          <div v-else class="rpp-empty">{{ emptyText }}</div>
        </div>
      </div>
    </ElPopover>

    <!-- input 模式：内联检索框 + 列表（由外部按 search 事件过滤 groups） -->
    <template v-else>
      <ElInput
        :model-value="keyword"
        class="rpp-search"
        placeholder="搜索占位字段"
        clearable
        :prefix-icon="Search"
        @update:model-value="onKeywordChange"
      />
      <div class="rpp-body">
        <div v-if="hasResult" class="rpp-groups">
          <section v-for="group in filteredGroups" :key="group.label" class="rpp-group">
            <div class="rpp-group__label">{{ group.label }}</div>
            <ul class="rpp-list">
              <li v-for="item in group.items" :key="item.name">
                <button
                  type="button"
                  class="rpp-item"
                  :title="item.description || item.name"
                  @click="onPick(item)"
                >
                  <span class="rpp-item__row">
                    <code class="rpp-item__name">{{ toPlaceholder(item.name) }}</code>
                    <span
                      v-if="copiedValue === toPlaceholder(item.name)"
                      class="rpp-item__copied"
                    >已复制</span>
                  </span>
                  <span v-if="item.description" class="rpp-item__desc">{{ item.description }}</span>
                  <span v-if="item.sample" class="rpp-item__sample">示例：{{ item.sample }}</span>
                </button>
              </li>
            </ul>
          </section>
        </div>
        <div v-else class="rpp-empty">{{ emptyText }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.re-placeholder-picker {
  display: block;
}

/* input 模式：输入框与列表纵向排列 */
.re-placeholder-picker.is-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rpp-trigger {
  max-width: 100%;
}

.rpp-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rpp-search {
  width: 100%;
}

.rpp-body {
  max-height: 280px;
  overflow-y: auto;
}

.rpp-group + .rpp-group {
  margin-top: 8px;
}

.rpp-group__label {
  padding: 2px 4px 4px;
  font-size: var(--el-font-size-small);
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.rpp-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* 原生 button，保证 Tab 聚焦与 Enter 选中的键盘可达性 */
.rpp-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-sizing: border-box;
  width: 100%;
  padding: 6px 8px;
  font-family: inherit;
  font-size: var(--el-font-size-base);
  text-align: left;
  color: var(--el-text-color-primary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
}

.rpp-item:hover {
  background: var(--el-fill-color-light);
}

.rpp-item:focus-visible {
  outline: none;
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.rpp-item__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.rpp-item__name {
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-size: var(--el-font-size-small);
  color: var(--el-color-primary);
  word-break: break-all;
}

.rpp-item__copied {
  flex: none;
  font-size: var(--el-font-size-extra-small);
  color: var(--el-color-success);
}

.rpp-item__desc {
  font-size: var(--el-font-size-extra-small);
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.rpp-item__sample {
  font-size: var(--el-font-size-extra-small);
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
  word-break: break-all;
}

.rpp-empty {
  padding: 16px 8px;
  font-size: var(--el-font-size-base);
  text-align: center;
  color: var(--el-text-color-placeholder);
}
</style>
