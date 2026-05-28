<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>解析策略</strong>
        <span>字段抽取与上下文映射</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <div class="spider-node-panel__item">
        <span>解析模式</span>
        <el-select :model-value="parseMode" @update:model-value="value => updateConfig('parseMode', value)">
          <el-option v-for="item in parseModeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <label class="spider-node-panel__item">
        <span>规则 / 提示词</span>
        <el-input :model-value="selectorText" type="textarea" :rows="4" @update:model-value="value => updateConfig('selector', value)" />
      </label>
    </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>页面字段映射</strong>
        <el-button v-if="parseMode !== 'AI'" type="primary" plain @click="addMappingRow">添加字段</el-button>
      </div>

      <label v-if="parseMode === 'AI'" class="spider-node-panel__item">
        <span>自然语言映射上下文</span>
        <el-input :model-value="nlpMapping" type="textarea" :rows="6" placeholder="例如：提取每个项目的名称(name)、所属组织(owner)、星标数(stars)、编程语言(language)和描述(description)" @update:model-value="value => updateConfig('nlpMapping', value)" />
      </label>

      <div v-else-if="fieldMappings.length" class="spider-node-panel__mapping-list">
        <article
          v-for="(item, index) in fieldMappings"
          :key="index"
          class="spider-node-panel__mapping-card"
        >
          <label class="spider-node-panel__item">
            <span>页面字段</span>
            <el-input :model-value="item.pageField" @update:model-value="value => updateMapping(index, 'pageField', value)" />
          </label>
          <label class="spider-node-panel__item">
            <span>爬虫上下文字段</span>
            <el-input :model-value="item.contextField" @update:model-value="value => updateMapping(index, 'contextField', value)" />
          </label>
          <label class="spider-node-panel__item">
            <span>选择器类型</span>
            <el-select :model-value="item.selectorType || 'XPATH'" @update:model-value="value => updateMapping(index, 'selectorType', value)">
              <el-option v-for="option in selectorTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </label>
          <label class="spider-node-panel__item">
            <span>选择器 / 属性</span>
            <el-input :model-value="item.selector" type="textarea" :rows="3" @update:model-value="value => updateMapping(index, 'selector', value)" />
          </label>
          <div class="spider-node-panel__mapping-actions">
            <el-button type="danger" plain @click="removeMappingRow(index)">删除</el-button>
          </div>
        </article>
      </div>

      <div v-else-if="!fieldMappings.length && parseMode !== 'AI'" class="spider-node-panel__empty">暂无字段映射，点击"添加字段"创建。</div>
      <div v-else-if="!fieldMappings.length && parseMode === 'AI'" class="spider-node-panel__empty">使用上方自然语言描述字段映射关系。</div>
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
import type { ScMFlowNodeMeta } from "@repo/components/ScFlowEditor";

defineOptions({ name: "SpiderDataParseConfigPanel" });

type FieldMapping = {
  pageField: string;
  contextField: string;
  selectorType: string;
  selector: string;
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

const parseModeOptions = [
  { label: "XPath", value: "XPATH" },
  { label: "CSS", value: "CSS" },
  { label: "AI", value: "AI" },
  { label: "可视化", value: "VISUAL" },
];

const selectorTypeOptions = [
  { label: "XPath", value: "XPATH" },
  { label: "CSS", value: "CSS" },
  { label: "AI", value: "AI" },
  { label: "JSON_PATH", value: "JSON_PATH" },
  { label: "REGEX", value: "REGEX" },
];

const parseMode = computed(() => String(props.nodeConfig.parseMode || "AI"));
const selectorText = computed(() => String(props.nodeConfig.selector || ""));
const nlpMapping = computed(() => String(props.nodeConfig.nlpMapping || ""));
const fieldMappings = computed<FieldMapping[]>(() =>
  Array.isArray(props.nodeConfig.fieldMappings) ? props.nodeConfig.fieldMappings : [],
);

function nextMappings() {
  return fieldMappings.value.map(item => ({ ...item }));
}

function addMappingRow() {
  const next = nextMappings();
  next.push({
    pageField: "",
    contextField: "",
    selectorType: "XPATH",
    selector: "",
  });
  props.updateConfig("fieldMappings", next);
}

function removeMappingRow(index: number) {
  const next = nextMappings();
  next.splice(index, 1);
  props.updateConfig("fieldMappings", next);
}

function updateMapping(index: number, field: keyof FieldMapping, value: unknown) {
  const next = nextMappings();
  next[index] = {
    ...next[index],
    [field]: String(value ?? ""),
  };
  props.updateConfig("fieldMappings", next);
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

.spider-node-panel__section-head span {
  color: var(--lay-text-placeholder);
  font-size: 12px;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--lay-accent) 12%, var(--lay-border));
  border-radius: 14px;
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
}

.spider-node-panel__mapping-actions {
  display: flex;
  justify-content: flex-end;
  grid-column: 1 / -1;
}

.spider-node-panel__footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner),
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
}
</style>
