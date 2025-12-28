<template>
  <div class="mock-generator">
    <!-- 头部 -->
    <div class="mock-header">
      <div class="header-title">
        <i class="ri-database-2-line"></i>
        <span>Mock 数据</span>
      </div>
      <div class="header-actions">
        <el-switch
          v-model="mockEnabled"
          active-text="启用"
          inactive-text="禁用"
          @change="handleMockToggle"
        />
      </div>
    </div>

    <!-- 当前 API Mock 配置 -->
    <div class="mock-content" v-if="api">
      <div class="api-info">
        <el-tag :type="getMethodTagType(api.method)" size="small">
          {{ api.method.toUpperCase() }}
        </el-tag>
        <span class="api-path">{{ api.path }}</span>
      </div>

      <!-- Mock 配置表单 -->
      <el-form label-position="top" size="small">
        <el-form-item label="响应状态码">
          <el-select v-model="mockConfig.statusCode" style="width: 100%">
            <el-option :value="200" label="200 OK" />
            <el-option :value="201" label="201 Created" />
            <el-option :value="400" label="400 Bad Request" />
            <el-option :value="401" label="401 Unauthorized" />
            <el-option :value="403" label="403 Forbidden" />
            <el-option :value="404" label="404 Not Found" />
            <el-option :value="500" label="500 Internal Server Error" />
          </el-select>
        </el-form-item>

        <el-form-item label="响应延迟(ms)">
          <el-slider
            v-model="mockConfig.delay"
            :min="0"
            :max="5000"
            :step="100"
            show-input
          />
        </el-form-item>

        <el-form-item label="Mock 响应数据">
          <div class="editor-toolbar">
            <el-button size="small" @click="generateMockData">
              <i class="ri-magic-line"></i>
              自动生成
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="generateWithAI"
              :loading="aiGenerating"
              :disabled="!aiEnabled"
            >
              <i class="ri-robot-line"></i>
              AI 生成
            </el-button>
            <el-button size="small" @click="formatJson">
              <i class="ri-code-line"></i>
              格式化
            </el-button>
            <el-button size="small" @click="clearMockData">
              <i class="ri-delete-bin-line"></i>
              清空
            </el-button>
            <el-button size="small" @click="showAIConfigDialog = true">
              <i class="ri-settings-4-line"></i>
              AI 配置
            </el-button>
          </div>
          <el-input
            v-model="mockConfig.responseData"
            type="textarea"
            :rows="12"
            placeholder="输入 JSON 格式的 Mock 数据..."
            class="mock-editor"
          />
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="mock-actions">
        <el-button type="primary" @click="saveMockRule" :loading="saving">
          <i class="ri-save-line"></i>
          保存配置
        </el-button>
        <el-button @click="testMock">
          <i class="ri-play-line"></i>
          测试 Mock
        </el-button>
        <el-button type="danger" @click="deleteMockRule" v-if="currentRule">
          <i class="ri-delete-bin-line"></i>
          删除规则
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <i class="ri-file-list-3-line"></i>
      <span>请先选择一个 API</span>
    </div>

    <!-- Mock 规则列表 -->
    <div class="mock-rules-section" v-if="mockRules.length > 0">
      <el-divider content-position="left">
        <span class="rules-title">已配置的 Mock 规则</span>
      </el-divider>
      <el-scrollbar max-height="200px">
        <div
          v-for="rule in mockRules"
          :key="rule.id"
          class="rule-item"
          :class="{ active: rule.path === api?.path && rule.method === api?.method }"
        >
          <div class="rule-info">
            <el-tag :type="getMethodTagType(rule.method)" size="small">
              {{ rule.method.toUpperCase() }}
            </el-tag>
            <span class="rule-path">{{ rule.path }}</span>
          </div>
          <div class="rule-actions">
            <el-switch
              v-model="rule.enabled"
              size="small"
              @change="handleRuleToggle(rule)"
            />
            <el-button
              size="small"
              text
              type="danger"
              @click="handleDeleteRule(rule)"
            >
              <i class="ri-delete-bin-line"></i>
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- AI 配置对话框 -->
    <sc-dialog v-model="showAIConfigDialog" title="AI 服务配置" width="550px">
      <el-form label-width="100px" size="small">
        <el-form-item label="启用 AI">
          <el-switch v-model="aiConfig.enabled" />
        </el-form-item>
        <el-form-item label="服务提供商">
          <el-select v-model="aiConfig.provider" @change="handleProviderChange" style="width: 100%">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic (Claude)" value="anthropic" />
            <el-option label="Google Gemini" value="gemini" />
            <el-option label="HuggingFace" value="huggingface" />
            <el-option label="Cloudflare Workers AI" value="cloudflare" />
            <el-option label="Ollama (本地)" value="ollama" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input v-model="aiConfig.apiUrl" placeholder="API 端点地址" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="aiConfig.apiKey" type="password" placeholder="输入 API Key" show-password />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="aiConfig.model" placeholder="模型名称" />
        </el-form-item>
      </el-form>
      <div class="ai-tips">
        <el-alert type="info" :closable="false">
          <template #title>
            <div class="tips-content">
              <p>提示：</p>
              <ul>
                <li><strong>OpenAI</strong>: 需要 API Key，推荐 gpt-3.5-turbo</li>
                <li><strong>Gemini</strong>: 免费额度，需要 Google AI API Key</li>
                <li><strong>HuggingFace</strong>: 免费额度，需要 Access Token</li>
                <li><strong>Ollama</strong>: 本地运行，无需 API Key</li>
              </ul>
            </div>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="showAIConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAIConfig">保存配置</el-button>
      </template>
    </sc-dialog>

    <!-- 测试结果对话框 -->
    <sc-dialog v-model="testDialogVisible" title="Mock 测试结果" width="600px">
      <div class="test-result">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="状态码">
            <el-tag :type="testResult?.statusCode === 200 ? 'success' : 'danger'" size="small">
              {{ testResult?.statusCode }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="延迟">
            {{ testResult?.delay }}ms
          </el-descriptions-item>
        </el-descriptions>
        <div class="test-response">
          <div class="response-label">响应数据:</div>
          <pre>{{ formatTestResult(testResult?.responseData) }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ApiInfo } from "../types";
import { DocStorage, type MockRule } from "../storage";
import { aiService, type AIServiceConfig, type AIProvider } from "../ai-service";

const props = defineProps<{
  /** 当前选中的 API */
  api?: ApiInfo | null;
}>();

const emit = defineEmits<{
  (e: "mock-enabled", enabled: boolean): void;
  (e: "mock-response", response: any): void;
}>();

// 状态
const mockEnabled = ref(false);
const saving = ref(false);
const testDialogVisible = ref(false);
const mockRules = ref<MockRule[]>([]);
const currentRule = ref<MockRule | null>(null);

// AI 相关状态
const showAIConfigDialog = ref(false);
const aiGenerating = ref(false);
const aiConfig = reactive<AIServiceConfig>({
  provider: "openai",
  apiUrl: "",
  apiKey: "",
  model: "",
  enabled: false,
});

// AI 是否启用
const aiEnabled = computed(() => aiConfig.enabled && !!aiConfig.apiKey);

// Mock 配置
const mockConfig = reactive({
  statusCode: 200,
  delay: 200,
  responseData: "",
});

// 测试结果
const testResult = ref<{ statusCode: number; delay: number; responseData: any } | null>(null);

// 方法类型颜色
const getMethodTagType = (method: string): string => {
  const types: Record<string, string> = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info",
  };
  return types[method.toUpperCase()] || "info";
};

// 加载 Mock 规则列表
const loadMockRules = async () => {
  try {
    mockRules.value = await DocStorage.getMockRules();
  } catch (error) {
    console.error("Failed to load mock rules:", error);
  }
};

// 加载 AI 配置
const loadAIConfig = async () => {
  await aiService.init();
  const config = aiService.getConfig();
  if (config) {
    Object.assign(aiConfig, config);
  }
};

// AI 提供商切换
const handleProviderChange = (provider: AIProvider) => {
  const defaultConfig = aiService.getDefaultConfig(provider);
  aiConfig.apiUrl = defaultConfig.apiUrl || "";
  aiConfig.model = defaultConfig.model || "";
};

// 保存 AI 配置
const saveAIConfig = async () => {
  try {
    await aiService.saveConfig({ ...aiConfig });
    ElMessage.success("AI 配置已保存");
    showAIConfigDialog.value = false;
  } catch (error) {
    console.error("Failed to save AI config:", error);
    ElMessage.error("保存 AI 配置失败");
  }
};

// AI 生成 Mock 数据
const generateWithAI = async () => {
  if (!props.api) return;

  if (!aiConfig.enabled || !aiConfig.apiKey) {
    ElMessage.warning("请先配置并启用 AI 服务");
    showAIConfigDialog.value = true;
    return;
  }

  aiGenerating.value = true;
  try {
    const result = await aiService.generateMockData({
      path: props.api.path,
      method: props.api.method,
      description: props.api.summary || props.api.description,
      parameters: props.api.parameters,
      requestBody: props.api.requestBody,
      responses: props.api.responses,
    });

    if (result.success && result.data) {
      mockConfig.responseData = JSON.stringify(result.data, null, 2);
      ElMessage.success("AI 生成成功");
    } else {
      ElMessage.error(result.error || "AI 生成失败");
    }
  } catch (error: any) {
    console.error("AI generation error:", error);
    ElMessage.error(error.message || "AI 生成失败");
  } finally {
    aiGenerating.value = false;
  }
};

// 加载当前 API 的 Mock 规则
const loadCurrentRule = async () => {
  if (!props.api) {
    currentRule.value = null;
    return;
  }

  try {
    const rule = await DocStorage.getMockRule(props.api.path, props.api.method);
    currentRule.value = rule;

    if (rule) {
      mockConfig.statusCode = rule.statusCode;
      mockConfig.delay = rule.delay;
      mockConfig.responseData =
        typeof rule.responseData === "string"
          ? rule.responseData
          : JSON.stringify(rule.responseData, null, 2);
      mockEnabled.value = rule.enabled;
    } else {
      // 重置为默认值
      mockConfig.statusCode = 200;
      mockConfig.delay = 200;
      mockConfig.responseData = "";
      mockEnabled.value = false;
    }
  } catch (error) {
    console.error("Failed to load current rule:", error);
  }
};

// 生成 Mock 数据
const generateMockData = () => {
  if (!props.api) return;

  const mockData: Record<string, any> = {
    success: true,
    code: 200,
    message: "操作成功",
    data: {},
  };

  // 根据响应定义生成
  if (props.api.responses?.["200"]?.content) {
    const content = props.api.responses["200"].content;
    const schema = content["application/json"]?.schema;
    if (schema) {
      mockData.data = generateFromSchema(schema);
    }
  }

  // 根据请求体属性推断响应
  if (props.api.requestBody?.properties) {
    const properties = props.api.requestBody.properties;
    Object.entries(properties).forEach(([key, prop]) => {
      mockData.data[key] = generateValueByType(prop.type, key);
    });
  }

  // 如果是列表接口
  if (props.api.path.includes("list") || props.api.path.includes("page")) {
    mockData.data = {
      records: [mockData.data, { ...mockData.data, id: 2 }, { ...mockData.data, id: 3 }],
      total: 100,
      current: 1,
      size: 10,
    };
  }

  mockConfig.responseData = JSON.stringify(mockData, null, 2);
};

// 根据 Schema 生成数据
const generateFromSchema = (schema: any): any => {
  if (!schema) return null;

  if (schema.type === "array") {
    return [generateFromSchema(schema.items)];
  }

  if (schema.type === "object" && schema.properties) {
    const result: Record<string, any> = {};
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      result[key] = generateValueByType(prop.type, key);
    });
    return result;
  }

  return generateValueByType(schema.type, "value");
};

// 根据类型生成值
const generateValueByType = (type: string, fieldName: string): any => {
  const name = fieldName.toLowerCase();

  // 根据字段名推断
  if (name.includes("id")) return Math.floor(Math.random() * 1000) + 1;
  if (name.includes("name")) return "示例名称";
  if (name.includes("title")) return "示例标题";
  if (name.includes("email")) return "example@email.com";
  if (name.includes("phone") || name.includes("mobile")) return "13800138000";
  if (name.includes("url") || name.includes("link")) return "https://example.com";
  if (name.includes("time") || name.includes("date")) return new Date().toISOString();
  if (name.includes("status")) return 1;
  if (name.includes("type")) return "default";
  if (name.includes("description") || name.includes("desc")) return "这是描述信息";
  if (name.includes("content")) return "这是内容信息";
  if (name.includes("image") || name.includes("avatar")) return "https://via.placeholder.com/150";

  // 根据类型生成
  switch (type) {
    case "integer":
    case "number":
      return Math.floor(Math.random() * 100);
    case "boolean":
      return true;
    case "array":
      return [];
    case "object":
      return {};
    default:
      return "示例文本";
  }
};

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(mockConfig.responseData);
    mockConfig.responseData = JSON.stringify(parsed, null, 2);
    ElMessage.success("格式化成功");
  } catch {
    ElMessage.error("JSON 格式错误");
  }
};

// 清空 Mock 数据
const clearMockData = () => {
  mockConfig.responseData = "";
};

// 保存 Mock 规则
const saveMockRule = async () => {
  if (!props.api) return;

  // 验证 JSON
  let responseData: any;
  try {
    responseData = mockConfig.responseData ? JSON.parse(mockConfig.responseData) : null;
  } catch {
    ElMessage.error("Mock 数据必须是有效的 JSON 格式");
    return;
  }

  saving.value = true;
  try {
    await DocStorage.saveMockRule({
      path: props.api.path,
      method: props.api.method,
      enabled: mockEnabled.value,
      statusCode: mockConfig.statusCode,
      delay: mockConfig.delay,
      responseData,
    });
    ElMessage.success("Mock 规则保存成功");
    await loadMockRules();
    await loadCurrentRule();
  } catch (error) {
    console.error("Failed to save mock rule:", error);
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// 删除 Mock 规则
const deleteMockRule = async () => {
  if (!currentRule.value) return;

  try {
    await ElMessageBox.confirm("确定要删除此 Mock 规则吗？", "删除确认", {
      type: "warning",
    });
    await DocStorage.deleteMockRule(currentRule.value.id!);
    ElMessage.success("删除成功");
    currentRule.value = null;
    mockConfig.responseData = "";
    mockEnabled.value = false;
    await loadMockRules();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to delete mock rule:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 测试 Mock
const testMock = () => {
  let responseData: any;
  try {
    responseData = mockConfig.responseData ? JSON.parse(mockConfig.responseData) : null;
  } catch {
    ElMessage.error("Mock 数据必须是有效的 JSON 格式");
    return;
  }

  testResult.value = {
    statusCode: mockConfig.statusCode,
    delay: mockConfig.delay,
    responseData,
  };
  testDialogVisible.value = true;
};

// 格式化测试结果
const formatTestResult = (data: any): string => {
  if (!data) return "-";
  return JSON.stringify(data, null, 2);
};

// Mock 开关切换
const handleMockToggle = (enabled: boolean) => {
  emit("mock-enabled", enabled);
};

// 规则开关切换
const handleRuleToggle = async (rule: MockRule) => {
  try {
    await DocStorage.toggleMockRule(rule.id!, rule.enabled);
  } catch (error) {
    console.error("Failed to toggle rule:", error);
    rule.enabled = !rule.enabled; // 恢复状态
  }
};

// 删除规则
const handleDeleteRule = async (rule: MockRule) => {
  try {
    await ElMessageBox.confirm("确定要删除此 Mock 规则吗？", "删除确认", {
      type: "warning",
    });
    await DocStorage.deleteMockRule(rule.id!);
    await loadMockRules();
    if (rule.path === props.api?.path && rule.method === props.api?.method) {
      await loadCurrentRule();
    }
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to delete rule:", error);
    }
  }
};

// 监听 API 变化
watch(
  () => props.api,
  () => {
    loadCurrentRule();
  },
  { immediate: true }
);

// 生命周期
onMounted(() => {
  loadMockRules();
  loadAIConfig();
});

// 暴露方法
defineExpose({
  loadMockRules,
  generateMockData,
  generateWithAI,
});
</script>

<style lang="scss" scoped>
.mock-generator {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 8px;

  .mock-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      i {
        font-size: 18px;
        color: var(--el-color-warning);
      }
    }
  }

  .mock-content {
    flex: 1;
    overflow: auto;
    padding: 16px;

    .api-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;

      .api-path {
        font-family: "Fira Code", monospace;
        font-size: 13px;
        color: var(--el-text-color-regular);
      }
    }

    .editor-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }

    .mock-editor {
      :deep(textarea) {
        font-family: "Fira Code", monospace;
        font-size: 12px;
      }
    }

    .mock-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--el-text-color-placeholder);

    i {
      font-size: 48px;
      margin-bottom: 12px;
    }
  }

  .mock-rules-section {
    padding: 0 16px 16px;

    .rules-title {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .rule-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 6px;
      border-radius: 8px;
      background: var(--el-fill-color-lighter);
      transition: all 0.2s;

      &:hover {
        background: var(--el-fill-color);
      }

      &.active {
        background: var(--el-color-warning-light-9);
        border: 1px solid var(--el-color-warning-light-5);
      }

      .rule-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .rule-path {
          font-family: "Fira Code", monospace;
          font-size: 12px;
          color: var(--el-text-color-regular);
        }
      }

      .rule-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }
}

.test-result {
  .test-response {
    margin-top: 16px;

    .response-label {
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--el-text-color-primary);
    }

    pre {
      background: var(--el-fill-color-lighter);
      border-radius: 8px;
      padding: 12px;
      max-height: 300px;
      overflow: auto;
      font-family: "Fira Code", monospace;
      font-size: 12px;
      margin: 0;
    }
  }
}
</style>
