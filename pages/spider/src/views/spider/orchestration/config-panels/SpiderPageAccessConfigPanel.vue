<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>页面访问</strong>
        <span>访问模式、目标地址与运行参数</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <div class="spider-node-panel__item">
        <span>访问模式</span>
        <el-select :model-value="accessMode" @update:model-value="value => updateConfig('accessMode', value)">
          <el-option v-for="item in accessModeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <label class="spider-node-panel__item">
        <span>目标地址</span>
        <el-input :model-value="targetUrl" @update:model-value="value => updateConfig('targetUrl', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>超时(秒)</span>
        <el-input-number :model-value="timeoutSeconds" :min="1" @update:model-value="value => updateConfig('timeoutSeconds', Number(value || 0))" />
      </label>

      </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>请求上下文</strong>
        <span>Cookie、Header、代理等运行参数</span>
      </div>

      <label class="spider-node-panel__item">
        <span>Cookie JSON</span>
        <el-input :model-value="cookieJson" type="textarea" :rows="4" @update:model-value="value => updateConfig('cookieJson', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>Header JSON</span>
        <el-input :model-value="headerJson" type="textarea" :rows="4" @update:model-value="value => updateConfig('headerJson', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>代理引用</span>
        <el-input :model-value="proxyRef" @update:model-value="value => updateConfig('proxyRef', value)" />
      </label>

    </div>

    <div class="spider-node-panel__footer">
      <button type="button" class="spider-node-panel__danger" @click="removeNode">删除节点</button>
      <button type="button" class="spider-node-panel__primary" @click="saveConfig">保存配置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElInput, ElInputNumber, ElOption, ElSelect } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScMFlowEditor";
defineOptions({ name: "SpiderPageAccessConfigPanel" });

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const accessModeOptions = [
  { label: "HTTP", value: "HTTP" },
  { label: "Playwright", value: "PLAYWRIGHT" },
];

const accessMode = computed(() => String(props.nodeConfig.accessMode || "HTTP"));
const targetUrl = computed(() => String(props.nodeConfig.targetUrl || ""));
const timeoutSeconds = computed(() => Number(props.nodeConfig.timeoutSeconds || 30));
const cookieJson = computed(() => String(props.nodeConfig.cookieJson || ""));
const headerJson = computed(() => String(props.nodeConfig.headerJson || ""));
const proxyRef = computed(() => String(props.nodeConfig.proxyRef || ""));
</script>

<style scoped lang="scss">
.spider-node-panel { display: grid; gap: 18px; }
.spider-node-panel__section { display: grid; gap: 12px; }
.spider-node-panel__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__section-head strong { color: var(--lay-text-primary); font-size: 14px; }
.spider-node-panel__section-head span { color: var(--lay-text-placeholder); font-size: 12px; }
.spider-node-panel__item { display: grid; gap: 8px; }
.spider-node-panel__item > span { color: var(--lay-text-secondary); font-size: 12px; }
.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner),
.spider-node-panel :deep(.el-select__wrapper) {
  border-radius: 12px;
}
.spider-node-panel__switch { display: flex; align-items: center; gap: 8px; }
.spider-node-panel__footer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.spider-node-panel__danger, .spider-node-panel__primary { height: 38px; padding: 0 12px; border-radius: 12px; cursor: pointer; }
.spider-node-panel__danger { border: 1px solid color-mix(in srgb, #ef4444 25%, var(--lay-border)); background: color-mix(in srgb, #ef4444 8%, transparent); color: #b91c1c; }
.spider-node-panel__primary { border: 1px solid color-mix(in srgb, var(--lay-accent) 24%, var(--lay-border)); background: color-mix(in srgb, var(--lay-accent) 12%, transparent); color: var(--lay-text-primary); }
</style>
