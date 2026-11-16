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
    <!-- 邮件 / 短信账号：直接选账号管理里的账号，不再手填 SMTP / 短信密钥 -->
    <ReSelect
      v-else-if="accountKind"
      v-model="accountModel"
      :data="accountOptions"
      :loading="accountLoading"
      :disabled="disabled"
      :placeholder="accountPlaceholder"
      :title="accountTitle"
      clearable
      filterable
      empty-text="账号管理里还没有该类型的账号"
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
import { computed, onMounted, ref } from "vue";
import type { SysSetting } from "../../api/types";
import { normType } from "../../settingUtils";
import { listAccountsCached, type AccountKind, type SysAccountBrief } from "../../api/accountApi";

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

/**
 * 账号行：{@code smtp.accountId} / {@code sms.accountId} 指向账号管理里的 EMAIL / SMS 账号。
 *
 * <p>这两行是「配置管理 → 邮件 / 短信」与账号管理之间的唯一连接点：页面只让用户
 * 「选账号」，不再手填 SMTP 主机 / 短信密钥，避免同一份凭据存在两处来源。
 * 后端 {@code AccountSettingSelection} 读这两行决定实际发送用哪个账号。</p>
 */
const ACCOUNT_GROUPS: Record<string, AccountKind> = { smtp: "EMAIL", sms: "SMS" };

/** 本行是否为账号选择行；是则返回对应账号种类 */
const accountKind = computed<AccountKind | null>(() => {
  if (props.row.sysSettingName !== "accountId") return null;
  const group = String(props.row.sysSettingGroup ?? "").toLowerCase();
  return ACCOUNT_GROUPS[group] ?? null;
});

/** 可选账号（来自账号管理） */
const accounts = ref<SysAccountBrief[]>([]);
const accountLoading = ref(false);

/**
 * 下拉选项文案：名称 · 用户名 · 厂商 · 默认。
 *
 * <p>同一服务商常有多个账号，只看名称分不清收件地址，因此把用户名（发件邮箱 /
 * 手机号）一起显示；停用账号保留可选项但禁用，方便看出「之前选的是哪个」。</p>
 */
function accountLabel(it: SysAccountBrief): string {
  const parts: string[] = [];
  const name = it.name || it.code || it.username || it.accountId;
  parts.push(name);
  if (it.username && it.username !== name) parts.push(it.username);
  if (it.vendor) parts.push(it.vendor);
  if (it.defaultAccount) parts.push("默认");
  return parts.join(" · ");
}

const accountOptions = computed(() =>
  accounts.value.map(it => ({
    value: it.accountId,
    label: accountLabel(it),
    disabled: it.status === 0,
  })),
);

/** 账号 v-model 代理：写入账号标识并标脏 */
const accountModel = computed<string | undefined>({
  get: () => props.row.sysSettingValue || undefined,
  set: v => {
    props.row.sysSettingValue = v == null ? "" : String(v);
    markDirty();
  },
});

const accountPlaceholder = computed(() =>
  accounts.value.length ? "选择账号（来自账号管理）" : "请先在账号管理添加账号",
);

/** 当前值在账号管理里已不存在 / 已停用时给出提示，避免只显示一串标识误以为配置正常 */
const accountTitle = computed(() => {
  const v = props.row.sysSettingValue;
  if (!v) return "";
  return accounts.value.some(it => it.accountId === v) ? "" : "当前值在账号管理中已不存在或已停用，请重新选择";
});

onMounted(async () => {
  const kind = accountKind.value;
  if (!kind) return;
  accountLoading.value = true;
  try {
    accounts.value = await listAccountsCached(kind);
  } catch {
    accounts.value = [];
  } finally {
    accountLoading.value = false;
  }
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
.sv-editor :deep(.el-select),
.sv-editor :deep(.el-color-picker) {
  flex: 1;
  min-width: 0;
}
.sv-editor__save,
.sv-editor__reset {
  flex-shrink: 0;
}
</style>
