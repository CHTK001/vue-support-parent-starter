<script setup lang="ts">
/**
 * ReIp —— IP 地址输入组件
 *
 * 支持 IPv4 / IPv6 双模式：
 *   <ReIp v-model="ip" />
 *   <ReIp v-model="ip" version="ipv6" />
 *   <ReIp :model-value="raw" @update:model-value="onChange" />
 *
 * 内部以分段 el-input 形式呈现：
 *   - ipv4: 4 段十进制，每段 0~255
 *   - ipv6: 8 组 16 进制，每组 0~ffff
 *
 * 支持自动跳段（输入满长度自动聚焦下一段）、退格跳回上一段、整体粘贴自动切分。
 * 暴露 validate() 方法供父组件主动校验。
 */
import { computed, nextTick, ref, watch } from "vue";
import { ElInput } from "element-plus";

defineOptions({ name: "ReIp", inheritAttrs: true });

/** IP 版本 */
export type ReIpVersion = "ipv4" | "ipv6";

const props = withDefaults(
  defineProps<{
    /** IP 版本 */
    version?: ReIpVersion;
    /** 占位文本（用于整体空态） */
    placeholder?: string;
    /** 禁用 */
    disabled?: boolean;
    /** 只读 */
    readonly?: boolean;
    /** 是否可清空 */
    clearable?: boolean;
    /** 输入框尺寸 */
    size?: "large" | "default" | "small";
  }>(),
  {
    version: "ipv4",
    placeholder: "",
    disabled: false,
    readonly: false,
    clearable: false,
    size: "default",
  },
);

const model = defineModel<string | null | undefined>({ default: "" });

/** 当前版本对应的分段数 */
const segmentCount = computed<number>(() => (props.version === "ipv4" ? 4 : 8));

/** 每段最大长度（字符数） */
const segmentMaxLength = computed<number>(() => (props.version === "ipv4" ? 3 : 4));

/** 每段允许的字符正则 */
const segmentPattern = computed<RegExp>(() =>
  props.version === "ipv4" ? /^[0-9]*$/ : /^[0-9a-fA-F]*$/,
);

/** 分隔符：ipv4 用 ".", ipv6 用 ":" */
const separator = computed<string>(() => (props.version === "ipv4" ? "." : ":"));

/** 分段输入框的 ref 数组 */
const inputRefs = ref<Array<InstanceType<typeof ElInput> | null>>([]);

/** 当前各段的值 */
const segments = ref<string[]>([]);

/** 整体初始化（外部 v-model → 内部 segments） */
function parseToSegments(value: string | null | undefined): string[] {
  const count = segmentCount.value;
  if (!value) return new Array(count).fill("");
  const parts = value.split(separator.value);
  const result: string[] = new Array(count).fill("");
  for (let i = 0; i < count; i++) {
    result[i] = (parts[i] ?? "").slice(0, segmentMaxLength.value);
  }
  return result;
}

/** 段值合法性：ipv4 数字 0~255，ipv6 十六进制 0~ffff（允许空） */
function isValidSegment(value: string): boolean {
  if (value === "") return true;
  if (!segmentPattern.value.test(value)) return false;
  if (props.version === "ipv4") {
    const n = Number(value);
    return n >= 0 && n <= 255;
  }
  const n = parseInt(value, 16);
  return n >= 0 && n <= 0xffff;
}

/** 段值是否已"满"（达到最大长度或已是最大值） */
function isSegmentFull(value: string): boolean {
  if (!value) return false;
  if (value.length >= segmentMaxLength.value) return true;
  if (props.version === "ipv4" && value.length === 3) {
    return Number(value) > 25;
  }
  if (props.version === "ipv6" && value.length === 4) {
    return parseInt(value, 16) >= 0xfff;
  }
  return false;
}

/** 同步内部 segments → model */
function syncModel(): void {
  const joined = segments.value.join(separator.value);
  // 任一段非空才认为有值；全空传空串，保持受控
  model.value = joined;
}

/** 聚焦到指定段 */
async function focusSegment(index: number): Promise<void> {
  await nextTick();
  const inst = inputRefs.value[index];
  if (!inst) return;
  // ElInput 暴露的 input ref（_ref.input / ref.input）
  const inputEl = (inst as unknown as { ref?: { input?: HTMLInputElement } }).ref?.input;
  inputEl?.focus();
  inputEl?.select?.();
}

/** 单段输入 */
function onSegmentInput(index: number, raw: string | number): void {
  let value = String(raw ?? "");
  // 仅保留允许字符
  value = value.replace(props.version === "ipv4" ? /[^0-9]/g : /[^0-9a-fA-F]/g, "");
  // 截断到段最大长度
  if (value.length > segmentMaxLength.value) {
    value = value.slice(0, segmentMaxLength.value);
  }
  // ipv4 段超过 255 自动截断
  if (props.version === "ipv4" && value !== "" && Number(value) > 255) {
    value = "255";
  }
  segments.value[index] = value;
  syncModel();
  // 输入满 → 自动跳到下一段
  if (isSegmentFull(value) && index < segmentCount.value - 1) {
    void focusSegment(index + 1);
  }
}

/** 单段键盘事件：退格到空段时跳回上一段；方向键导航；粘贴整体 */
function onSegmentKeydown(index: number, event: KeyboardEvent): void {
  const key = event.key;
  // 粘贴
  if ((key === "v" || key === "V") && (event.ctrlKey || event.metaKey)) return;
  if (key === "Backspace" && segments.value[index] === "" && index > 0) {
    event.preventDefault();
    void focusSegment(index - 1);
    return;
  }
  if (key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    void focusSegment(index - 1);
    return;
  }
  if (key === "ArrowRight" && index < segmentCount.value - 1) {
    event.preventDefault();
    void focusSegment(index + 1);
    return;
  }
  if (key === "." || key === ":") {
    event.preventDefault();
    if (index < segmentCount.value - 1) void focusSegment(index + 1);
    return;
  }
}

/** 单段粘贴：尝试把整段 IP 拆分布置 */
function onSegmentPaste(index: number, event: ClipboardEvent): void {
  const text = event.clipboardData?.getData("text") ?? "";
  if (!text || !text.includes(separator.value)) return; // 仅一段粘贴则交给默认行为
  event.preventDefault();
  const parts = text.split(separator.value);
  const newSegments = parseToSegments("");
  for (let i = 0; i < segmentCount.value; i++) {
    newSegments[i] = (parts[i] ?? "").slice(0, segmentMaxLength.value);
  }
  segments.value = newSegments;
  syncModel();
}

/** 清空按钮 */
function onClear(): void {
  segments.value = new Array(segmentCount.value).fill("");
  syncModel();
  void focusSegment(0);
}

/** 整体合法性 */
const isValid = computed<boolean>(() => {
  if (segments.value.every((s) => s === "")) return false;
  if (!segments.value.every(isValidSegment)) return false;
  // 必须所有段都填满
  return segments.value.every((s) => s.length > 0);
});

/** 版本切换或外部值变化时重新切分 */
watch(
  () => [props.version, model.value] as const,
  ([version, value]) => {
    if (segments.value.length !== (version === "ipv4" ? 4 : 8)) {
      segments.value = parseToSegments(value);
      return;
    }
    const expected = parseToSegments(value);
    // 防止自己触发的 update 把光标位置搞乱：仅在外部值与当前不一致时同步
    const current = segments.value.join(separator.value);
    if (expected.join(separator.value) !== current) {
      segments.value = expected;
    }
  },
  { immediate: true },
);

/** 暴露给父组件的方法 */
defineExpose({
  /** 主动校验 */
  validate(): boolean {
    return isValid.value;
  },
  /** 主动聚焦第一段 */
  focus(): void {
    void focusSegment(0);
  },
  /** 主动清空 */
  clear(): void {
    onClear();
  },
});
</script>

<template>
  <div class="re-ip" :class="{ 're-ip--disabled': disabled }">
    <template v-for="(_, index) in segmentCount" :key="index">
      <ElInput
        :ref="(el) => (inputRefs[index] = el as InstanceType<typeof ElInput> | null)"
        :model-value="segments[index] ?? ''"
        :maxlength="segmentMaxLength"
        :disabled="disabled"
        :readonly="readonly"
        :size="size"
        :placeholder="placeholder || (index === 0 ? (version === 'ipv4' ? '192' : '2001') : '')"
        class="re-ip__segment"
        @update:model-value="(v) => onSegmentInput(index, v as string | number)"
        @keydown="(e) => onSegmentKeydown(index, e as KeyboardEvent)"
        @paste="(e: ClipboardEvent) => onSegmentPaste(index, e)"
      />
      <span v-if="index < segmentCount - 1" class="re-ip__separator">{{ separator }}</span>
    </template>
    <button
      v-if="clearable && !disabled && !readonly && segments.some((s) => s !== '')"
      type="button"
      class="re-ip__clear"
      aria-label="清空"
      @click="onClear"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.re-ip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  position: relative;
  width: 100%;
}
.re-ip--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.re-ip__segment {
  flex: 1 1 0;
  min-width: 0;
}
.re-ip__separator {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  user-select: none;
  flex: 0 0 auto;
}
.re-ip__clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border: none;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border-radius: 50%;
  cursor: pointer;
  line-height: 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.re-ip__clear:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}
</style>