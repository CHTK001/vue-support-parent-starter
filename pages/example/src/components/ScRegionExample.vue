<template>
  <div class="sc-region-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>
        
        <ScForm label-position="top" size="small">
          <ScFormItem label="dataSource 数据源">
            <ScSelect
              v-model="config.dataSource"
              layout="card"
              :options="dataSourceOptions"
              :gap="6"
              width="120px"
              @change="handleDataSourceChange"
            />
          </ScFormItem>

          <ScFormItem label="placeholder">
            <ScInput v-model="config.placeholder" />
          </ScFormItem>
          
          <ScFormItem label="size 尺寸">
            <ScSelect
              v-model="config.size"
              layout="card"
              :options="sizeOptions"
              :gap="6"
              width="70px"
            />
          </ScFormItem>
          
          <ScFormItem label="separator 分隔符">
            <ScInput v-model="config.separator" style="width: 80px" />
          </ScFormItem>
          
          <ScFormItem label="maxCollapseTags 最大标签数">
            <ScInputNumber v-model="config.maxCollapseTags" :min="1" :max="10" />
          </ScFormItem>

          <ScDivider />
          
          <div class="switch-group">
            <div class="switch-item">
              <ScTooltip content="禁用整个选择器" placement="left">
                <span>disabled 禁用</span>
              </ScTooltip>
              <ScSwitch v-model="config.disabled" />
            </div>
            <div class="switch-item">
              <ScTooltip content="是否显示清空按钮" placement="left">
                <span>clearable 可清空</span>
              </ScTooltip>
              <ScSwitch v-model="config.clearable" />
            </div>
            <div class="switch-item">
              <ScTooltip content="是否可输入搜索" placement="left">
                <span>filterable 可搜索</span>
              </ScTooltip>
              <ScSwitch v-model="config.filterable" />
            </div>
            <div class="switch-item">
              <ScTooltip content="输入框显示完整路径还是只显示最后一级" placement="left">
                <span>showAllLevels 显示完整路径</span>
              </ScTooltip>
              <ScSwitch v-model="config.showAllLevels" />
            </div>
            <div class="switch-item">
              <ScTooltip content="可选择任意一级，不必选到最后一级" placement="left">
                <span>checkStrictly 任意级选择</span>
              </ScTooltip>
              <ScSwitch v-model="config.checkStrictly" />
            </div>
            <div class="switch-item">
              <ScTooltip content="在下拉选项中显示地区编码" placement="left">
                <span>showCode 显示编码</span>
              </ScTooltip>
              <ScSwitch v-model="config.showCode" />
            </div>
            <div class="switch-item">
              <ScTooltip content="输入框只显示编码不显示名称" placement="left">
                <span>showCodeOnly 只显示编码</span>
              </ScTooltip>
              <ScSwitch v-model="config.showCodeOnly" />
            </div>
            <div class="switch-item">
              <ScTooltip content="是否支持选择多个地区" placement="left">
                <span>multiple 多选</span>
              </ScTooltip>
              <ScSwitch v-model="config.multiple" @change="handleMultipleChange" />
            </div>
            <div class="switch-item">
              <ScTooltip :content="!config.multiple ? '仅多选模式下可用' : '多选时折叠已选标签'" placement="left">
                <span :class="{ 'is-disabled': !config.multiple }">collapseTags 折叠标签</span>
              </ScTooltip>
              <ScSwitch v-model="config.collapseTags" :disabled="!config.multiple" />
            </div>
            <div class="switch-item">
              <ScTooltip :content="config.multiple ? '多选模式下始终返回完整路径' : (config.emitPath ? '开启: 返回完整路径 [省,市,区]' : '关闭: 只返回选中级的编码')" placement="left">
                <span :class="{ 'is-disabled': config.multiple }">emitPath 返回完整路径</span>
              </ScTooltip>
              <ScSwitch v-model="config.emitPath" :disabled="config.multiple" />
            </div>
          </div>
        </ScForm>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>
        
        <div class="preview-area">
          <ScRegion
            v-model="regionValue"
            :data-source="config.dataSource"
            :placeholder="config.placeholder"
            :disabled="config.disabled"
            :clearable="config.clearable"
            :filterable="config.filterable"
            :size="config.size"
            :show-all-levels="config.showAllLevels"
            :separator="config.separator"
            :check-strictly="config.checkStrictly"
            :show-code="config.showCode"
            :show-code-only="config.showCodeOnly"
            :multiple="config.multiple"
            :collapse-tags="config.collapseTags"
            :max-collapse-tags="config.maxCollapseTags"
            :emit-path="config.emitPath"
            style="width: 100%; max-width: 400px"
            @change="handleChange"
          />
        </div>

        <div class="result-area">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:terminal-box-line" />
            当前值
            <span class="result-hint">
              {{ config.multiple ? '(多选模式)' : (config.emitPath ? '(完整路径)' : '(仅选中值)') }}
            </span>
          </h4>
          <pre class="result-content">{{ formatValue(regionValue) }}</pre>
        </div>

        <div class="code-area">
          <h4 class="code-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" />
            示例代码
          </h4>
          <pre class="code-content"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import ScRegion from "@repo/components/ScRegion/src/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 数据源选项
const dataSourceOptions = [
  { label: "自定义", value: "custom", icon: "ri:database-2-line" },
  { label: "区划包", value: "element-china-area-data", icon: "ri:map-pin-line" }
];

// 尺寸选项
const sizeOptions = [
  { label: "small", value: "small", icon: "ri:subtract-line" },
  { label: "default", value: "default", icon: "ri:checkbox-blank-line" },
  { label: "large", value: "large", icon: "ri:add-line" }
];

/**
 * ScRegion 组件示例 - 动态属性调试
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

// 配置项
const config = reactive({
  dataSource: "custom" as "custom" | "element-china-area-data",
  placeholder: "请选择地区",
  disabled: false,
  clearable: true,
  filterable: false,
  size: "default" as "small" | "default" | "large",
  showAllLevels: true,
  separator: "/",
  checkStrictly: false,
  showCode: false,
  showCodeOnly: false,
  multiple: false,
  collapseTags: false,
  maxCollapseTags: 1,
  emitPath: true
});

// 选中值
const regionValue = ref<string[] | string[][] | string>([]);

// 数据源切换时重置值
function handleDataSourceChange() {
  regionValue.value = config.multiple ? [] : [];
}

// 多选切换时重置值
function handleMultipleChange(val: boolean) {
  regionValue.value = val ? [] : [];
}

// 格式化显示值
function formatValue(val: any) {
  if (!val || (Array.isArray(val) && val.length === 0)) {
    return "(未选择)";
  }
  return JSON.stringify(val, null, 2);
}

// 处理变化
function handleChange(val: any) {
  console.log("地区选择变化:", val);
}

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];
  
  if (config.dataSource !== "custom") {
    props.push(`data-source="${config.dataSource}"`);
  }
  if (config.placeholder !== "请选择地区") {
    props.push(`placeholder="${config.placeholder}"`);
  }
  if (config.disabled) props.push("disabled");
  if (!config.clearable) props.push(":clearable=\"false\"");
  if (config.filterable) props.push("filterable");
  if (config.size !== "default") props.push(`size="${config.size}"`);
  if (!config.showAllLevels) props.push(":show-all-levels=\"false\"");
  if (config.separator !== "/") props.push(`separator="${config.separator}"`);
  if (config.checkStrictly) props.push("check-strictly");
  if (config.showCode) props.push("show-code");
  if (config.showCodeOnly) props.push("show-code-only");
  if (config.multiple) props.push("multiple");
  if (config.collapseTags) props.push("collapse-tags");
  if (config.maxCollapseTags !== 1) props.push(`:max-collapse-tags="${config.maxCollapseTags}"`);
  if (!config.emitPath) props.push(":emit-path=\"false\"");
  
  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : " ";
  
  return `<ScRegion
  v-model="region"${propsStr}/>

<script setup>
import { ref } from "vue";
const region = ref(${config.multiple ? "[]" : config.emitPath ? "[]" : '""'});
<\/script>`;
});
</script>

<style scoped lang="scss">
.sc-region-example {
  padding: 20px;
}

.example-container {
  display: flex;
  gap: 24px;
  
  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;
  
  @media (max-width: 900px) {
    width: 100%;
  }
}

.preview-panel {
  flex: 1;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  
  .iconify {
    color: var(--el-color-primary);
  }
}

.switch-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);

  span {
    cursor: help;
    border-bottom: 1px dashed var(--el-border-color);
    
    &.is-disabled {
      color: var(--el-text-color-placeholder);
    }
  }
}

.preview-area {
  padding: 24px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
}

.result-area,
.code-area {
  margin-top: 20px;
}

.result-title,
.code-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  
  .iconify {
    color: var(--el-color-primary);
  }

  .result-hint {
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    margin-left: 4px;
  }
}

.result-content {
  margin: 0;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 13px;
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-all;
}

.code-content {
  margin: 0;
  padding: 16px;
  background: #1e1e1e;
  border-radius: 6px;
  overflow-x: auto;
  
  code {
    font-size: 13px;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    color: #d4d4d4;
    line-height: 1.6;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
