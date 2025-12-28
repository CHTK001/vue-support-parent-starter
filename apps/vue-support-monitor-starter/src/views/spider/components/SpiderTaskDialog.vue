<template>
  <sc-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑爬虫任务' : '创建爬虫任务'"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
  >
    <el-steps :active="currentStep" finish-status="success" simple style="margin-bottom: 20px">
      <el-step title="基本配置" />
      <el-step title="网页预览" />
      <el-step title="数据提取" />
      <el-step title="调度配置" />
    </el-steps>

    <!-- 步骤1: 基本配置 -->
    <div v-show="currentStep === 0" class="step-content">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务名称" prop="spiderTaskName">
              <el-input v-model="form.spiderTaskName" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标URL" prop="spiderTaskUrl">
              <el-input v-model="form.spiderTaskUrl" placeholder="请输入目标URL">
                <template #append>
                  <el-button @click="handlePreviewUrl" :loading="previewLoading">预览</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="任务描述">
              <el-input v-model="form.spiderTaskDesc" type="textarea" :rows="2" placeholder="请输入任务描述" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="线程数">
              <el-input-number v-model="form.spiderTaskThreadNum" :min="1" :max="10" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="爬取间隔(ms)">
              <el-input-number v-model="form.spiderTaskSleepTime" :min="0" :step="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="超时时间(s)">
              <el-input-number v-model="form.spiderTaskTimeout" :min="1" :max="300" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 步骤2: 网页预览 -->
    <div v-show="currentStep === 1" class="step-content preview-step">
      <div class="preview-container">
        <div class="preview-left">
          <div class="preview-header">
            <span class="preview-title">网页预览</span>
            <el-button size="small" @click="handleRefreshPreview" :loading="previewLoading">
              <IconifyIconOnline icon="ep:refresh" />
            </el-button>
          </div>
          <div class="preview-content">
            <iframe
              v-if="previewHtml"
              ref="previewIframe"
              :srcdoc="previewHtml"
              sandbox="allow-same-origin"
              @load="handleIframeLoad"
            />
            <el-empty v-else description="请先输入URL并预览" />
          </div>
        </div>
        <div class="preview-right">
          <div class="preview-header">
            <span class="preview-title">HTML结构 (Elements)</span>
          </div>
          <div class="html-tree-container">
            <el-tree
              ref="htmlTreeRef"
              :data="htmlTree"
              :props="{ label: 'label', children: 'children' }"
              node-key="xpath"
              highlight-current
              @node-click="handleNodeClick"
              @node-contextmenu="handleNodeContextMenu"
            >
              <template #default="{ node, data }">
                <span class="tree-node">
                  <span class="tag-name">&lt;{{ data.tag }}</span>
                  <span v-if="data.id" class="attr-id"> id="{{ data.id }}"</span>
                  <span v-if="data.class" class="attr-class"> class="{{ data.class }}"</span>
                  <span class="tag-name">&gt;</span>
                  <span v-if="data.text" class="node-text">{{ truncateText(data.text, 30) }}</span>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤3: 数据提取 -->
    <div v-show="currentStep === 2" class="step-content">
      <div class="extract-rules">
        <div class="rules-header">
          <span class="rules-title">数据提取规则</span>
          <el-button type="primary" size="small" @click="handleAddRule">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加规则
          </el-button>
        </div>
        <el-table :data="extractRules" border>
          <el-table-column label="字段名称" width="150">
            <template #default="{ row, $index }">
              <el-input v-model="row.name" placeholder="字段名称" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="选择器类型" width="130">
            <template #default="{ row }">
              <el-select v-model="row.type" size="small" style="width: 100%">
                <el-option v-for="t in SELECTOR_TYPES" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="选择器表达式" min-width="250">
            <template #default="{ row }">
              <el-input v-model="row.selector" placeholder="XPath/CSS选择器" size="small">
                <template #append>
                  <el-button @click="handleTestRule(row)" size="small">测试</el-button>
                </template>
              </el-input>
            </template>
          </el-table-column>
          <el-table-column label="多值" width="70" align="center">
            <template #default="{ row }">
              <el-checkbox v-model="row.multi" />
            </template>
          </el-table-column>
          <el-table-column label="必须" width="70" align="center">
            <template #default="{ row }">
              <el-checkbox v-model="row.required" />
            </template>
          </el-table-column>
          <el-table-column label="测试结果" min-width="200">
            <template #default="{ row }">
              <div v-if="row.testResult" class="test-result">
                <el-tag v-for="(r, i) in row.testResult.slice(0, 3)" :key="i" size="small" class="result-tag">
                  {{ truncateText(r, 50) }}
                </el-tag>
                <span v-if="row.testResult.length > 3" class="more-count">+{{ row.testResult.length - 3 }}</span>
              </div>
              <span v-else class="text-muted">未测试</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="handleRemoveRule($index)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 步骤4: 调度配置和高级选项 -->
    <div v-show="currentStep === 3" class="step-content">
      <el-form :model="form" label-width="140px">
        <!-- 基本调度配置 -->
        <el-divider content-position="left">调度配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="调度类型">
              <el-radio-group v-model="form.spiderTaskScheduleType">
                <el-radio label="NONE">一次性执行</el-radio>
                <el-radio label="CRON">定时任务</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.spiderTaskScheduleType === 'CRON'">
            <el-form-item label="CRON表达式">
              <el-input v-model="form.spiderTaskCron" placeholder="0 0 * * * ?" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="存储类型">
              <el-select v-model="form.spiderTaskPipelineType" style="width: 100%">
                <el-option v-for="p in PIPELINE_TYPES" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务状态">
              <el-switch
                v-model="form.spiderTaskStatus"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="停用"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- URL发现配置 -->
        <el-divider content-position="left">URL发现配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="启用URL发现">
              <el-switch
                v-model="form.spiderTaskEnableUrlDiscover"
                active-text="是"
                inactive-text="否"
              />
              <el-tooltip content="启用后会自动发现并爬取页面中符合模式的链接" placement="top">
                <IconifyIconOnline icon="ep:question-filled" class="ml-2" style="color: #909399" />
              </el-tooltip>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大深度">
              <el-input-number 
                v-model="form.spiderTaskMaxDepth" 
                :min="0" 
                :max="10" 
                :disabled="!form.spiderTaskEnableUrlDiscover"
              />
              <span class="form-tip">0表示不限制</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="form.spiderTaskEnableUrlDiscover">
          <el-col :span="24">
            <el-form-item label="URL匹配模式">
              <el-input 
                v-model="form.spiderTaskUrlPattern" 
                placeholder="正则表达式，如: https://example\.com/article/\d+"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 分页爬取配置 -->
        <el-divider content-position="left">分页爬取配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分页URL模式">
              <el-input 
                v-model="form.spiderTaskPagePattern" 
                placeholder="如: https://example.com/list?page={page}"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大分页数">
              <el-input-number 
                v-model="form.spiderTaskMaxPages" 
                :min="0" 
                :max="1000"
                :disabled="!form.spiderTaskPagePattern"
              />
              <span class="form-tip">0表示不限制</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 高级配置 -->
        <el-divider content-position="left">高级配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="增量模式">
              <el-select v-model="form.spiderTaskIncrementalMode" style="width: 100%">
                <el-option v-for="m in INCREMENTAL_MODES" :key="m.value" :label="m.label" :value="m.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="速率限制">
              <el-input-number 
                v-model="form.spiderTaskRateLimit" 
                :min="0" 
                :max="1000"
              />
              <span class="form-tip">请求/分钟，0不限制</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="currentStep > 0" @click="currentStep--">上一步</el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="handleNextStep">下一步</el-button>
        <el-button v-if="currentStep === 3" type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </div>
    </template>

    <!-- 右键菜单 -->
    <div v-if="contextMenuVisible" class="context-menu" :style="contextMenuStyle">
      <div class="menu-item" @click="handleAddXpathRule">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        添加XPath规则
      </div>
      <div class="menu-item" @click="handleAddCssRule">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        添加CSS规则
      </div>
      <div class="menu-item" @click="handleCopyXpath">
        <IconifyIconOnline icon="ri:file-copy-line" class="mr-1" />
        复制XPath
      </div>
    </div>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import { message } from "@repo/utils";
import {
  getSpiderTaskById,
  createSpiderTask,
  updateSpiderTask,
  previewUrl,
  parseHtml,
  testSelector,
  SELECTOR_TYPES,
  PIPELINE_TYPES,
  INCREMENTAL_MODES,
  type SpiderTask,
  type ExtractRule
} from "@/api/spider";

// Props
const props = defineProps<{
  visible: boolean;
  taskId?: number;
}>();

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val)
});

const isEdit = computed(() => !!props.taskId);

// 响应式状态
const currentStep = ref(0);
const formRef = ref();
const previewLoading = ref(false);
const submitLoading = ref(false);
const previewHtml = ref("");
const htmlTree = ref<any[]>([]);
const htmlTreeRef = ref();
const contextMenuVisible = ref(false);
const contextMenuStyle = ref({});
const selectedNode = ref<any>(null);

// 表单数据
const form = reactive<SpiderTask>({
  spiderTaskName: "",
  spiderTaskUrl: "",
  spiderTaskDesc: "",
  spiderTaskThreadNum: 1,
  spiderTaskSleepTime: 1000,
  spiderTaskTimeout: 30,
  spiderTaskScheduleType: "NONE",
  spiderTaskCron: "",
  spiderTaskPipelineType: "JSON",
  spiderTaskStatus: 1,
  // 新增高级配置
  spiderTaskMaxDepth: 0,
  spiderTaskEnableUrlDiscover: false,
  spiderTaskUrlPattern: "",
  spiderTaskPagePattern: "",
  spiderTaskMaxPages: 0,
  spiderTaskIncrementalMode: "HASH",
  spiderTaskRateLimit: 0
});

// 提取规则
const extractRules = ref<(ExtractRule & { testResult?: string[] })[]>([]);

// 表单验证规则
const rules = {
  spiderTaskName: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  spiderTaskUrl: [
    { required: true, message: "请输入目标URL", trigger: "blur" },
    { type: "url", message: "请输入有效的URL", trigger: "blur" }
  ]
};

// 监听对话框打开
watch(() => props.visible, async (val) => {
  if (val) {
    currentStep.value = 0;
    extractRules.value = [];
    previewHtml.value = "";
    htmlTree.value = [];
    
    if (props.taskId) {
      await loadTaskDetail();
    } else {
      resetForm();
    }
  }
});

/**
 * 加载任务详情
 */
const loadTaskDetail = async () => {
  try {
    const res = await getSpiderTaskById(props.taskId!);
    if (res.code === "00000" && res.data) {
      Object.assign(form, res.data);
      if (res.data.spiderTaskExtractRules) {
        try {
          extractRules.value = JSON.parse(res.data.spiderTaskExtractRules);
        } catch (e) {
          extractRules.value = [];
        }
      }
    }
  } catch (error) {
    console.error("加载任务详情失败:", error);
    message.error("加载任务详情失败");
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(form, {
    spiderTaskName: "",
    spiderTaskUrl: "",
    spiderTaskDesc: "",
    spiderTaskThreadNum: 1,
    spiderTaskSleepTime: 1000,
    spiderTaskTimeout: 30,
    spiderTaskScheduleType: "NONE",
    spiderTaskCron: "",
    spiderTaskPipelineType: "JSON",
    spiderTaskStatus: 1,
    // 重置新增字段
    spiderTaskMaxDepth: 0,
    spiderTaskEnableUrlDiscover: false,
    spiderTaskUrlPattern: "",
    spiderTaskPagePattern: "",
    spiderTaskMaxPages: 0,
    spiderTaskIncrementalMode: "HASH",
    spiderTaskRateLimit: 0
  });
};

/**
 * 预览URL
 */
const handlePreviewUrl = async () => {
  if (!form.spiderTaskUrl) {
    message.warning("请先输入URL");
    return;
  }
  
  try {
    previewLoading.value = true;
    const [previewRes, parseRes] = await Promise.all([
      previewUrl(form.spiderTaskUrl),
      parseHtml(form.spiderTaskUrl)
    ]);
    
    if (previewRes.code === "00000") {
      previewHtml.value = previewRes.data?.html || "";
    }
    
    if (parseRes.code === "00000") {
      htmlTree.value = parseRes.data?.tree ? [parseRes.data.tree] : [];
    }
  } catch (error) {
    console.error("预览URL失败:", error);
    message.error("预览URL失败");
  } finally {
    previewLoading.value = false;
  }
};

/**
 * 刷新预览
 */
const handleRefreshPreview = () => {
  handlePreviewUrl();
};

/**
 * iframe加载完成
 */
const handleIframeLoad = () => {
  // 可以在这里添加iframe交互逻辑
};

/**
 * 节点点击
 */
const handleNodeClick = (data: any) => {
  selectedNode.value = data;
  // 高亮iframe中的对应元素
  highlightElement(data.xpath);
};

/**
 * 节点右键菜单
 */
const handleNodeContextMenu = (event: MouseEvent, data: any) => {
  event.preventDefault();
  selectedNode.value = data;
  contextMenuVisible.value = true;
  contextMenuStyle.value = {
    left: `${event.clientX}px`,
    top: `${event.clientY}px`
  };
  
  // 点击其他地方关闭菜单
  document.addEventListener("click", () => {
    contextMenuVisible.value = false;
  }, { once: true });
};

/**
 * 高亮元素
 */
const highlightElement = (xpath: string) => {
  // 通过postMessage与iframe通信实现高亮
  // 这里可以根据实际需求实现
};

/**
 * 添加XPath规则
 */
const handleAddXpathRule = () => {
  if (selectedNode.value) {
    extractRules.value.push({
      name: `field_${extractRules.value.length + 1}`,
      selector: selectedNode.value.xpath,
      type: "XPATH",
      multi: false,
      required: false
    });
    contextMenuVisible.value = false;
    currentStep.value = 2; // 跳转到数据提取步骤
  }
};

/**
 * 添加CSS规则
 */
const handleAddCssRule = () => {
  if (selectedNode.value) {
    extractRules.value.push({
      name: `field_${extractRules.value.length + 1}`,
      selector: selectedNode.value.cssPath || "",
      type: "CSS",
      multi: false,
      required: false
    });
    contextMenuVisible.value = false;
    currentStep.value = 2;
  }
};

/**
 * 复制XPath
 */
const handleCopyXpath = () => {
  if (selectedNode.value?.xpath) {
    navigator.clipboard.writeText(selectedNode.value.xpath);
    message.success("已复制XPath");
  }
  contextMenuVisible.value = false;
};

/**
 * 添加规则
 */
const handleAddRule = () => {
  extractRules.value.push({
    name: `field_${extractRules.value.length + 1}`,
    selector: "",
    type: "XPATH",
    multi: false,
    required: false
  });
};

/**
 * 删除规则
 */
const handleRemoveRule = (index: number) => {
  extractRules.value.splice(index, 1);
};

/**
 * 测试规则
 */
const handleTestRule = async (rule: ExtractRule & { testResult?: string[] }) => {
  if (!form.spiderTaskUrl || !rule.selector) {
    message.warning("请输入URL和选择器");
    return;
  }
  
  try {
    const res = await testSelector({
      url: form.spiderTaskUrl,
      selector: rule.selector,
      type: rule.type
    });
    
    if (res.code === "00000") {
      rule.testResult = res.data || [];
      if (rule.testResult.length === 0) {
        message.warning("未匹配到任何内容");
      } else {
        message.success(`匹配到 ${rule.testResult.length} 条结果`);
      }
    } else {
      message.error(`测试失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("测试规则失败:", error);
    message.error("测试规则失败");
  }
};

/**
 * 截断文本
 */
const truncateText = (text: string, maxLen: number) => {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
};

/**
 * 下一步
 */
const handleNextStep = async () => {
  if (currentStep.value === 0) {
    try {
      await formRef.value?.validate();
      currentStep.value++;
    } catch (error) {
      // 验证失败
    }
  } else {
    currentStep.value++;
  }
};

/**
 * 提交
 */
const handleSubmit = async () => {
  try {
    submitLoading.value = true;
    
    const data: SpiderTask = {
      ...form,
      spiderTaskExtractRules: JSON.stringify(extractRules.value)
    };
    
    let res;
    if (isEdit.value) {
      res = await updateSpiderTask(data);
    } else {
      res = await createSpiderTask(data);
    }
    
    if (res.code === "00000") {
      message.success(isEdit.value ? "保存成功" : "创建成功");
      dialogVisible.value = false;
      emit("success");
    } else {
      message.error(`操作失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("提交失败:", error);
    message.error("提交失败");
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.step-content {
  min-height: 400px;
}

.preview-step {
  .preview-container {
    display: flex;
    gap: 16px;
    height: 500px;
    
    .preview-left, .preview-right {
      flex: 1;
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
    }
    
    .preview-header {
      padding: 8px 12px;
      border-bottom: 1px solid var(--el-border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--el-bg-color-page);
      
      .preview-title { font-weight: 500; }
    }
    
    .preview-content {
      flex: 1;
      overflow: hidden;
      
      iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    }
    
    .html-tree-container {
      flex: 1;
      overflow: auto;
      padding: 8px;
    }
  }
}

.tree-node {
  font-family: monospace;
  font-size: 12px;
  
  .tag-name { color: #e83e8c; }
  .attr-id { color: #0d6efd; }
  .attr-class { color: #198754; }
  .node-text { color: #6c757d; margin-left: 8px; }
}

.extract-rules {
  .rules-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .rules-title { font-weight: 500; }
  }
  
  .test-result {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    
    .result-tag { max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
    .more-count { color: #909399; font-size: 12px; }
  }
}

.text-muted { color: #c0c4cc; }

.context-menu {
  position: fixed;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  
  .menu-item {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    
    &:hover { background: var(--el-fill-color-light); }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.ml-2 {
  margin-left: 8px;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>
