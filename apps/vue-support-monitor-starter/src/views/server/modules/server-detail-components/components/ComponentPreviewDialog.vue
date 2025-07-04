<template>
  <el-dialog
    v-model="visible"
    title="组件预览"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    top="5vh"
  >
    <div class="component-preview">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="可视化预览" name="visual">
          <div class="preview-container">
            <div class="preview-wrapper">
              <component
                :is="getComponentType(componentData?.monitorSysGenServerDetailComponentType)"
                :component-data="componentData"
                :server-id="serverId"
                :edit-mode="false"
                v-if="componentData"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="配置信息" name="config">
          <div class="config-container">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="组件名称">
                {{ componentData?.monitorSysGenServerDetailComponentName }}
              </el-descriptions-item>
              <el-descriptions-item label="组件标题">
                {{ componentData?.monitorSysGenServerDetailComponentTitle }}
              </el-descriptions-item>
              <el-descriptions-item label="组件类型">
                <el-tag :type="getComponentTypeColor(componentData?.monitorSysGenServerDetailComponentType)">
                  {{ getComponentTypeName(componentData?.monitorSysGenServerDetailComponentType) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="表达式类型">
                <el-tag :type="componentData?.monitorSysGenServerDetailComponentExpressionType === 'PROMETHEUS' ? 'success' : 'info'">
                  {{ componentData?.monitorSysGenServerDetailComponentExpressionType }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="刷新间隔">
                {{ componentData?.monitorSysGenServerDetailComponentRefreshInterval }} 秒
              </el-descriptions-item>
              <el-descriptions-item label="排序序号">
                {{ componentData?.monitorSysGenServerDetailComponentSortOrder }}
              </el-descriptions-item>
              <el-descriptions-item label="查询表达式" :span="2">
                <div class="expression-content">
                  <pre>{{ componentData?.monitorSysGenServerDetailComponentExpression }}</pre>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="组件描述" :span="2" v-if="componentData?.monitorSysGenServerDetailComponentDesc">
                {{ componentData?.monitorSysGenServerDetailComponentDesc }}
              </el-descriptions-item>
              <el-descriptions-item label="图表配置" :span="2" v-if="componentData?.monitorSysGenServerDetailComponentChartConfig">
                <div class="config-content">
                  <pre>{{ formatJson(componentData?.monitorSysGenServerDetailComponentChartConfig) }}</pre>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="查询结果" name="result">
          <div class="result-container">
            <div class="result-toolbar">
              <el-button type="primary" @click="executeQuery" :loading="queryLoading">
                <IconifyIconOnline icon="ri:play-line" class="mr-1" />
                执行查询
              </el-button>
              <el-button @click="clearResult">
                <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                清空结果
              </el-button>
            </div>
            
            <div class="result-content" v-loading="queryLoading">
              <div v-if="queryError" class="error-message">
                <el-alert
                  :title="queryError"
                  type="error"
                  :closable="false"
                  show-icon
                />
              </div>
              <div v-else-if="queryResult" class="result-data">
                <el-card>
                  <template #header>
                    <div class="result-header">
                      <span>查询结果</span>
                      <el-tag size="small">{{ formatTime(queryTime) }}</el-tag>
                    </div>
                  </template>
                  <pre class="result-json">{{ formatJson(queryResult) }}</pre>
                </el-card>
              </div>
              <div v-else class="no-result">
                <el-empty description="暂无查询结果">
                  <el-button type="primary" @click="executeQuery">执行查询</el-button>
                </el-empty>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "@repo/utils";
import { executeComponentQueryDetail, type ServerDetailComponent } from "@/api/server";

// 导入预览组件
import CardPreview from "./previews/CardPreview.vue";
import GaugePreview from "./previews/GaugePreview.vue";
import LinePreview from "./previews/LinePreview.vue";
import BarPreview from "./previews/BarPreview.vue";
import PiePreview from "./previews/PiePreview.vue";
import TablePreview from "./previews/TablePreview.vue";

// 定义属性
const props = defineProps<{
  serverId: number;
}>();

// 响应式状态
const visible = ref(false);
const activeTab = ref("visual");
const componentData = ref<ServerDetailComponent | null>(null);
const queryLoading = ref(false);
const queryResult = ref<any>(null);
const queryError = ref("");
const queryTime = ref<Date | null>(null);

// 组件类型映射
const componentTypeMap = {
  card: CardPreview,
  gauge: GaugePreview,
  line: LinePreview,
  bar: BarPreview,
  pie: PiePreview,
  table: TablePreview,
};

/**
 * 获取组件类型
 */
const getComponentType = (type?: string) => {
  return componentTypeMap[type as keyof typeof componentTypeMap] || CardPreview;
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type?: string) => {
  const nameMap: Record<string, string> = {
    card: "卡片",
    gauge: "仪表盘",
    line: "折线图",
    bar: "柱状图",
    pie: "饼图",
    table: "表格"
  };
  return nameMap[type || ""] || type;
};

/**
 * 获取组件类型颜色
 */
const getComponentTypeColor = (type?: string) => {
  const colorMap: Record<string, string> = {
    card: "primary",
    gauge: "success",
    line: "warning",
    bar: "info",
    pie: "danger",
    table: ""
  };
  return colorMap[type || ""] || "";
};

/**
 * 格式化 JSON
 */
const formatJson = (jsonStr?: string) => {
  if (!jsonStr) return "";
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }
};

/**
 * 格式化时间
 */
const formatTime = (time?: Date | null) => {
  if (!time) return "";
  return time.toLocaleString();
};

/**
 * 打开对话框
 */
const open = (data: ServerDetailComponent) => {
  visible.value = true;
  componentData.value = data;
  activeTab.value = "visual";
  queryResult.value = null;
  queryError.value = "";
  queryTime.value = null;
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  visible.value = false;
};

/**
 * 执行查询
 */
const executeQuery = async () => {
  if (!componentData.value?.monitorSysGenServerDetailComponentId) {
    message.warning("组件ID不存在，无法执行查询");
    return;
  }

  try {
    queryLoading.value = true;
    queryError.value = "";

    // 构建时间范围参数
    const timeRange = {
      start: Date.now() - 5 * 60 * 1000, // 最近5分钟
      end: Date.now(),
    };

    const res = await executeComponentQueryDetail(
      componentData.value.monitorSysGenServerDetailComponentId,
      timeRange
    );

    if (res.code === "00000") {
      queryResult.value = res.data;
      queryTime.value = new Date();
      message.success("查询执行成功");
    } else {
      queryError.value = res.msg || "查询失败";
    }
  } catch (error) {
    console.error("执行查询失败:", error);
    queryError.value = "查询执行失败";
  } finally {
    queryLoading.value = false;
  }
};

/**
 * 清空结果
 */
const clearResult = () => {
  queryResult.value = null;
  queryError.value = "";
  queryTime.value = null;
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.component-preview {
  .preview-container {
    padding: 20px;
    background: var(--el-bg-color-page);
    border-radius: 8px;

    .preview-wrapper {
      width: 400px;
      height: 300px;
      margin: 0 auto;
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      overflow: hidden;
    }
  }

  .config-container {
    padding: 20px;

    .expression-content,
    .config-content {
      max-height: 200px;
      overflow-y: auto;
      background: var(--el-bg-color-page);
      padding: 12px;
      border-radius: 4px;
      border: 1px solid var(--el-border-color-light);

      pre {
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }

  .result-container {
    padding: 20px;

    .result-toolbar {
      margin-bottom: 16px;
      display: flex;
      gap: 8px;
    }

    .result-content {
      .error-message {
        margin-bottom: 16px;
      }

      .result-data {
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .result-json {
          max-height: 400px;
          overflow-y: auto;
          background: var(--el-bg-color-page);
          padding: 12px;
          border-radius: 4px;
          margin: 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.5;
          color: var(--el-text-color-primary);
          white-space: pre-wrap;
          word-break: break-all;
        }
      }

      .no-result {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
