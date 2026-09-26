<script setup lang="ts">
/**
 * Redis STRING 值编辑器（类型化详情组件）
 *
 * <p>单值编辑器 + 视图切换：
 * <ul>
 *   <li>文本：等宽文本域编辑（字符数 / 未保存提示 / JSON 一键格式化）；</li>
 *   <li>JSON：代码视图（语法高亮预览 + 编辑模式，见 {@link RedisCodeView}）；</li>
 *   <li>HEX：字节转储只读视图（见 {@link RedisHexView}）。</li>
 * </ul>
 * 打开键时按内容自动选择默认视图（合法 JSON → JSON）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { setRedisString, type RedisManageKeyDetail } from "../../redisManageApi";
import RedisCodeView from "./RedisCodeView.vue";
import RedisHexView from "./RedisHexView.vue";
import "./redis-value.css";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId: number;
  /** 逻辑库 */
  db: number;
  /** 键名 */
  redisKey: string;
  /** 键详情 */
  detail: RedisManageKeyDetail;
}>();

const emit = defineEmits<{ (e: "refresh"): void }>();

/** 视图类型 */
type StringView = "text" | "json" | "hex";

/** 视图选项 */
const VIEWS: { label: string; value: StringView }[] = [
  { label: "文本", value: "text" },
  { label: "JSON", value: "json" },
  { label: "HEX", value: "hex" },
];

const value = ref("");
const original = ref("");
const view = ref<StringView>("text");
const busy = ref(false);

/**
 * 依据内容猜测默认视图（合法 JSON → JSON 视图）
 * @param text 原始值
 */
function guessView(text: string): StringView {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // 非合法 JSON，退回文本视图
    }
  }
  return "text";
}

watch(
  () => props.detail,
  d => {
    const text = d?.type === "STRING" ? String(d.value ?? "") : "";
    value.value = text;
    original.value = text;
    view.value = guessView(text);
  },
  { immediate: true },
);

/** 是否有未保存修改 */
const dirty = computed<boolean>(() => value.value !== original.value);

/** 是否合法 JSON（文本视图展示格式化入口） */
const isJson = computed<boolean>(() => {
  const text = value.value.trim();
  if (!text || (!text.startsWith("{") && !text.startsWith("["))) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
});

/** JSON 美化（文本视图） */
function format(): void {
  try {
    value.value = JSON.stringify(JSON.parse(value.value), null, 2);
  } catch {
    ElMessage.warning("JSON 解析失败，无法格式化");
  }
}

/** 重置为已加载值 */
function reset(): void {
  value.value = original.value;
}

/** 保存 STRING 值 */
async function save(): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  try {
    await setRedisString(props.datasourceId, props.db, props.redisKey, value.value);
    ElMessage.success("保存成功");
    original.value = value.value;
    emit("refresh");
  } catch (e) {
    ElMessage.error(`保存失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="rv">
    <div class="rv-bar">
      <span class="rv-count">{{ value.length }} 字符</span>
      <span v-if="dirty" class="rv-dirty">未保存</span>
      <span class="rv-spacer" />
      <div class="rv-seg">
        <button
          v-for="opt in VIEWS"
          :key="opt.value"
          :class="{ active: view === opt.value }"
          @click="view = opt.value"
        >{{ opt.label }}</button>
      </div>
      <ReButton v-if="view === 'text' && isJson" icon="MagicStick" :show-text="true" size="small" @click="format">格式化</ReButton>
      <ReButton icon="RefreshLeft" :show-text="true" size="small" :disabled="!dirty || busy" @click="reset">重置</ReButton>
      <ReButton icon="Check" :show-text="true" type="primary" size="small" :loading="busy" :disabled="!dirty" @click="save">保存值</ReButton>
    </div>
    <ReInput
      v-if="view === 'text'"
      v-model="value"
      type="textarea"
      class="rv-editor"
      :autosize="{ minRows: 14, maxRows: 30 }"
    />
    <RedisCodeView v-else-if="view === 'json'" v-model="value" />
    <RedisHexView v-else :text="value" />
  </div>
</template>
