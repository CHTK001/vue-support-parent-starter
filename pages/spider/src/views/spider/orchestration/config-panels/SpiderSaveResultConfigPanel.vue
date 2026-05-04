<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>结果存储</strong>
        <span>数据源、上下文字段与库表字段映射</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <div class="spider-node-panel__item">
        <span>存储方式</span>
        <el-select :model-value="storageMode" @update:model-value="value => updateConfig('storageMode', value)">
          <el-option v-for="item in storageOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <label class="spider-node-panel__item">
        <span>结果结构编码</span>
        <el-input :model-value="schemaCode" @update:model-value="value => updateConfig('schemaCode', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>目标表名</span>
        <el-input :model-value="outputTableName" @update:model-value="value => updateConfig('outputTableName', value)" />
      </label>

      <div class="spider-node-panel__toolbar">
        <el-button type="primary" plain @click="mockConfigDataSource">配置数据源</el-button>
        <span class="spider-node-panel__hint">{{ dataSourceLabel }}</span>
      </div>
    </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>上下文字段映射</strong>
        <el-button type="primary" plain @click="addMappingRow">添加映射</el-button>
      </div>

      <div v-if="resultMappings.length" class="spider-node-panel__mapping-list">
        <article
          v-for="(item, index) in resultMappings"
          :key="index"
          class="spider-node-panel__mapping-card"
        >
          <label class="spider-node-panel__item">
            <span>爬虫上下文字段</span>
            <el-input :model-value="item.contextField" @update:model-value="value => updateMapping(index, 'contextField', value)" />
          </label>
          <label class="spider-node-panel__item">
            <span>数据库字段</span>
            <el-input :model-value="item.columnName" @update:model-value="value => updateMapping(index, 'columnName', value)" />
          </label>
          <div class="spider-node-panel__mapping-actions">
            <el-button type="danger" plain @click="removeMappingRow(index)">删除</el-button>
          </div>
        </article>
      </div>

      <div v-else class="spider-node-panel__empty">暂无字段映射，点击“添加映射”开始配置。</div>
    </div>

    <div class="spider-node-panel__footer">
      <el-button type="danger" plain @click="removeNode">删除节点</el-button>
      <el-button type="primary" @click="saveConfig">保存配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton, ElInput, ElOption, ElSelect } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScMFlowEditor";

defineOptions({ name: "SpiderSaveResultConfigPanel" });

type ResultMapping = {
  contextField: string;
  columnName: string;
};

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const storageOptions = [
  { label: "数据库", value: "DATABASE" },
];

const storageMode = computed(() => String(props.nodeConfig.storageMode || "DATABASE"));
const schemaCode = computed(() => String(props.nodeConfig.schemaCode || ""));
const outputTableName = computed(() => String(props.nodeConfig.outputTableName || ""));
const dataSourceLabel = computed(() => String(props.nodeConfig.dataSourceName || "未配置数据源"));
const resultMappings = computed<ResultMapping[]>(() =>
  Array.isArray(props.nodeConfig.resultMappings) ? props.nodeConfig.resultMappings : [],
);

function nextMappings() {
  return resultMappings.value.map(item => ({ ...item }));
}

function addMappingRow() {
  const next = nextMappings();
  next.push({ contextField: "", columnName: "" });
  props.updateConfig("resultMappings", next);
}

function removeMappingRow(index: number) {
  const next = nextMappings();
  next.splice(index, 1);
  props.updateConfig("resultMappings", next);
}

function updateMapping(index: number, field: keyof ResultMapping, value: unknown) {
  const next = nextMappings();
  next[index] = {
    ...next[index],
    [field]: String(value ?? ""),
  };
  props.updateConfig("resultMappings", next);
}

function mockConfigDataSource() {
  props.updateConfig("dataSourceName", "默认监控库");
  props.updateConfig("dataSourceCode", "monitor-default");
}
</script>

<style scoped lang="scss">
.spider-node-panel {
  display: grid;
  gap: 18px;
}

.spider-node-panel__section {
  display: grid;
  gap: 12px;
}

.spider-node-panel__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spider-node-panel__section-head strong {
  color: var(--lay-text-primary);
  font-size: 14px;
}

.spider-node-panel__section-head span,
.spider-node-panel__hint {
  color: var(--lay-text-placeholder);
  font-size: 12px;
}

.spider-node-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spider-node-panel__item {
  display: grid;
  gap: 8px;
}

.spider-node-panel__item > span {
  color: var(--lay-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.spider-node-panel__mapping-list {
  display: grid;
  gap: 12px;
}

.spider-node-panel__mapping-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 12px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--lay-accent) 12%, var(--lay-border));
  border-radius: 14px;
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
  align-items: end;
}

.spider-node-panel__mapping-actions {
  display: flex;
  justify-content: flex-end;
}

.spider-node-panel__footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-select__wrapper) {
  border-radius: 12px;
}

.spider-node-panel__empty {
  padding: 18px;
  border-radius: 12px;
  color: var(--lay-text-placeholder);
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
  text-align: center;
}

@media (max-width: 720px) {
  .spider-node-panel__mapping-card {
    grid-template-columns: 1fr;
  }

  .spider-node-panel__mapping-actions {
    justify-content: stretch;
  }
}
</style>
