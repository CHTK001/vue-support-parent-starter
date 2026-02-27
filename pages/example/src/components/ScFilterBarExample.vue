<!--
 * ScFilterBar 组件示例 - 拖拽式字段配置器
 * @author CH
 * @version 2.0.0
 * @since 2025-12-07
-->
<template>
  <div class="sc-filter-bar-example">
    <!-- 拖拽配置器 -->
    <DemoBlock title="🎨 拖拽式字段配置器" :code="generatedCode" dark>
      <div class="builder-container">
        <!-- 左侧：字段类型面板 -->
        <div class="field-palette">
          <div class="palette-header">
            <h4 class="palette-title">
              <IconifyIconOnline icon="ri:apps-line" />
              字段类型
            </h4>
            <ScTooltip content="只显示图标" placement="top">
              <ScSwitch v-model="config.iconOnly" size="small" />
            </ScTooltip>
          </div>
          <div class="palette-list" :class="{ 'icon-only': config.iconOnly }">
            <div
              v-for="type in fieldTypes"
              :key="type.value"
              class="palette-item"
              draggable="true"
              @dragstart="handleDragStart($event, type)"
            >
              <ScTooltip :content="type.label" :disabled="!config.iconOnly" placement="right">
                <div class="palette-item-content">
                  <IconifyIconOnline :icon="type.icon" />
                  <span v-if="!config.iconOnly">{{ type.label }}</span>
                </div>
              </ScTooltip>
            </div>
          </div>
        </div>

        <!-- 中间：配置区域 -->
        <div class="builder-main">
          <div class="builder-header">
            <h4>已配置字段 ({{ builderFields.length }})</h4>
            <ScButton type="danger" size="small" text @click="clearFields" :disabled="builderFields.length === 0">
              <IconifyIconOnline icon="ri:delete-bin-line" />
              清空
            </ScButton>
          </div>
          
          <div
            class="drop-zone"
            :class="{ 'is-dragging': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop="handleDrop"
          >
            <div v-if="builderFields.length === 0" class="drop-placeholder">
              <IconifyIconOnline icon="ri:drag-drop-line" />
              <span>拖拽左侧字段类型到此处</span>
            </div>
            <draggable
              v-else
              v-model="builderFields"
              item-key="id"
              handle=".field-handle"
              animation="200"
              class="field-list"
            >
              <template #item="{ element: field, index }">
                <div class="field-item">
                  <div class="field-handle">
                    <IconifyIconOnline icon="ri:draggable" />
                  </div>
                  <div class="field-type-tag">
                    <IconifyIconOnline :icon="getFieldIcon(field.type)" />
                    <span>{{ getFieldLabel(field.type) }}</span>
                  </div>
                  <div class="field-info">
                    <ScInput 
                      v-model="field.label"
                      size="small"
                      placeholder="标签"
                      class="field-label-input"
                    />
                    <ScInput 
                      v-model="field.prop"
                      size="small"
                      placeholder="字段名"
                      class="field-prop-input"
                    />
                  </div>
                  <div class="field-actions">
                    <ScButton type="danger" size="small" text @click="removeField(index)">
                      <IconifyIconOnline icon="ri:close-line" />
                    </ScButton>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>

        <!-- 右侧：配置选项 -->
        <div class="config-panel">
          <h4 class="panel-title">
            <IconifyIconOnline icon="ri:settings-3-line" />
            组件配置
          </h4>
          <ScForm label-position="top" size="small">
            <ScFormItem label="布局模式">
              <ScRadioGroup v-model="config.layout">
                <el-radio-button value="inline">行内</el-radio-button>
                <el-radio-button value="grid">网格</el-radio-button>
              </ScRadioGroup>
            </ScFormItem>
            <ScFormItem label="显示数量">
              <ScSlider v-model="config.visibleCount" :min="1" :max="10" show-input />
            </ScFormItem>
            <ScFormItem label="网格列数" v-if="config.layout === 'grid'">
              <ScSlider v-model="config.columns" :min="1" :max="6" show-input />
            </ScFormItem>
            <ScFormItem label="边框">
              <ScSwitch v-model="config.border" />
            </ScFormItem>
            <ScFormItem label="背景">
              <ScSwitch v-model="config.background" />
            </ScFormItem>
            <ScFormItem label="实时搜索">
              <ScSwitch v-model="config.realtime" />
            </ScFormItem>
            <ScFormItem label="防抖时间(ms)" v-if="config.realtime">
              <ScInputNumber v-model="config.debounceTime" :min="100" :max="2000" :step="100" />
            </ScFormItem>
            <ScFormItem label="高级筛选">
              <ScSwitch v-model="config.showDrawer" />
            </ScFormItem>
            <ScFormItem label="输入框宽度">
              <ScSlider v-model="config.inputWidth" :min="100" :max="300" :step="10" show-input />
            </ScFormItem>
          </ScForm>
        </div>
      </div>

      <!-- 预览效果 - 独立整行 -->
      <div class="preview-section" v-if="builderFields.length > 0">
        <h4 class="preview-title">
          <IconifyIconOnline icon="ri:eye-line" />
          实时预览
        </h4>
        <div class="preview-content">
          <ScFilterBar
            v-model="formData"
            :options="previewOptions"
            :show-number="config.visibleCount"
            :show-advanced="true"
            :show-drawer="config.showDrawer"
            :layout="config.layout"
            :columns="config.columns"
            :border="config.border"
            :background="config.background"
            :realtime="config.realtime"
            :enable-debounce="config.realtime"
            :debounce-delay="config.debounceTime"
            :input-width="config.inputWidth"
            expression-format="sql"
            @search="handleFilterChange"
          />
        </div>
        <div class="preview-result">
          <strong>筛选值：</strong>
          <code>{{ typeof searchResult === 'string' ? searchResult : JSON.stringify(searchResult, null, 2) }}</code>
        </div>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import ScFilterBar from "@repo/components/ScFilterBar/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import DemoBlock from "./DemoBlock.vue";
import { message } from "@repo/utils";
import { ScSlider } from "@repo/components";
import draggable from "vuedraggable";

// ==================== 类型定义 ====================
interface FieldType {
  value: string;
  label: string;
  icon: string;
}

interface BuilderField {
  id: string;
  type: string;
  prop: string;
  label: string;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
}

// ==================== 字段类型列表（基于 ScFilterBar 支持的类型）====================
const fieldTypes: FieldType[] = [
  { value: "text", label: "文本输入", icon: "ri:input-field" },
  { value: "number", label: "数字", icon: "ri:hashtag" },
  { value: "select", label: "下拉选择", icon: "ri:arrow-down-s-line" },
  { value: "date", label: "日期", icon: "ri:calendar-line" },
  { value: "daterange", label: "日期范围", icon: "ri:calendar-2-line" },
  { value: "datetime", label: "日期时间", icon: "ri:calendar-check-line" },
  { value: "datetimerange", label: "时间范围", icon: "ri:calendar-event-line" },
  { value: "time", label: "时间", icon: "ri:time-line" },
  { value: "switch", label: "开关", icon: "ri:toggle-line" },
  { value: "tags", label: "标签", icon: "ri:price-tag-line" },
];

// ==================== 拖拽状态 ====================
const isDragging = ref(false);
let draggedType: FieldType | null = null;

// ==================== 配置器数据 ====================
const builderFields = ref<BuilderField[]>([]);
const previewValues = ref<Record<string, unknown>>({});
const config = reactive({
  layout: "inline" as "inline" | "grid",
  visibleCount: 4,
  columns: 4,
  border: false,
  background: false,
  realtime: false,
  debounceTime: 300,
  iconOnly: false,
  showDrawer: true,
  inputWidth: 180,
});

// ==================== ScFilterBar options 格式 ====================
const previewOptions = computed(() => {
  return builderFields.value.map(field => ({
    value: field.prop,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder || `请输入${field.label}`,
    extend: field.type === "select" ? {
      data: [{ value: 1, label: "选项1" }, { value: 2, label: "选项2" }],
      multiple: false,
    } : undefined,
  }));
});

// ==================== 生成代码 ====================
const generatedCode = computed(() => {
  if (builderFields.value.length === 0) {
    return `<!-- 拖拽左侧字段类型到配置区域生成代码 -->`;
  }
  
  const fieldsCode = builderFields.value.map(f => {
    let code = `  { prop: "${f.prop}", label: "${f.label}", type: "${f.type}"`;
    if (["select", "radio", "checkbox"].includes(f.type)) {
      code += `, options: [{ value: 1, label: "选项1" }, { value: 2, label: "选项2" }]`;
    }
    code += " }";
    return code;
  }).join(",\n");
  
  const propsCode: string[] = [];
  propsCode.push(`v-model="filterValues"`);
  propsCode.push(`:fields="fields"`);
  propsCode.push(`:visible-count="${config.visibleCount}"`);
  if (config.layout !== "inline") propsCode.push(`layout="${config.layout}"`);
  if (config.layout === "grid") propsCode.push(`:columns="${config.columns}"`);
  if (config.border) propsCode.push("border");
  if (config.background) propsCode.push("background");
  if (config.realtime) propsCode.push("realtime");
  if (config.realtime && config.debounceTime !== 300) propsCode.push(`:debounce-time="${config.debounceTime}"`);
  propsCode.push(`@search="handleSearch"`);
  
  return `<template>
  <ScFilterBar
    ${propsCode.join("\n    ")}
  />
</template>

<script setup>
const filterValues = ref({});

const fields = [
${fieldsCode}
];

function handleSearch(values) {
  console.log("搜索:", values);
}
<\/script>`;
});

// ==================== 拖拽处理 ====================
function handleDragStart(event: DragEvent, type: FieldType) {
  draggedType = type;
  event.dataTransfer!.effectAllowed = "copy";
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  
  if (draggedType) {
    const id = `field_${Date.now()}`;
    const count = builderFields.value.filter(f => f.type === draggedType!.value).length + 1;
    builderFields.value.push({
      id,
      type: draggedType.value,
      prop: `${draggedType.value}${count}`,
      label: `${draggedType.label}${count}`,
    });
    draggedType = null;
    message("字段添加成功", { type: "success" });
  }
}

function getFieldIcon(type: string): string {
  return fieldTypes.find(t => t.value === type)?.icon || "ri:input-field";
}

function getFieldLabel(type: string): string {
  return fieldTypes.find(t => t.value === type)?.label || type;
}

function removeField(index: number) {
  builderFields.value.splice(index, 1);
}

function clearFields() {
  builderFields.value = [];
  previewValues.value = {};
}

function editField(field: BuilderField) {
  message(`编辑字段: ${field.label}`, { type: "info" });
}

// ==================== 过滤结果 ====================
const formData = ref<Record<string, unknown>>({});  // 表单数据
const searchResult = ref<any>("");  // 搜索结果（可以是对象或字符串）

// ==================== 事件处理 ====================
function handleFilterChange(values: any) {
  searchResult.value = values;
  console.log("过滤:", values);
}

function handleSearch(values: Record<string, unknown>) {
  console.log("搜索:", values);
}

function handleReset() {
  console.log("重置");
}
</script>

<style lang="scss" scoped>
.sc-filter-bar-example {
  padding: 20px;
}

.builder-container {
  display: flex;
  gap: 20px;
  min-height: 280px;
  
  @media (max-width: 1200px) {
    flex-direction: column;
  }
}

// 字段类型面板
.field-palette {
  width: 160px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 12px;
  max-height: 280px;
  overflow-y: auto;
  
  .palette-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .palette-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .palette-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    &.icon-only {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4px;
      
      .palette-item {
        padding: 6px;
        justify-content: center;
        width: 32px;
        height: 32px;
      }
    }
  }
  
  .palette-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(0, 200, 255, 0.1);
    border: 1px solid rgba(0, 200, 255, 0.3);
    border-radius: 6px;
    color: rgba(200, 230, 255, 0.9);
    font-size: 13px;
    cursor: grab;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(0, 200, 255, 0.2);
      border-color: rgba(0, 200, 255, 0.5);
      transform: translateX(4px);
    }
    
    &:active {
      cursor: grabbing;
    }
    
    .palette-item-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

// 配置主区域
.builder-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .builder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h4 {
      margin: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

// 拖放区域
.drop-zone {
  min-height: 120px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(0, 200, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
  
  &.is-dragging {
    border-color: rgba(0, 200, 255, 0.8);
    background: rgba(0, 200, 255, 0.1);
  }
  
  .drop-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 90px;
    color: rgba(255, 255, 255, 0.5);
    gap: 8px;
    
    .iconify {
      font-size: 32px;
    }
  }
}

// 字段列表
.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 6px;
  
  .field-handle {
    color: rgba(255, 255, 255, 0.4);
    cursor: grab;
  }
  
  .field-type-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(0, 200, 255, 0.2);
    border-radius: 4px;
    font-size: 12px;
    color: #00c8ff;
    white-space: nowrap;
  }
  
  .field-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(0, 200, 255, 0.8);
    
    .field-label-input,
    .field-prop-input {
      width: 120px;
      
      :deep(.el-input__wrapper) {
        background: rgba(0, 0, 0, 0.3);
        border-color: rgba(0, 200, 255, 0.3);
      }
      
      :deep(.el-input__inner) {
        color: #fff;
      }
    }
  }
  
  .field-actions {
    display: flex;
    gap: 4px;
  }
}

// 预览区域（独立整行）
.preview-section {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  
  .preview-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .preview-content {
    padding: 16px;
    background: var(--el-bg-color);
    border-radius: 6px;
  }
  
  .preview-result {
    margin-top: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    
    code {
      color: #00c8ff;
    }
  }
}

// 配置面板
.config-panel {
  width: 240px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  
  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  :deep(.el-form-item__label) {
    color: rgba(255, 255, 255, 0.7);
  }
}

// DemoBlock 通用样式
.demo-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.demo-result {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 13px;
  
  code {
    color: var(--el-color-primary);
    word-break: break-all;
  }
}

// 列表动画
.field-list-enter-active,
.field-list-leave-active {
  transition: all 0.3s ease;
}

.field-list-enter-from,
.field-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>