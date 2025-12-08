<template>
  <el-dialog
    v-model="visible"
    title="节点配置查看"
    width="80%"
    :before-close="handleClose"
    append-to-body
    class="config-viewer-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <IconifyIconOnline icon="ri:settings-3-line" class="header-icon" />
          <div class="header-text">
            <h3>节点配置查看</h3>
            <p v-if="nodeInfo">
              {{ nodeInfo.nodeName || nodeInfo.applicationName }}
              ({{ nodeInfo.ipAddress }}:{{ nodeInfo.port }})
            </p>
          </div>
        </div>
      </div>
    </template>

    <div class="config-viewer-content">
      <!-- Tab导航 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 环境配置 -->
        <el-tab-pane label="环境配置" name="environment">
          <div class="tab-toolbar">
            <el-input
              v-model="envSearchText"
              placeholder="搜索配置项..."
              clearable
              style="width: 300px"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </el-input>
            <el-button
              type="primary"
              @click="loadEnvironment"
              :loading="loading.env"
            >
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </el-button>
          </div>

          <div class="config-tree-wrapper">
            <el-tree
              v-if="filteredEnvData.length > 0"
              :data="filteredEnvData"
              :props="{ label: 'key', children: 'children' }"
              default-expand-all
              :filter-node-method="filterEnvNode"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <span class="node-key">{{ data.key }}</span>
                  <span v-if="data.value !== undefined" class="node-value">
                    {{ formatValue(data.value) }}
                  </span>
                </div>
              </template>
            </el-tree>
            <el-empty v-else description="暂无环境配置数据" />
          </div>
        </el-tab-pane>

        <!-- 配置属性 -->
        <el-tab-pane label="配置属性" name="configProps">
          <div class="tab-toolbar">
            <el-input
              v-model="propsSearchText"
              placeholder="搜索配置项..."
              clearable
              style="width: 300px"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </el-input>
            <el-button
              type="primary"
              @click="loadConfigProps"
              :loading="loading.props"
            >
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </el-button>
          </div>

          <div class="config-tree-wrapper">
            <el-tree
              v-if="filteredPropsData.length > 0"
              :data="filteredPropsData"
              :props="{ label: 'key', children: 'children' }"
              default-expand-all
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <span class="node-key">{{ data.key }}</span>
                  <span v-if="data.value !== undefined" class="node-value">
                    {{ formatValue(data.value) }}
                  </span>
                </div>
              </template>
            </el-tree>
            <el-empty v-else description="暂无配置属性数据" />
          </div>
        </el-tab-pane>

        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="systemInfo">
          <div class="tab-toolbar">
            <el-button
              type="primary"
              @click="loadSystemInfo"
              :loading="loading.system"
            >
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </el-button>
          </div>

          <div class="system-info-wrapper">
            <!-- 健康状态 -->
            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <IconifyIconOnline icon="ri:heart-pulse-line" />
                  <span>健康状态</span>
                </div>
              </template>
              <div v-if="systemInfo.health" class="info-content">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="状态">
                    <el-tag
                      :type="
                        systemInfo.health.status === 'UP' ? 'success' : 'danger'
                      "
                    >
                      {{ systemInfo.health.status }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-for="(value, key) in systemInfo.health.components || {}"
                    :key="key"
                    :label="key"
                  >
                    <el-tag
                      size="small"
                      :type="value?.status === 'UP' ? 'success' : 'danger'"
                    >
                      {{ value?.status || "N/A" }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <el-empty
                v-else
                description="暂无健康状态数据"
                :image-size="60"
              />
            </el-card>

            <!-- 应用信息 -->
            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <IconifyIconOnline icon="ri:information-line" />
                  <span>应用信息</span>
                </div>
              </template>
              <div v-if="systemInfo.info" class="info-content">
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item
                    v-for="(value, key) in flattenObject(systemInfo.info)"
                    :key="key"
                    :label="key"
                  >
                    {{ value }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <el-empty
                v-else
                description="暂无应用信息数据"
                :image-size="60"
              />
            </el-card>

            <!-- 指标信息 -->
            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <IconifyIconOnline icon="ri:bar-chart-box-line" />
                  <span>可用指标</span>
                </div>
              </template>
              <div v-if="systemInfo.metrics?.names" class="info-content">
                <div class="metrics-list">
                  <el-tag
                    v-for="name in systemInfo.metrics.names.slice(0, 30)"
                    :key="name"
                    size="small"
                    class="metric-tag"
                  >
                    {{ name }}
                  </el-tag>
                  <span
                    v-if="systemInfo.metrics.names.length > 30"
                    class="more-hint"
                  >
                    +{{ systemInfo.metrics.names.length - 30 }} 更多...
                  </span>
                </div>
              </div>
              <el-empty v-else description="暂无指标数据" :image-size="60" />
            </el-card>
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
import { ref, computed, watch, reactive } from "vue";
import { ElMessage } from "element-plus";
import {
  getEnvironmentForNodeControl,
  getConfigPropsForNodeControl,
  getSystemInfoForNodeControl,
} from "@/api/server/node-control";

interface Props {
  modelValue: boolean;
  nodeInfo?: {
    nodeName?: string;
    applicationName: string;
    ipAddress: string;
    port: number;
  } | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const activeTab = ref("environment");
const loading = reactive({
  env: false,
  props: false,
  system: false,
});

const envSearchText = ref("");
const propsSearchText = ref("");
const envData = ref<any[]>([]);
const propsData = ref<any[]>([]);
const systemInfo = ref<any>({});

/**
 * 将对象转换为树形结构
 */
const objectToTree = (obj: Record<string, unknown>, parentKey = ""): any[] => {
  const result: any[] = [];

  for (const [key, value] of Object.entries(obj || {})) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    const node: any = { key, fullKey };

    if (value && typeof value === "object" && !Array.isArray(value)) {
      node.children = objectToTree(value as Record<string, unknown>, fullKey);
    } else {
      node.value = value;
    }

    result.push(node);
  }

  return result;
};

/**
 * 扁平化对象
 */
const flattenObject = (
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj || {})) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenObject(value as Record<string, unknown>, newKey)
      );
    } else {
      result[newKey] = String(value);
    }
  }

  return result;
};

/**
 * 格式化值
 */
const formatValue = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/**
 * 过滤环境节点
 */
const filterEnvNode = (value: string, data: any): boolean => {
  if (!value) return true;
  const searchLower = value.toLowerCase();
  return (
    data.key?.toLowerCase().includes(searchLower) ||
    String(data.value)?.toLowerCase().includes(searchLower)
  );
};

/**
 * 过滤后的环境数据
 */
const filteredEnvData = computed(() => {
  if (!envSearchText.value) return envData.value;
  return filterTree(envData.value, envSearchText.value);
});

/**
 * 过滤后的配置属性数据
 */
const filteredPropsData = computed(() => {
  if (!propsSearchText.value) return propsData.value;
  return filterTree(propsData.value, propsSearchText.value);
});

/**
 * 过滤树形数据
 */
const filterTree = (data: any[], keyword: string): any[] => {
  const result: any[] = [];
  const keywordLower = keyword.toLowerCase();

  for (const node of data) {
    const matches =
      node.key?.toLowerCase().includes(keywordLower) ||
      String(node.value)?.toLowerCase().includes(keywordLower);

    if (node.children && node.children.length > 0) {
      const filteredChildren = filterTree(node.children, keyword);
      if (filteredChildren.length > 0 || matches) {
        result.push({ ...node, children: filteredChildren });
      }
    } else if (matches) {
      result.push(node);
    }
  }

  return result;
};

/**
 * 加载环境配置
 */
const loadEnvironment = async () => {
  if (!props.nodeInfo) return;

  loading.env = true;
  try {
    const response = await getEnvironmentForNodeControl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    if (response.success && response.data) {
      envData.value = objectToTree(response.data);
    } else {
      ElMessage.error(response.msg || "获取环境配置失败");
    }
  } catch (error) {
    console.error("加载环境配置失败:", error);
    ElMessage.error("加载环境配置失败");
  } finally {
    loading.env = false;
  }
};

/**
 * 加载配置属性
 */
const loadConfigProps = async () => {
  if (!props.nodeInfo) return;

  loading.props = true;
  try {
    const response = await getConfigPropsForNodeControl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    if (response.success && response.data) {
      propsData.value = objectToTree(response.data);
    } else {
      ElMessage.error(response.msg || "获取配置属性失败");
    }
  } catch (error) {
    console.error("加载配置属性失败:", error);
    ElMessage.error("加载配置属性失败");
  } finally {
    loading.props = false;
  }
};

/**
 * 加载系统信息
 */
const loadSystemInfo = async () => {
  if (!props.nodeInfo) return;

  loading.system = true;
  try {
    const response = await getSystemInfoForNodeControl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    if (response.success && response.data) {
      systemInfo.value = response.data;
    } else {
      ElMessage.error(response.msg || "获取系统信息失败");
    }
  } catch (error) {
    console.error("加载系统信息失败:", error);
    ElMessage.error("加载系统信息失败");
  } finally {
    loading.system = false;
  }
};

/**
 * 根据当前Tab加载数据
 */
const loadCurrentTabData = () => {
  switch (activeTab.value) {
    case "environment":
      loadEnvironment();
      break;
    case "configProps":
      loadConfigProps();
      break;
    case "systemInfo":
      loadSystemInfo();
      break;
  }
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  visible.value = false;
};

watch(
  () => props.nodeInfo,
  (newNodeInfo) => {
    if (newNodeInfo && visible.value) {
      loadCurrentTabData();
    }
  },
  { immediate: true }
);

watch(visible, (newVisible) => {
  if (newVisible && props.nodeInfo) {
    loadCurrentTabData();
  } else if (!newVisible) {
    envData.value = [];
    propsData.value = [];
    systemInfo.value = {};
  }
});

watch(activeTab, () => {
  if (visible.value && props.nodeInfo) {
    loadCurrentTabData();
  }
});
</script>

<style lang="scss" scoped>
.dialog-header {
  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.config-viewer-content {
  .tab-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .config-tree-wrapper {
    height: 450px;
    overflow: auto;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 12px;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 0;

    .node-key {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .node-value {
      color: var(--el-color-primary);
      font-family: "Monaco", "Menlo", monospace;
      font-size: 12px;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .system-info-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;

    .info-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }

      .info-content {
        max-height: 300px;
        overflow: auto;
      }

      .metrics-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .metric-tag {
          margin: 0;
        }

        .more-hint {
          color: var(--el-text-color-secondary);
          font-size: 12px;
          line-height: 24px;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
