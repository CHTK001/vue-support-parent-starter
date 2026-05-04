<template>
  <div class="software-manage-page">
    <header class="software-manage-page__header">
      <div class="software-manage-page__title">
        <h2>软件管理</h2>
        <p v-if="softwareName">当前软件：{{ softwareName }} ({{ softwareCode }})</p>
      </div>
      <div class="software-manage-page__actions">
        <ScButton @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
          刷新
        </ScButton>
      </div>
    </header>

    <div class="software-manage-page__content">
      <div v-if="!bindingId" class="software-manage-page__empty">
        <ScEmpty description="请从服务配置页面进入软件管理" />
      </div>

      <template v-else>
        <ScTabs v-model="activeTab" :tabs="mainTabs" />

        <div class="software-manage-page__tab-content">
          <SoftwareBusinessTab v-show="activeTab === 'config'">
            <slot name="business-config" />
          </SoftwareBusinessTab>

          <SoftwareScriptTab
            v-show="activeTab === 'scripts'"
            v-model="scriptData"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import ScTabs from "@repo/components/ScTabs";
import ScButton from "@repo/components/ScButton";
import ScEmpty from "@repo/components/ScEmpty";
import { IconifyIconOnline } from "@repo/components";
import SoftwareBusinessTab from "./SoftwareBusinessTab.vue";
import SoftwareScriptTab from "./SoftwareScriptTab.vue";

interface ScriptData {
  installScript?: string;
  startScript?: string;
  stopScript?: string;
  restartScript?: string;
  statusScript?: string;
  uninstallScript?: string;
}

const props = defineProps<{
  bindingId?: number | string;
  softwareName?: string;
  softwareCode?: string;
  initialScriptData?: ScriptData;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "update:scriptData", value: ScriptData): void;
}>();

const mainTabs = [
  { key: "config", label: "业务配置" },
  { key: "scripts", label: "脚本配置" },
];

const activeTab = ref("config");
const scriptData = ref<ScriptData>({
  installScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  uninstallScript: "",
});

watch(
  () => props.initialScriptData,
  (val) => {
    if (val) {
      scriptData.value = { ...val };
    }
  },
  { immediate: true },
);

watch(scriptData, (val) => {
  emit("update:scriptData", val);
}, { deep: true });

const handleRefresh = () => {
  emit("refresh");
};
</script>

<style scoped lang="scss">
.software-manage-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background: var(--el-bg-color-page);
}

.software-manage-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.software-manage-page__title {
  h2 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.software-manage-page__actions {
  display: flex;
  gap: 12px;
}

.software-manage-page__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
}

.software-manage-page__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.software-manage-page__tab-content {
  flex: 1;
  margin-top: 16px;
}
</style>
