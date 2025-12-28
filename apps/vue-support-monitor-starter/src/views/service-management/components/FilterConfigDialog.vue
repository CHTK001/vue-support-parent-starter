<template>
  <sc-dialog
    v-model="visibleInner"
    :title="`配置 - ${filterSetting?.systemServerSettingName || '通用'}`"
    width="800px"
    :close-on-click-modal="false"
    class="filter-config-dialog"
    @close="handleClose"
  >
    <div class="config-container">
      <!-- 警告提示 -->
      <el-alert
        v-if="!settingId"
        type="warning"
        show-icon
        title="未选择具体的配置实例，无法保存配置"
        class="config-alert"
      />

      <!-- 配置信息头部 -->
      <div class="config-header" v-if="filterSetting">
        <div class="header-info">
          <div class="info-item">
            <IconifyIconOnline icon="ri:settings-3-line" class="info-icon" />
            <span class="info-label">类型：</span>
            <el-tag size="small" type="info">{{
              filterSetting.systemServerSettingType
            }}</el-tag>
          </div>
          <div
            class="info-item"
            v-if="filterSetting.systemServerSettingDescription"
          >
            <IconifyIconOnline icon="ri:file-text-line" class="info-icon" />
            <span class="info-label">描述：</span>
            <span class="info-value">{{
              filterSetting.systemServerSettingDescription
            }}</span>
          </div>
        </div>
        <el-tag
          :type="filterSetting.systemServerSettingEnabled ? 'success' : 'info'"
          effect="dark"
          round
        >
          {{ filterSetting.systemServerSettingEnabled ? "已启用" : "已禁用" }}
        </el-tag>
      </div>

      <!-- 配置项列表 -->
      <div class="config-section">
        <div class="section-title">
          <IconifyIconOnline icon="ri:list-settings-line" />
          <span>配置项</span>
          <el-tag type="primary" size="small" round>{{ rows.length }}</el-tag>
        </div>

        <el-scrollbar class="config-scrollbar" v-loading="loading">
          <div class="config-list">
            <div class="config-item" v-for="(row, idx) in rows" :key="row._key">
              <div class="item-index">{{ idx + 1 }}</div>
              <div class="item-content">
                <el-input
                  v-model="row.name"
                  placeholder="参数名 (name)"
                  class="item-name"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:key-line" />
                  </template>
                </el-input>
                <el-input
                  v-model="row.value"
                  placeholder="参数值 (value)"
                  class="item-value"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:input-field" />
                  </template>
                </el-input>
              </div>
              <el-button
                type="danger"
                circle
                size="small"
                class="item-delete"
                @click="removeRow(idx)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>

            <!-- 空状态 -->
            <el-empty
              v-if="rows.length === 0"
              description="暂无配置项"
              :image-size="80"
            >
              <el-button type="primary" @click="addRow">
                <IconifyIconOnline icon="ri:add-line" />
                添加配置项
              </el-button>
            </el-empty>
          </div>
        </el-scrollbar>

        <!-- 添加按钮 -->
        <div class="add-row-btn" v-if="rows.length > 0">
          <el-button type="primary" link @click="addRow">
            <IconifyIconOnline icon="ri:add-circle-line" />
            新增一行
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!settingId"
          @click="handleSave"
        >
          <IconifyIconOnline icon="ri:save-line" />
          保存配置
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>
<script setup lang="ts">
import type { SystemServerSetting } from "@/api/system-server-setting";
import {
  batchSaveSystemServerSettingItems,
  getSystemServerSettingItemBySettingId,
  type SystemServerSettingItem,
} from "@/api/system-server-setting-item";
import { message } from "@repo/utils";
import { computed, ref, watch } from "vue";

interface Props {
  visible?: boolean;
  filterSetting?: SystemServerSetting | null;
}
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  filterSetting: null,
});
const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
  (e: "success"): void;
}>();

const visibleInner = ref<boolean>(false);
const saving = ref(false);
const loading = ref(false);

const settingId = computed(
  () => props.filterSetting?.systemServerSettingId || null
);

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
  loading.value = true;
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
  } finally {
    loading.value = false;
  }
}

function addRow() {
  rows.value.push({
    _key: Math.random().toString(36).slice(2),
    name: "",
    value: "",
  });
}

function removeRow(idx: number) {
  rows.value.splice(idx, 1);
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
      message("保存成功，已热应用", { type: "success" });
      emit("success");
      visibleInner.value = false;
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}
</script>

<style lang="scss" scoped>
.config-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-alert {
  border-radius: 8px;
}

// 配置信息头部
.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #475569;
  }

  .info-icon {
    font-size: 16px;
    color: #64748b;
  }

  .info-label {
    font-weight: 500;
  }

  .info-value {
    color: #64748b;
  }
}

// 配置项区块
.config-section {
  background: var(--el-bg-color);
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  overflow: hidden;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0fa 100%);
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
  font-weight: 600;
  color: #334155;

  .iconify {
    font-size: 18px;
    color: #409eff;
  }
}

.config-scrollbar {
  max-height: 400px;
  padding: 12px;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #c7d2fe;
    background: linear-gradient(135deg, #fafbff 0%, #f5f7ff 100%);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
  }
}

.item-index {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
}

.item-content {
  flex: 1;
  display: flex;
  gap: 10px;
}

.item-name {
  flex: 1;
}

.item-value {
  flex: 1.5;
}

.item-delete {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

.add-row-btn {
  padding: 12px 16px;
  border-top: 1px dashed #e4e7ed;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
