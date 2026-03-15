<template>
  <sc-dialog
    v-model="visibleLocal"
    title="控制台权限设置"
    width="520px"
    class="data-console-setting-dialog"
    @close="handleClose"
  >
    <div v-if="isJdbc" class="section">
      <div class="section-title">JDBC 控制台</div>
      <ScForm label-width="140px">
        <ScFormItem label="查看表结构">
          <ScSwitch v-model="form.jdbc.viewTableStructure" />
        </ScFormItem>
        <ScFormItem label="复制表名">
          <ScSwitch v-model="form.jdbc.copyTableName" />
        </ScFormItem>
        <ScFormItem label="复制建表语句">
          <ScSwitch v-model="form.jdbc.copyCreateTable" />
        </ScFormItem>
        <ScFormItem label="字段添加注释">
          <ScSwitch v-model="form.jdbc.addFieldComment" />
        </ScFormItem>
      </ScForm>
    </div>
    <div v-if="isRedis" class="section">
      <div class="section-title">Redis 控制台</div>
      <ScForm label-width="140px">
        <ScFormItem label="复制键名">
          <ScSwitch v-model="form.redis.copyKeyName" />
        </ScFormItem>
        <ScFormItem label="查看 TTL">
          <ScSwitch v-model="form.redis.viewTtl" />
        </ScFormItem>
      </ScForm>
    </div>
    <div v-if="isZk" class="section">
      <div class="section-title">ZK 控制台</div>
      <ScForm label-width="140px">
        <ScFormItem label="创建节点">
          <ScSwitch v-model="form.zk.createNode" />
        </ScFormItem>
        <ScFormItem label="删除节点">
          <ScSwitch v-model="form.zk.deleteNode" />
        </ScFormItem>
      </ScForm>
    </div>
    <template #footer>
      <ScButton @click="visibleLocal = false">取消</ScButton>
      <ScButton type="primary" :loading="saving" @click="handleSave"
        >保存</el-button
      >
    </template>
  </sc-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch, reactive } from "vue";
import {
  getConsoleConfig,
  saveConsoleConfig,
} from "@/api/data-management/system-data";

const props = defineProps<{
  modelValue: boolean;
  settingId: number | null;
  settingType?: string;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "saved"): void;
}>();

const visibleLocal = ref(false);
const saving = ref(false);

interface ConsoleConfig {
  jdbc: {
    viewTableStructure: boolean;
    copyTableName: boolean;
    copyCreateTable: boolean;
    addFieldComment: boolean;
  };
  redis: {
    copyKeyName: boolean;
    viewTtl: boolean;
  };
  zk: {
    createNode: boolean;
    deleteNode: boolean;
  };
}

const form = reactive<ConsoleConfig>({
  jdbc: {
    viewTableStructure: true,
    copyTableName: true,
    copyCreateTable: false,
    addFieldComment: true,
  },
  redis: { copyKeyName: true, viewTtl: true },
  zk: { createNode: false, deleteNode: false },
});

const isJdbc = computed(
  () =>
    (props.settingType || "").toLowerCase().includes("jdbc") ||
    (props.settingType || "").toLowerCase().includes("sql"),
);
const isRedis = computed(() =>
  (props.settingType || "").toLowerCase().includes("redis"),
);
const isZk = computed(
  () =>
    (props.settingType || "").toLowerCase().includes("zk") ||
    (props.settingType || "").toLowerCase().includes("zookeeper"),
);

watch(
  () => props.modelValue,
  async (v) => {
    visibleLocal.value = v;
    if (v && props.settingId) {
      const res = await getConsoleConfig(props.settingId);
      const text = res?.data as string | undefined;
      if (text) {
        try {
          const cfg = JSON.parse(text);
          form.jdbc = Object.assign(
            {
              viewTableStructure: true,
              copyTableName: true,
              copyCreateTable: false,
              addFieldComment: true,
            },
            cfg?.jdbc || {},
          );
          form.redis = Object.assign(
            { copyKeyName: true, viewTtl: true },
            cfg?.redis || {},
          );
          form.zk = Object.assign(
            { createNode: false, deleteNode: false },
            cfg?.zk || {},
          );
        } catch (_) {
          // ignore parse error, keep default
        }
      }
    }
  },
  { immediate: true },
);

function handleClose() {
  emit("update:modelValue", false);
}

async function handleSave() {
  if (!props.settingId) return;
  saving.value = true;
  try {
    const cfg: ConsoleConfig = {
      jdbc: { ...form.jdbc },
      redis: { ...form.redis },
      zk: { ...form.zk },
    };
    await saveConsoleConfig(props.settingId, cfg);
    emit("saved");
    emit("update:modelValue", false);
  } finally {
    saving.value = false;
  }
}
</script>
<style scoped lang="scss">
.section {
  padding: 8px 4px;
}
.section-title {
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}
.data-console-setting-dialog :deep(.el-dialog__body) {
  padding-left: 24px;
  padding-right: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
