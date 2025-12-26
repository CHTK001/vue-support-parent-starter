<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载参数配置...</span>
    </div>

    <el-form
      v-else
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="node-config-form"
    >
      <!-- 基础信息 -->
      <el-card shadow="never" class="config-section">
        <template #header>
          <div class="section-header">
            <el-icon><InfoFilled /></el-icon>
            <span>基础信息</span>
          </div>
        </template>
        <el-form-item label="节点名称" prop="syncNodeName">
          <el-input
            v-model="formData.syncNodeName"
            placeholder="请输入节点名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="节点类型">
              <el-input :value="getNodeTypeText(node?.syncNodeType)" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SPI类型">
              <el-input :value="node?.syncNodeSpiName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="节点描述" prop="syncNodeDescription">
          <el-input
            v-model="formData.syncNodeDescription"
            type="textarea"
            :rows="2"
            placeholder="请输入节点描述（可选）"
            maxlength="500"
          />
        </el-form-item>
      </el-card>

      <!-- 参数配置 -->
      <el-card v-if="parameters.length > 0" shadow="never" class="config-section">
        <template #header>
          <div class="section-header">
            <el-icon><Setting /></el-icon>
            <span>参数配置</span>
            <el-tag size="small" type="info">{{ parameters.length }} 个参数</el-tag>
          </div>
        </template>

        <el-form-item
          v-for="param in parameters"
          :key="param.name"
          :label="param.label || param.name"
          :prop="'config.' + param.name"
          :rules="getParamRules(param)"
        >
          <template #label>
            <div class="param-label">
              <span>{{ param.label || param.name }}</span>
              <el-tag v-if="param.required" size="small" type="danger">必填</el-tag>
            </div>
          </template>

          <!-- 字符串输入 -->
          <el-input
            v-if="param.type === 'string'"
            v-model="formData.config[param.name]"
            :placeholder="param.placeholder || param.description"
            clearable
          />

          <!-- 密码输入 -->
          <el-input
            v-else-if="param.type === 'password'"
            v-model="formData.config[param.name]"
            type="password"
            show-password
            :placeholder="param.placeholder || param.description"
            clearable
          />

          <!-- 文本域 -->
          <el-input
            v-else-if="param.type === 'textarea'"
            v-model="formData.config[param.name]"
            type="textarea"
            :rows="3"
            :placeholder="param.placeholder || param.description"
          />

          <!-- JSON编辑器 -->
          <div v-else-if="param.type === 'json'" class="json-editor">
            <el-input
              v-model="formData.config[param.name]"
              type="textarea"
              :rows="5"
              :placeholder="param.placeholder || '请输入JSON格式数据'"
            />
            <el-button
              size="small"
              class="format-btn"
              @click="formatJson(param.name)"
            >
              格式化JSON
            </el-button>
          </div>

          <!-- 数字输入 -->
          <el-input-number
            v-else-if="param.type === 'number'"
            v-model="formData.config[param.name]"
            :min="param.min"
            :max="param.max"
            :step="param.step || 1"
            :precision="param.precision"
            controls-position="right"
            style="width: 100%"
          />

          <!-- 开关 -->
          <el-switch
            v-else-if="param.type === 'boolean'"
            v-model="formData.config[param.name]"
            :active-text="param.activeText || '是'"
            :inactive-text="param.inactiveText || '否'"
          />

          <!-- 下拉选择 -->
          <el-select
            v-else-if="param.type === 'select'"
            v-model="formData.config[param.name]"
            :placeholder="param.placeholder || '请选择'"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="opt in param.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- 多选 -->
          <el-select
            v-else-if="param.type === 'multiselect'"
            v-model="formData.config[param.name]"
            :placeholder="param.placeholder || '请选择'"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%"
          >
            <el-option
              v-for="opt in param.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="param.type === 'date'"
            v-model="formData.config[param.name]"
            type="date"
            :placeholder="param.placeholder || '请选择日期'"
            style="width: 100%"
          />

          <!-- 日期时间选择 -->
          <el-date-picker
            v-else-if="param.type === 'datetime'"
            v-model="formData.config[param.name]"
            type="datetime"
            :placeholder="param.placeholder || '请选择日期时间'"
            style="width: 100%"
          />

          <!-- 颜色选择 -->
          <el-color-picker
            v-else-if="param.type === 'color'"
            v-model="formData.config[param.name]"
          />

          <!-- 滑块 -->
          <el-slider
            v-else-if="param.type === 'slider'"
            v-model="formData.config[param.name]"
            :min="param.min || 0"
            :max="param.max || 100"
            :step="param.step || 1"
            :show-input="param.showInput !== false"
          />

          <!-- 键值对编辑器 -->
          <div v-else-if="param.type === 'keyvalue'" class="keyvalue-editor">
            <div
              v-for="(item, index) in getKeyValueItems(param.name)"
              :key="index"
              class="keyvalue-item"
            >
              <el-input
                v-model="item.key"
                placeholder="键"
                @change="updateKeyValueConfig(param.name)"
              />
              <el-input
                v-model="item.value"
                placeholder="值"
                @change="updateKeyValueConfig(param.name)"
              />
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click="removeKeyValueItem(param.name, index)"
              />
            </div>
            <el-button type="primary" :icon="Plus" @click="addKeyValueItem(param.name)">
              添加
            </el-button>
          </div>

          <!-- 文件路径选择 -->
          <el-input
            v-else-if="param.type === 'filepath'"
            v-model="formData.config[param.name]"
            :placeholder="param.placeholder || '请输入文件路径'"
          >
            <template #append>
              <el-button :icon="FolderOpened" />
            </template>
          </el-input>

          <!-- 默认为字符串输入 -->
          <el-input
            v-else
            v-model="formData.config[param.name]"
            :placeholder="param.placeholder || param.description"
          />

          <!-- 参数描述 -->
          <div v-if="param.description" class="param-description">
            <el-icon><InfoFilled /></el-icon>
            {{ param.description }}
          </div>
        </el-form-item>
      </el-card>

      <!-- 无参数提示 -->
      <el-empty v-else description="该节点类型无需配置参数" :image-size="100" />

      <!-- 输出节点自动建表配置（仅数据库类型） -->
      <el-card v-if="showColumnEditor" shadow="never" class="config-section">
        <template #header>
          <div class="section-header">
            <el-icon><Grid /></el-icon>
            <span>目标表列定义</span>
            <el-tag size="small" type="info">自动建表</el-tag>
          </div>
        </template>
        <ColumnDefinitionEditor
          v-model="formData.config.columns"
          v-model:autoCreate="formData.config.autoCreateTable"
          :nodeConfig="JSON.stringify(formData.config)"
          :tableName="formData.config.table || formData.config.tableName"
          :showAutoCreateSwitch="true"
          @import="handleImportColumns"
        />
      </el-card>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          v-if="canTest"
          type="info"
          :loading="testing"
          @click="handleTestConnection"
        >
          <el-icon><Connection /></el-icon>
          测试连接
        </el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  InfoFilled,
  Setting,
  Delete,
  Plus,
  FolderOpened,
  Connection,
  Check,
  Loading,
  Grid,
} from "@element-plus/icons-vue";
import {
  getSpiParameters,
  testSpiConnection,
  getOutputTableStructure,
  type SyncNode,
  type SpiParameter,
  type ColumnDefinition,
} from "@/api/sync";
import ColumnDefinitionEditor from "./ColumnDefinitionEditor.vue";

interface Props {
  modelValue: boolean;
  node: SyncNode | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "save", node: SyncNode, config: Record<string, any>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const dialogTitle = computed(() => {
  if (!props.node) return "节点配置";
  const typeText = getNodeTypeText(props.node.syncNodeType);
  return `${typeText}节点配置 - ${props.node.syncNodeName || props.node.syncNodeSpiName}`;
});

const canTest = computed(() => {
  return props.node?.syncNodeType === "INPUT" || props.node?.syncNodeType === "OUTPUT";
});

// 是否显示列定义编辑器（仅数据库类型输出节点）
const showColumnEditor = computed(() => {
  if (props.node?.syncNodeType !== "OUTPUT") return false;
  const spiName = props.node?.syncNodeSpiName?.toLowerCase() || "";
  // 数据库类型SPI
  return ["jdbc", "mysql", "postgresql", "oracle", "sqlserver", "sqlite", "database"].some(
    (db) => spiName.includes(db)
  );
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const parameters = ref<SpiParameter[]>([]);

interface FormData {
  syncNodeName: string;
  syncNodeDescription: string;
  config: Record<string, any>;
}

const formData = reactive<FormData>({
  syncNodeName: "",
  syncNodeDescription: "",
  config: {},
});

// 键值对临时存储
const keyValueStore = reactive<Record<string, Array<{ key: string; value: string }>>>({});

const formRules: FormRules = {
  syncNodeName: [{ required: true, message: "请输入节点名称", trigger: "blur" }],
};

// 获取节点类型文本
const getNodeTypeText = (type?: string) => {
  const map: Record<string, string> = {
    INPUT: "输入",
    OUTPUT: "输出",
    DATA_CENTER: "数据中心",
    FILTER: "过滤器",
  };
  return map[type || ""] || type || "";
};

// 获取参数校验规则
const getParamRules = (param: SpiParameter) => {
  const rules: any[] = [];
  if (param.required) {
    rules.push({ required: true, message: `请输入${param.label || param.name}`, trigger: "blur" });
  }
  if (param.pattern) {
    rules.push({
      pattern: new RegExp(param.pattern),
      message: param.patternMessage || `格式不正确`,
      trigger: "blur",
    });
  }
  if (param.type === "number" && (param.min !== undefined || param.max !== undefined)) {
    rules.push({
      type: "number",
      min: param.min,
      max: param.max,
      message: `数值范围: ${param.min ?? "-∞"} ~ ${param.max ?? "+∞"}`,
      trigger: "blur",
    });
  }
  return rules;
};

// 加载参数配置
const loadParameters = async () => {
  if (!props.node?.syncNodeType || !props.node?.syncNodeSpiName) return;

  loading.value = true;
  try {
    const res = await getSpiParameters(props.node.syncNodeType, props.node.syncNodeSpiName);
    if (res.data?.success) {
      parameters.value = res.data.data || [];
    }
  } catch (e) {
    console.error(e);
    parameters.value = [];
  } finally {
    loading.value = false;
  }
};

// 初始化表单数据
const initFormData = () => {
  if (!props.node) return;

  formData.syncNodeName = props.node.syncNodeName || "";
  formData.syncNodeDescription = (props.node as any).syncNodeDescription || "";

  // 解析现有配置
  formData.config = {};
  if (props.node.syncNodeConfig) {
    try {
      Object.assign(formData.config, JSON.parse(props.node.syncNodeConfig));
    } catch (e) {}
  }

  // 设置默认值
  parameters.value.forEach((param) => {
    if (formData.config[param.name] === undefined && param.defaultValue !== undefined) {
      formData.config[param.name] = param.defaultValue;
    }
    // 初始化键值对存储
    if (param.type === "keyvalue") {
      initKeyValueStore(param.name);
    }
  });
};

// 初始化键值对存储
const initKeyValueStore = (paramName: string) => {
  const value = formData.config[paramName];
  if (typeof value === "object" && value !== null) {
    keyValueStore[paramName] = Object.entries(value).map(([key, val]) => ({
      key,
      value: String(val),
    }));
  } else {
    keyValueStore[paramName] = [];
  }
};

// 获取键值对项
const getKeyValueItems = (paramName: string) => {
  if (!keyValueStore[paramName]) {
    keyValueStore[paramName] = [];
  }
  return keyValueStore[paramName];
};

// 添加键值对项
const addKeyValueItem = (paramName: string) => {
  if (!keyValueStore[paramName]) {
    keyValueStore[paramName] = [];
  }
  keyValueStore[paramName].push({ key: "", value: "" });
};

// 删除键值对项
const removeKeyValueItem = (paramName: string, index: number) => {
  keyValueStore[paramName].splice(index, 1);
  updateKeyValueConfig(paramName);
};

// 更新键值对配置
const updateKeyValueConfig = (paramName: string) => {
  const items = keyValueStore[paramName] || [];
  const obj: Record<string, string> = {};
  items.forEach((item) => {
    if (item.key) {
      obj[item.key] = item.value;
    }
  });
  formData.config[paramName] = obj;
};

// 格式化JSON
const formatJson = (paramName: string) => {
  try {
    const value = formData.config[paramName];
    if (typeof value === "string" && value.trim()) {
      const parsed = JSON.parse(value);
      formData.config[paramName] = JSON.stringify(parsed, null, 2);
      ElMessage.success("JSON格式化成功");
    }
  } catch (e) {
    ElMessage.error("JSON格式不正确");
  }
};

// 保存配置
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch (e) {
    ElMessage.warning("请检查表单填写是否正确");
    return;
  }

  saving.value = true;
  try {
    const updatedNode: SyncNode = {
      ...props.node!,
      syncNodeName: formData.syncNodeName,
      syncNodeConfig: JSON.stringify(formData.config),
    };
    (updatedNode as any).syncNodeDescription = formData.syncNodeDescription;

    emit("save", updatedNode, formData.config);
    visible.value = false;
    ElMessage.success("配置已保存");
  } finally {
    saving.value = false;
  }
};

// 测试连接
const handleTestConnection = async () => {
  if (!props.node) return;

  testing.value = true;
  try {
    const res = await testSpiConnection(
      props.node.syncNodeType!,
      props.node.syncNodeSpiName!,
      formData.config
    );
    if (res.data?.success) {
      ElMessage.success(res.data.data || "连接成功");
    } else {
      ElMessage.error(res.data?.msg || "连接失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("测试连接失败");
  } finally {
    testing.value = false;
  }
};

// 从源表导入列定义
const handleImportColumns = async () => {
  const tableName = formData.config.table || formData.config.tableName;
  if (!tableName) {
    ElMessage.warning("请先配置表名");
    return;
  }

  try {
    const nodeConfig = JSON.stringify(formData.config);
    const res = await getOutputTableStructure(nodeConfig, tableName);
    if (res.data?.success && res.data.data) {
      formData.config.columns = res.data.data;
      ElMessage.success("已从目标表导入列定义");
    } else {
      ElMessage.warning(res.data?.msg || "获取表结构失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("导入失败");
  }
};

// 关闭对话框时重置
const handleClosed = () => {
  formData.syncNodeName = "";
  formData.syncNodeDescription = "";
  formData.config = {};
  parameters.value = [];
  Object.keys(keyValueStore).forEach((key) => delete keyValueStore[key]);
};

// 监听节点变化
watch(
  () => props.node,
  (newNode) => {
    if (newNode && props.modelValue) {
      loadParameters().then(() => {
        initFormData();
      });
    }
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (show) => {
    if (show && props.node) {
      loadParameters().then(() => {
        initFormData();
      });
    }
  }
);
</script>

<style scoped lang="scss">
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;

  .loading-icon {
    font-size: 32px;
    color: #409eff;
    animation: rotate 1s linear infinite;
  }

  span {
    margin-top: 12px;
    color: #909399;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.node-config-form {
  .config-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    :deep(.el-card__header) {
      padding: 12px 16px;
      background: #f5f7fa;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;

      .el-tag {
        margin-left: auto;
      }
    }
  }

  .param-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .param-description {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;

    .el-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
  }

  .json-editor {
    position: relative;

    .format-btn {
      position: absolute;
      right: 8px;
      bottom: 8px;
    }
  }

  .keyvalue-editor {
    .keyvalue-item {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;

      .el-input {
        flex: 1;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
