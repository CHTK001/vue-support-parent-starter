<template>
  <el-dialog width="800px" v-model="visibleInner" :title="`配置 - ${filterSetting?.systemServerSettingName || '通用'}`" @close="handleClose" :close-on-click-modal="false">
    <div>
      <el-alert v-if="!settingId" type="warning" show-icon title="未选择具体的配置实例，无法保存配置" style="margin-bottom: 12px" />

      <div class="kv-row" v-for="(row, idx) in rows" :key="row._key">
        <el-input v-model="row.name" placeholder="参数名(name)" style="width: 260px" />
        <el-input v-model="row.value" placeholder="参数值(value)" style="width: 360px; margin-left: 8px" />
        <el-button type="danger" circle style="margin-left: 8px" @click="rows.splice(idx, 1)"><IconifyIconOnline icon="ri:delete-bin-line" /></el-button>
      </div>
      <el-button type="primary" link @click="addRow"><IconifyIconOnline icon="ri:add-line" />新增一行</el-button>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="!settingId" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import type { SystemServerSetting } from "@/api/system-server-setting";
import { batchSaveSystemServerSettingItems, getSystemServerSettingItemBySettingId, type SystemServerSettingItem } from "@/api/system-server-setting-item";
import { ElMessage } from "element-plus";
import { computed, ref, watch, withDefaults } from "vue";

interface Props {
  visible?: boolean;
  filterSetting?: SystemServerSetting | null;
}
const props = withDefaults(defineProps<Props>(), { visible: false, filterSetting: null });
const emit = defineEmits<{ (e: "update:visible", visible: boolean): void; (e: "success"): void }>();

const visibleInner = ref<boolean>(false);
const saving = ref(false);

const settingId = computed(() => props.filterSetting?.systemServerSettingId || null);

type KvRow = { _key: string; id?: number; name: string; value: string };
const rows = ref<KvRow[]>([]);

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = !!v;
    if (v) await loadData();
  },
  { immediate: true }
);

watch(visibleInner, (v) => emit("update:visible", v));

async function loadData() {
  rows.value = [];
  if (!settingId.value) return;
  try {
    const res = await getSystemServerSettingItemBySettingId(settingId.value);
    if (res.success && Array.isArray(res.data)) {
      rows.value = res.data.map((it: SystemServerSettingItem) => ({
        _key: `${it.systemServerSettingItemId}-${it.systemServerSettingItemName}`,
        id: it.systemServerSettingItemId,
        name: it.systemServerSettingItemName,
        value: it.systemServerSettingItemValue || "",
      }));
    }
    if (rows.value.length === 0) addRow();
  } catch {
    // ignore
  }
}

function addRow() {
  rows.value.push({ _key: Math.random().toString(36).slice(2), name: "", value: "" });
}

async function handleSave() {
  if (!settingId.value) return;
  const items: SystemServerSettingItem[] = rows.value
    .filter((r) => r.name.trim().length > 0)
    .map((r) => ({
      systemServerSettingItemId: r.id,
      systemServerSettingItemSettingId: settingId.value!,
      systemServerSettingItemName: r.name.trim(),
      systemServerSettingItemValue: r.value ?? "",
    }));

  saving.value = true;
  try {
    const res = await batchSaveSystemServerSettingItems(settingId.value, items);
    if (res.success) {
      ElMessage.success("保存成功，已热应用");
      emit("success");
      visibleInner.value = false;
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}
</script>

<style scoped>
.kv-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
