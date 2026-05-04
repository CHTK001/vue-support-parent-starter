<template>
  <div class="software-script-tab">
    <ScTabs v-model="activeScriptTab" :tabs="scriptTabs" />

    <div class="software-script-tab__content">
      <ScScriptEditor
        v-if="activeScriptTab === 'install'"
        v-model="localData.installScript"
        label="安装脚本"
        language="shell"
        :title-visible="true"
        empty-text="暂无安装脚本"
        :keyword-highlights="keywordHighlights"
        @update:model-value="handleUpdate('installScript', $event)"
      />
      <ScScriptEditor
        v-if="activeScriptTab === 'start'"
        v-model="localData.startScript"
        label="启动脚本"
        language="shell"
        :title-visible="true"
        empty-text="暂无启动脚本"
        :keyword-highlights="keywordHighlights"
        @update:model-value="handleUpdate('startScript', $event)"
      />
      <ScScriptEditor
        v-if="activeScriptTab === 'stop'"
        v-model="localData.stopScript"
        label="停止脚本"
        language="shell"
        :title-visible="true"
        empty-text="暂无停止脚本"
        :keyword-highlights="keywordHighlights"
        @update:model-value="handleUpdate('stopScript', $event)"
      />
      <ScScriptEditor
        v-if="activeScriptTab === 'restart'"
        v-model="localData.restartScript"
        label="重启脚本"
        language="shell"
        :title-visible="true"
        empty-text="暂无重启脚本"
        :keyword-highlights="keywordHighlights"
        @update:model-value="handleUpdate('restartScript', $event)"
      />
      <ScScriptEditor
        v-if="activeScriptTab === 'status'"
        v-model="localData.statusScript"
        label="状态脚本"
        language="shell"
        :title-visible="true"
        empty-text="暂无状态脚本"
        :keyword-highlights="keywordHighlights"
        @update:model-value="handleUpdate('statusScript', $event)"
      />
      <ScScriptEditor
        v-if="activeScriptTab === 'uninstall'"
        v-model="localData.uninstallScript"
        label="卸载脚本"
        language="shell"
        :title-visible="true"
        empty-text="暂无卸载脚本"
        :keyword-highlights="keywordHighlights"
        @update:model-value="handleUpdate('uninstallScript', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import ScTabs from "@repo/components/ScTabs";
import ScScriptEditor from "@repo/components/ScScriptEditor";

interface ScriptData {
  installScript?: string;
  startScript?: string;
  stopScript?: string;
  restartScript?: string;
  statusScript?: string;
  uninstallScript?: string;
}

const props = defineProps<{
  modelValue?: ScriptData;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: ScriptData): void;
}>();

const keywordHighlights = [
  "sudo",
  "systemctl",
  "service",
  "docker",
  "mysql",
  "redis",
  "nginx",
  "bash",
  "sh",
  "curl",
  "wget",
  "yum",
  "apt",
  "brew",
];

const scriptTabs = [
  { key: "install", label: "安装脚本" },
  { key: "start", label: "启动脚本" },
  { key: "stop", label: "停止脚本" },
  { key: "restart", label: "重启脚本" },
  { key: "status", label: "状态脚本" },
  { key: "uninstall", label: "卸载脚本" },
];

const activeScriptTab = ref("install");
const localData = ref<ScriptData>({
  installScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  uninstallScript: "",
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      localData.value = {
        installScript: val.installScript || "",
        startScript: val.startScript || "",
        stopScript: val.stopScript || "",
        restartScript: val.restartScript || "",
        statusScript: val.statusScript || "",
        uninstallScript: val.uninstallScript || "",
      };
    }
  },
  { immediate: true },
);

const handleUpdate = (key: keyof ScriptData, value: string) => {
  localData.value[key] = value;
  emit("update:modelValue", { ...localData.value });
};
</script>

<style scoped lang="scss">
.software-script-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.software-script-tab__content {
  min-height: 300px;
}
</style>
