<!--
  采集平台运行参数：把原来只能写在 yml 里的 plugin.collect.* 搬进界面。

  设计要点：
  1. 控件与范围完全由后端 /v2/collect/settings/list 返回的元数据决定，前端不硬编码
     任何一项；后端加参数，这里自动出现。
  2. 只有「执行期读取」的参数热生效；标「重启生效」的开关在启动注册执行器时就定了，
     保存后必须重启采集后端。
  3. 保存只提交改过的键，后端按类型/范围校验；「恢复默认」删掉覆盖行回到 yml 值。
-->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { msgError, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTag from "@repo/ui/re-tag";
import { listCollectSettings, resetCollectSettings, saveCollectSettings } from "../api/collectApi";
import { confirmAction, errText } from "../composables/useCollectView";
import type { CollectSettingItem } from "../types/collect";
import type { ReOption } from "@repo/ui/re-select";

const items = ref<CollectSettingItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);

/** 各类控件各自的草稿，避免一个 Record<string, 联合类型> 在模板里失去类型 */
const boolDraft = reactive<Record<string, boolean>>({});
const numberDraft = reactive<Record<string, number | undefined>>({});
const textDraft = reactive<Record<string, string>>({});

const groups = computed(() => {
  const map = new Map<string, CollectSettingItem[]>();
  for (const item of items.value) {
    const list = map.get(item.group) ?? [];
    list.push(item);
    map.set(item.group, list);
  }
  return Array.from(map, ([name, list]) => ({ name, list }));
});

const dirtyKeys = computed(() => items.value.filter(item => isDirty(item)).map(item => item.key));
const overriddenCount = computed(() => items.value.filter(item => item.overridden).length);

/**
 * 把后端值灌进草稿。
 *
 * @param item 参数项
 */
function syncDraft(item: CollectSettingItem): void {
  if (item.type === "boolean") {
    boolDraft[item.key] = item.value === "true";
    return;
  }
  if (item.type === "number") {
    const value = Number(item.value);
    numberDraft[item.key] = Number.isFinite(value) ? value : undefined;
    return;
  }
  textDraft[item.key] = item.value ?? "";
}

/**
 * 用后端返回的全量列表刷新界面。
 *
 * @param list 全量参数项
 * @param only 只刷新这些键的草稿；不传表示全部刷新（用于保留其它未保存的编辑）
 */
function applyList(list: CollectSettingItem[], only?: string[]): void {
  items.value = list;
  for (const item of list) {
    if (!only || only.includes(item.key)) {
      syncDraft(item);
    }
  }
}

/**
 * 草稿编码成后端要的字符串。
 *
 * @param item 参数项
 * @return 提交值
 */
function encode(item: CollectSettingItem): string {
  if (item.type === "boolean") {
    return boolDraft[item.key] ? "true" : "false";
  }
  if (item.type === "number") {
    return String(numberDraft[item.key] ?? 0);
  }
  return String(textDraft[item.key] ?? "").trim();
}

/**
 * 草稿是否与当前生效值不同。
 *
 * @param item 参数项
 * @return 改过返回 true
 */
function isDirty(item: CollectSettingItem): boolean {
  if (item.readOnly) {
    return false;
  }
  return encode(item) !== String(item.value ?? "");
}

/**
 * 缺省值的可读展示。
 *
 * @param item 参数项
 * @return 展示文本
 */
function defaultText(item: CollectSettingItem): string {
  if (item.type === "boolean") {
    return item.defaultValue === "true" ? "启用" : "停用";
  }
  const value = item.defaultValue === "" ? "（空）" : item.defaultValue;
  return item.unit ? `${value} ${item.unit}` : value;
}

/**
 * select 候选项转组件选项。
 *
 * @param item 参数项
 * @return 选项列表
 */
function optionsOf(item: CollectSettingItem): ReOption[] {
  return (item.options ?? []).map(value => ({ label: value, value }));
}

async function reload(): Promise<void> {
  loading.value = true;
  try {
    applyList(await listCollectSettings());
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

async function save(): Promise<void> {
  const payload: Record<string, string> = {};
  for (const item of items.value) {
    if (isDirty(item)) {
      payload[item.key] = encode(item);
    }
  }
  const keys = Object.keys(payload);
  if (!keys.length) {
    msgWarning("没有需要保存的修改");
    return;
  }
  const restart = items.value
    .filter(item => keys.includes(item.key) && item.restartRequired)
    .map(item => item.label);
  saving.value = true;
  try {
    applyList(await saveCollectSettings(payload), keys);
    if (restart.length) {
      msgWarning(`已保存 ${keys.length} 项；${restart.join("、")} 需重启采集后端后生效`);
    } else {
      msgSuccess(`已保存 ${keys.length} 项，立即生效`);
    }
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

async function resetOne(item: CollectSettingItem): Promise<void> {
  if (!(await confirmAction(`将「${item.label}」恢复为 yml 缺省值？`, "恢复默认"))) {
    return;
  }
  resetting.value = true;
  try {
    applyList(await resetCollectSettings([item.key]), [item.key]);
    msgSuccess(`「${item.label}」已恢复默认`);
  } catch (error) {
    msgError(errText(error));
  } finally {
    resetting.value = false;
  }
}

async function resetAll(): Promise<void> {
  if (!(await confirmAction("把所有被覆盖的运行参数恢复为 yml 缺省值？", "全部恢复默认"))) {
    return;
  }
  resetting.value = true;
  try {
    applyList(await resetCollectSettings());
    msgSuccess("全部运行参数已恢复默认");
  } catch (error) {
    msgError(errText(error));
  } finally {
    resetting.value = false;
  }
}

onMounted(reload);
</script>

<template>
  <div class="collect-settings">
    <header class="collect-settings__head">
      <div class="collect-settings__intro">
        <h3>运行参数</h3>
        <p>
          原来只能改 application.yml 的 <code>plugin.collect.*</code> 都在这里。保存后写入
          <code>collect_setting</code> 并立即应用到运行期；标「重启生效」的开关需重启采集后端。
        </p>
      </div>
      <div class="collect-settings__actions">
        <ReButton icon="RefreshRight" :loading="loading" @click="reload">刷新</ReButton>
        <ReButton :disabled="!overriddenCount || resetting" :loading="resetting" @click="resetAll">
          全部恢复默认{{ overriddenCount ? `（${overriddenCount}）` : "" }}
        </ReButton>
        <ReButton type="primary" :disabled="!dirtyKeys.length || saving" :loading="saving" @click="save">
          保存{{ dirtyKeys.length ? `（${dirtyKeys.length}）` : "" }}
        </ReButton>
      </div>
    </header>

    <div v-if="loading && !items.length" class="collect-settings__empty">正在加载运行参数…</div>
    <div v-else-if="!items.length" class="collect-settings__empty">
      没有可配置项：确认采集后端已启动，且 <code>plugin.collect.enable=true</code>。
    </div>

    <section v-for="group in groups" :key="group.name" class="collect-settings__group">
      <h4>{{ group.name }}</h4>
      <div class="collect-settings__grid">
        <div
          v-for="item in group.list"
          :key="item.key"
          class="collect-settings__item"
          :class="{ 'is-dirty': isDirty(item) }"
        >
          <div class="collect-settings__label">
            <span class="collect-settings__name">{{ item.label }}</span>
            <ReTag v-if="item.restartRequired" type="warning" effect="plain">重启生效</ReTag>
            <ReTag v-if="item.readOnly" type="info" effect="plain">部署级</ReTag>
            <ReTag v-if="item.overridden" type="info" effect="plain">已覆盖</ReTag>
            <ReTag v-if="isDirty(item)" type="warning">未保存</ReTag>
          </div>

          <div class="collect-settings__control">
            <ReSwitch v-if="item.type === 'boolean'" v-model="boolDraft[item.key]" :disabled="item.readOnly" />
            <ReInputNumber
              v-else-if="item.type === 'number'"
              v-model="numberDraft[item.key]"
              :min="item.min ? Number(item.min) : undefined"
              :max="item.max ? Number(item.max) : undefined"
              controls-position="right"
              style="width: 100%"
            />
            <ReSelect
              v-else-if="item.type === 'select'"
              v-model="textDraft[item.key]"
              :options="optionsOf(item)"
              style="width: 100%"
            />
            <ReInput v-else v-model="textDraft[item.key]" style="width: 100%" />
            <span v-if="item.unit" class="collect-settings__unit">{{ item.unit }}</span>
          </div>

          <p class="collect-settings__desc">{{ item.description }}</p>

          <div class="collect-settings__meta">
            <span>默认：{{ defaultText(item) }}</span>
            <span v-if="item.min || item.max" class="collect-settings__range">
              范围：{{ item.min ?? "不限" }} ~ {{ item.max ?? "不限" }}
            </span>
            <button
              v-if="item.overridden && !item.readOnly"
              type="button"
              class="collect-settings__reset"
              :disabled="resetting"
              @click="resetOne(item)"
            >
              恢复默认
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.collect-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 20px;
}

.collect-settings__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.collect-settings__intro h3 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
}

.collect-settings__intro p {
  margin: 0;
  max-width: 720px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.collect-settings__intro code {
  padding: 0 4px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
}

.collect-settings__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collect-settings__empty {
  padding: 48px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.collect-settings__group h4 {
  margin: 0 0 10px;
  padding-left: 8px;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid var(--el-color-primary);
}

.collect-settings__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.collect-settings__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.collect-settings__item.is-dirty {
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
}

.collect-settings__label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.collect-settings__name {
  font-size: 13px;
  font-weight: 600;
}

.collect-settings__control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.collect-settings__unit {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.collect-settings__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.collect-settings__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.collect-settings__reset {
  margin-left: auto;
  padding: 0;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--el-color-primary);
  cursor: pointer;
}

.collect-settings__reset:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
</style>
