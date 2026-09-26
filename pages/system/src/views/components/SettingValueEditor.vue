<template>
  <div class="sv-editor">
    <ReSwitch
      v-if="type === 'BOOLEAN'"
      v-model="boolModel"
      :disabled="disabled"
      layout="square"
    />
    <ReInputNumber
      v-else-if="type === 'NUMBER'"
      v-model="numModel"
      :disabled="disabled"
      controls-position="right"
    />
    <el-color-picker
      v-else-if="type === 'COLOR'"
      v-model="row.sysSettingValue"
      :disabled="disabled"
      @change="markDirty"
    />
    <ReInput
      v-else
      v-model="row.sysSettingValue"
      :type="isPassword ? 'password' : 'text'"
      :disabled="disabled"
      clearable
      @input="markDirty"
    />

    <ReButton
      v-if="canReset"
      layout="square"
      class="sv-editor__reset"
      tip="恢复默认"
      @click="resetDefault"
    >
      <ReIcon name="ep:refresh-left" />
    </ReButton>
    <ReButton
      v-if="textLike && showSave"
      layout="square"
      type="primary"
      class="sv-editor__save"
      @click="save(row)"
    >
      <ReIcon name="ep:check" />
    </ReButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SysSetting } from "../../api/types";
import { normType } from "../../settingUtils";

const props = defineProps<{ row: SysSetting; disabled?: boolean; showSave?: boolean }>();
const emit = defineEmits<{
  (e: "save", row: SysSetting): void;
  (e: "dirty", row: SysSetting): void;
}>();

/** 归一化后的配置类型（传 valueType 字符串，而非整行） */
const type = computed(() => normType(props.row.sysSettingValueType));

function save(row: SysSetting) {
  emit("save", row);
}
/** 任意编辑只标记为脏，由页面统一（单条 ✓ 或批量保存）持久化 */
function markDirty() {
  emit("dirty", props.row);
}

/** 布尔开关 v-model 代理：写入字符串值并标脏（SquareReSwitch 不发 change） */
const boolModel = computed<boolean>({
  get: () => props.row.sysSettingValue === "true",
  set: (v) => {
    props.row.sysSettingValue = String(Boolean(v));
    markDirty();
  },
});
/** 数字 v-model 代理：写入字符串并标脏 */
const numModel = computed<number | undefined>({
  get: () => {
    const n = Number(props.row.sysSettingValue);
    return props.row.sysSettingValue === "" || Number.isNaN(n) ? undefined : n;
  },
  set: (v) => {
    props.row.sysSettingValue = v === null || v === undefined || Number.isNaN(v) ? "" : String(v);
    markDirty();
  },
});

function resetDefault() {
  const d = props.row.sysSettingDefaultValue;
  if (d == null) return;
  props.row.sysSettingValue = d;
  markDirty();
}

const isPassword = computed(() => type.value === "PASSWORD");
const textLike = computed(() => ["STRING", "PASSWORD", "JSON", "ARRAY"].includes(type.value));
const canReset = computed(() => {
  const d = props.row.sysSettingDefaultValue;
  return d != null && d !== "" && d !== props.row.sysSettingValue;
});
</script>

<style scoped>
.sv-editor {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.sv-editor :deep(.el-input),
.sv-editor :deep(.el-input-number),
.sv-editor :deep(.el-color-picker) {
  flex: 1;
  min-width: 0;
}
.sv-editor__save,
.sv-editor__reset {
  flex-shrink: 0;
}
</style>
