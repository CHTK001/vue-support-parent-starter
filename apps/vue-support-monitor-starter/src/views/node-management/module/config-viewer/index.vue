<template>
  <sc-dialog
    v-model="visible"
    title="节点配置查看"
    width="1000px"
    :before-close="handleClose"
    append-to-body
    class="config-viewer-dialog"
    destroy-on-close
    top="5vh"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <div class="header-icon-wrapper">
            <IconifyIconOnline icon="ri:settings-3-line" class="header-icon" />
          </div>
          <div class="header-text">
            <h3>配置查看</h3>
            <p v-if="nodeInfo">
              <span class="node-name">{{ nodeInfo.nodeName || nodeInfo.applicationName }}</span>
              <span class="node-address">{{ nodeInfo.ipAddress }}:{{ nodeInfo.port }}</span>
            </p>
          </div>
        </div>
      </div>
    </template>

    <div class="config-viewer-content">
      <!-- Tab导航 -->
      <el-tabs v-model="activeTab" class="config-tabs">
        <!-- 环境配置 -->
        <el-tab-pane name="environment">
          <template #label>
            <div class="tab-label">
              <IconifyIconOnline icon="ri:leaf-line" />
              <span>环境配置</span>
            </div>
          </template>
          <div class="tab-content">
            <div class="tab-toolbar">
              <div class="toolbar-left">
                <el-input
                  v-model="envSearchText"
                  placeholder="搜索配置项..."
                  clearable
                  class="search-input"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:search-line" />
                  </template>
                </el-input>
                <span class="search-result" v-if="envSearchText">
                  找到 <strong>{{ filteredEnvData.length }}</strong> 项
                </span>
              </div>
              <el-button type="primary" @click="loadEnvironment" :loading="loading.env">
                <IconifyIconOnline v-if="!loading.env" icon="ri:refresh-line" />
                刷新
              </el-button>
            </div>

            <div class="config-tree-wrapper">
              <el-tree
                v-if="filteredEnvData.length > 0"
                :data="filteredEnvData"
                :props="{ label: 'key', children: 'children' }"
                :default-expand-all="false"
                :default-expanded-keys="['activeProfiles']"
                node-key="fullKey"
                :filter-node-method="filterEnvNode"
                class="config-tree"
              >
                <template #default="{ data }">
                  <div class="tree-node">
                    <div class="node-key-wrapper">
                      <IconifyIconOnline 
                        :icon="data.isProfile ? 'ri:profile-line' : (data.children ? 'ri:folder-3-line' : 'ri:code-s-slash-line')" 
                        class="node-icon"
                        :class="{ 'is-folder': data.children, 'is-profile': data.isProfile }"
                      />
                      <span class="node-key">{{ data.key }}</span>
                      <span v-if="data.propertyCount" class="property-count">{{ data.propertyCount }} 项</span>
                    </div>
                    <span v-if="data.value !== undefined" class="node-value" :title="formatValue(data.value)">
                      {{ formatValue(data.value) }}
                    </span>
                  </div>
                </template>
              </el-tree>
              <el-empty v-else description="暂无环境配置数据" :image-size="80" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 配置属性 -->
        <el-tab-pane name="configProps">
          <template #label>
            <div class="tab-label">
              <IconifyIconOnline icon="ri:list-settings-line" />
              <span>配置属性</span>
            </div>
          </template>
          <div class="tab-content">
            <div class="tab-toolbar">
              <div class="toolbar-left">
                <el-input
                  v-model="propsSearchText"
                  placeholder="搜索配置项..."
                  clearable
                  class="search-input"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:search-line" />
                  </template>
                </el-input>
                <span class="search-result" v-if="propsSearchText">
                  找到 <strong>{{ filteredPropsData.length }}</strong> 项
                </span>
              </div>
              <el-button type="primary" @click="loadConfigProps" :loading="loading.props">
                <IconifyIconOnline v-if="!loading.props" icon="ri:refresh-line" />
                刷新
              </el-button>
            </div>

            <div class="config-tree-wrapper">
              <el-tree
                v-if="filteredPropsData.length > 0"
                :data="filteredPropsData"
                :props="{ label: 'key', children: 'children' }"
                :default-expand-all="false"
                node-key="fullKey"
                class="config-tree"
              >
                <template #default="{ data }">
                  <div class="tree-node">
                    <div class="node-key-wrapper">
                      <IconifyIconOnline 
                        :icon="data.children ? 'ri:folder-3-line' : 'ri:code-s-slash-line'" 
                        class="node-icon"
                        :class="{ 'is-folder': data.children }"
                      />
                      <span class="node-key">{{ data.key }}</span>
                      <span v-if="data.propertyCount" class="property-count">{{ data.propertyCount }} 项</span>
                    </div>
                    <span v-if="data.value !== undefined" class="node-value" :title="formatValue(data.value)">
                      {{ formatValue(data.value) }}
                    </span>
                  </div>
                </template>
              </el-tree>
              <el-empty v-else description="暂无配置属性数据" :image-size="80" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 系统信息 -->
        <el-tab-pane name="systemInfo">
          <template #label>
            <div class="tab-label">
              <IconifyIconOnline icon="ri:computer-line" />
              <span>系统信息</span>
            </div>
          </template>
          <div class="tab-content">
            <div class="tab-toolbar">
              <div class="toolbar-left"></div>
              <el-button type="primary" @click="loadSystemInfo" :loading="loading.system">
                <IconifyIconOnline v-if="!loading.system" icon="ri:refresh-line" />
                刷新
              </el-button>
            </div>

            <div class="system-info-wrapper">
              <!-- 健康状态 -->
              <div class="info-card">
                <div class="card-header">
                  <div class="header-left">
                    <div class="card-icon health">
                      <IconifyIconOnline icon="ri:heart-pulse-line" />
                    </div>
                    <span class="card-title">健康状态</span>
                  </div>
                  <el-tag
                    v-if="systemInfo.health"
                    :type="systemInfo.health.status === 'UP' ? 'success' : 'danger'"
                    effect="dark"
                    round
                  >
                    {{ systemInfo.health.status }}
                  </el-tag>
                </div>
                <div v-if="systemInfo.health?.components" class="card-body">
                  <div class="component-grid">
                    <div
                      v-for="(value, key) in systemInfo.health.components"
                      :key="key"
                      class="component-item"
                      :class="{ 'is-up': value?.status === 'UP', 'is-down': value?.status !== 'UP' }"
                    >
                      <IconifyIconOnline 
                        :icon="value?.status === 'UP' ? 'ri:checkbox-circle-fill' : 'ri:close-circle-fill'" 
                        class="component-icon"
                      />
                      <span class="component-name">{{ key }}</span>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无健康状态数据" :image-size="60" />
              </div>

              <!-- 应用信息 -->
              <div class="info-card">
                <div class="card-header">
                  <div class="header-left">
                    <div class="card-icon info">
                      <IconifyIconOnline icon="ri:information-line" />
                    </div>
                    <span class="card-title">应用信息</span>
                  </div>
                </div>
                <div v-if="systemInfo.info" class="card-body">
                  <div class="info-list">
                    <div
                      v-for="(value, key) in flattenObject(systemInfo.info)"
                      :key="key"
                      class="info-item"
                    >
                      <span class="info-label">{{ key }}</span>
                      <span class="info-value">{{ value }}</span>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无应用信息数据" :image-size="60" />
              </div>

              <!-- 指标信息 -->
              <div class="info-card metrics-card">
                <div class="card-header">
                  <div class="header-left">
                    <div class="card-icon metrics">
                      <IconifyIconOnline icon="ri:bar-chart-box-line" />
                    </div>
                    <span class="card-title">可用指标</span>
                  </div>
                  <span v-if="systemInfo.metrics?.names" class="metrics-count">
                    {{ systemInfo.metrics.names.length }} 项
                  </span>
                </div>
                <div v-if="systemInfo.metrics?.names" class="card-body">
                  <div class="metrics-list">
                    <el-tag
                      v-for="name in systemInfo.metrics.names.slice(0, 50)"
                      :key="name"
                      size="small"
                      effect="plain"
                      class="metric-tag"
                    >
                      {{ name }}
                    </el-tag>
                    <span v-if="systemInfo.metrics.names.length > 50" class="more-hint">
                      +{{ systemInfo.metrics.names.length - 50 }} 更多
                    </span>
                  </div>
                </div>
                <el-empty v-else description="暂无指标数据" :image-size="60" />
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
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from "vue";
import { message } from "@repo/utils";
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
 * 将 Spring Boot Actuator 环境配置转换为树形结构
 * Actuator /env 端点返回格式：
 * {
 *   "activeProfiles": ["dev"],
 *   "propertySources": [
 *     { "name": "systemProperties", "properties": { "java.version": { "value": "17" } } }
 *   ]
 * }
 */
const actuatorEnvToTree = (data: Record<string, unknown>): any[] => {
  const result: any[] = [];

  // 处理 activeProfiles
  if (data.activeProfiles && Array.isArray(data.activeProfiles)) {
    result.push({
      key: "激活的配置文件",
      fullKey: "activeProfiles",
      value: (data.activeProfiles as string[]).join(", ") || "无",
      isProfile: true,
    });
  }

  // 处理 propertySources
  if (data.propertySources && Array.isArray(data.propertySources)) {
    const sources = data.propertySources as any[];
    for (const source of sources) {
      const sourceName = source.name || "未知来源";
      const properties = source.properties || {};

      const children: any[] = [];
      for (const [propKey, propValue] of Object.entries(properties)) {
        const valueObj = propValue as { value?: unknown; origin?: string };
        children.push({
          key: propKey,
          fullKey: `${sourceName}.${propKey}`,
          value: valueObj?.value,
          origin: valueObj?.origin,
        });
      }

      // 只添加有属性的配置源
      if (children.length > 0) {
        result.push({
          key: sourceName,
          fullKey: sourceName,
          children,
          propertyCount: children.length,
        });
      }
    }
  }

  // 如果不是标准 Actuator 格式，回退到通用处理
  if (result.length === 0) {
    return objectToTree(data);
  }

  return result;
};

/**
 * 将 Spring Boot Actuator 配置属性转换为树形结构
 * Actuator /configprops 端点返回格式：
 * {
 *   "contexts": {
 *     "application": {
 *       "beans": {
 *         "spring.datasource-org.springframework.boot.autoconfigure.jdbc.DataSourceProperties": {
 *           "prefix": "spring.datasource",
 *           "properties": { "url": "jdbc:mysql://..." }
 *         }
 *       }
 *     }
 *   }
 * }
 */
const actuatorConfigPropsToTree = (data: Record<string, unknown>): any[] => {
  const result: any[] = [];

  // 处理 contexts 格式
  if (data.contexts && typeof data.contexts === "object") {
    const contexts = data.contexts as Record<string, any>;
    for (const [contextName, contextData] of Object.entries(contexts)) {
      const beans = contextData?.beans || {};
      const children: any[] = [];

      for (const [beanName, beanData] of Object.entries(beans)) {
        const beanInfo = beanData as { prefix?: string; properties?: Record<string, unknown> };
        const prefix = beanInfo.prefix || beanName;
        const properties = beanInfo.properties || {};

        const propChildren: any[] = [];
        for (const [propKey, propValue] of Object.entries(properties)) {
          if (propValue && typeof propValue === "object" && !Array.isArray(propValue)) {
            propChildren.push({
              key: propKey,
              fullKey: `${prefix}.${propKey}`,
              children: objectToTree(propValue as Record<string, unknown>, `${prefix}.${propKey}`),
            });
          } else {
            propChildren.push({
              key: propKey,
              fullKey: `${prefix}.${propKey}`,
              value: propValue,
            });
          }
        }

        if (propChildren.length > 0) {
          children.push({
            key: prefix,
            fullKey: prefix,
            children: propChildren,
            propertyCount: propChildren.length,
          });
        }
      }

      if (children.length > 0) {
        result.push({
          key: contextName === "application" ? "应用配置" : contextName,
          fullKey: contextName,
          children,
        });
      }
    }
  }

  // 如果不是标准格式，回退到通用处理
  if (result.length === 0) {
    return objectToTree(data);
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
      envData.value = actuatorEnvToTree(response.data);
    } else {
      message.error(response.msg || "获取环境配置失败");
    }
  } catch (error) {
    console.error("加载环境配置失败:", error);
    message.error("加载环境配置失败");
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
      propsData.value = actuatorConfigPropsToTree(response.data);
    } else {
      message.error(response.msg || "获取配置属性失败");
    }
  } catch (error) {
    console.error("加载配置属性失败:", error);
    message.error("加载配置属性失败");
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
      message.error(response.msg || "获取系统信息失败");
    }
  } catch (error) {
    console.error("加载系统信息失败:", error);
    message.error("加载系统信息失败");
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
// 对话框样式
:deep(.config-viewer-dialog) {
  .el-dialog__header {
    padding: 0;
    margin: 0;
  }

  .el-dialog__body {
    padding: 0;
  }

  .el-dialog__footer {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .header-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.25);

      .header-icon {
        font-size: 24px;
        color: #fff;
      }
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        letter-spacing: 0.5px;
      }

      p {
        margin: 6px 0 0 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 10px;

        .node-name {
          font-weight: 600;
          color: var(--el-color-primary);
        }

        .node-address {
          font-family: "JetBrains Mono", "Consolas", monospace;
          font-size: 12px;
          padding: 3px 10px;
          background: var(--el-bg-color);
          border-radius: 20px;
          border: 1px solid var(--el-border-color-lighter);
          color: var(--el-text-color-regular);
        }
      }
    }
  }
}

.config-viewer-content {
  padding: 20px;
  background: var(--el-fill-color-extra-light);
  min-height: 500px;

  .config-tabs {
    background: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    overflow: hidden;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
      padding: 0 16px;
      background: var(--el-fill-color-lighter);
      border-bottom: none;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__active-bar) {
      height: 3px;
      border-radius: 3px 3px 0 0;
      background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    }

    :deep(.el-tabs__item) {
      padding: 0 24px;
      height: 52px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
      }

      &.is-active {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      .iconify {
        font-size: 18px;
      }
    }
  }

  .tab-content {
    padding: 20px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tab-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 14px 18px;
    background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-extra-light) 100%);
    border-radius: 12px;
    border: 1px solid var(--el-border-color-extra-light);

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .search-input {
        width: 280px;

        :deep(.el-input__wrapper) {
          border-radius: 8px;
          background: var(--el-bg-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;

          &:hover,
          &:focus-within {
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
          }
        }

        :deep(.el-input__prefix) {
          color: var(--el-text-color-placeholder);
        }
      }

      .search-result {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        padding: 4px 12px;
        background: var(--el-color-primary-light-9);
        border-radius: 20px;

        strong {
          color: var(--el-color-primary);
          font-weight: 600;
        }
      }
    }
  }

  .config-tree-wrapper {
    max-height: calc(90vh - 320px);
    overflow: auto;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 12px;
    padding: 12px;
    background: var(--el-bg-color);
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.02);

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-light);
      border-radius: 3px;

      &:hover {
        background: var(--el-border-color);
      }
    }

    .config-tree {
      :deep(.el-tree-node__content) {
        height: 36px;
        border-radius: 8px;
        transition: all 0.2s ease;
        margin-bottom: 2px;

        &:hover {
          background: var(--el-color-primary-light-9);
        }
      }

      :deep(.el-tree-node__expand-icon) {
        font-size: 14px;
        color: var(--el-text-color-placeholder);
        transition: transform 0.2s ease;

        &.expanded {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-right: 16px;

    .node-key-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;

      .node-icon {
        font-size: 16px;
        color: var(--el-text-color-placeholder);
        transition: all 0.2s ease;

        &.is-folder {
          color: var(--el-color-warning);
          filter: drop-shadow(0 2px 4px rgba(var(--el-color-warning-rgb), 0.3));
        }

        &.is-profile {
          color: var(--el-color-success);
          filter: drop-shadow(0 2px 4px rgba(var(--el-color-success-rgb), 0.3));
        }
      }

      .node-key {
        font-weight: 500;
        font-size: 13px;
        color: var(--el-text-color-primary);
        transition: color 0.2s ease;
      }

      .property-count {
        font-size: 11px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        padding: 2px 10px;
        border-radius: 12px;
        margin-left: 8px;
        font-weight: 500;
      }
    }

    &:hover .node-key {
      color: var(--el-color-primary);
    }

    .node-value {
      color: var(--el-color-primary);
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 12px;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 4px 12px;
      background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
      border-radius: 6px;
      border: 1px solid var(--el-color-primary-light-7);
      font-weight: 500;
    }
  }

  .system-info-wrapper {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .info-card {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-extra-light);
      border-radius: 14px;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);

      &:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
        transform: translateY(-2px);
      }

      &.metrics-card {
        grid-column: span 2;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-extra-light) 100%);
        border-bottom: 1px solid var(--el-border-color-extra-light);

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .card-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            font-size: 18px;

            &.health {
              background: linear-gradient(135deg, var(--el-color-success-light-8) 0%, var(--el-color-success-light-9) 100%);
              color: var(--el-color-success);
              box-shadow: 0 4px 10px rgba(var(--el-color-success-rgb), 0.2);
            }

            &.info {
              background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-9) 100%);
              color: var(--el-color-primary);
              box-shadow: 0 4px 10px rgba(var(--el-color-primary-rgb), 0.2);
            }

            &.metrics {
              background: linear-gradient(135deg, var(--el-color-warning-light-8) 0%, var(--el-color-warning-light-9) 100%);
              color: var(--el-color-warning);
              box-shadow: 0 4px 10px rgba(var(--el-color-warning-rgb), 0.2);
            }
          }

          .card-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            letter-spacing: 0.3px;
          }
        }

        .metrics-count {
          font-size: 12px;
          color: var(--el-color-warning);
          padding: 4px 12px;
          background: var(--el-color-warning-light-9);
          border-radius: 20px;
          font-weight: 500;
        }
      }

      .card-body {
        padding: 16px 20px;
        max-height: 220px;
        overflow: auto;

        // 自定义滚动条
        &::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--el-border-color-light);
          border-radius: 3px;
        }

        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;

          .component-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            transition: all 0.2s ease;
            cursor: default;

            &.is-up {
              background: linear-gradient(135deg, var(--el-color-success-light-9) 0%, var(--el-color-success-light-8) 100%);
              border: 1px solid var(--el-color-success-light-7);

              .component-icon {
                color: var(--el-color-success);
                filter: drop-shadow(0 2px 4px rgba(var(--el-color-success-rgb), 0.3));
              }

              &:hover {
                background: var(--el-color-success-light-8);
              }
            }

            &.is-down {
              background: linear-gradient(135deg, var(--el-color-danger-light-9) 0%, var(--el-color-danger-light-8) 100%);
              border: 1px solid var(--el-color-danger-light-7);

              .component-icon {
                color: var(--el-color-danger);
                filter: drop-shadow(0 2px 4px rgba(var(--el-color-danger-rgb), 0.3));
              }

              &:hover {
                background: var(--el-color-danger-light-8);
              }
            }

            .component-icon {
              font-size: 16px;
            }

            .component-name {
              color: var(--el-text-color-primary);
              font-weight: 500;
            }
          }
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-extra-light) 100%);
            border-radius: 10px;
            border: 1px solid var(--el-border-color-extra-light);
            transition: all 0.2s ease;

            &:hover {
              background: var(--el-fill-color-light);
              border-color: var(--el-color-primary-light-7);
            }

            .info-label {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              font-weight: 500;
            }

            .info-value {
              font-size: 13px;
              font-weight: 600;
              color: var(--el-text-color-primary);
              font-family: "JetBrains Mono", "Consolas", monospace;
              padding: 2px 8px;
              background: var(--el-bg-color);
              border-radius: 4px;
            }
          }
        }

        .metrics-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .metric-tag {
            margin: 0;
            font-family: "JetBrains Mono", "Consolas", monospace;
            font-size: 11px;
            border-radius: 6px;
            transition: all 0.2s ease;
            cursor: default;

            &:hover {
              background: var(--el-color-primary-light-9);
              border-color: var(--el-color-primary-light-5);
              color: var(--el-color-primary);
              transform: scale(1.02);
            }
          }

          .more-hint {
            display: flex;
            align-items: center;
            color: var(--el-color-primary);
            font-size: 12px;
            padding: 4px 12px;
            background: var(--el-color-primary-light-9);
            border-radius: 20px;
            font-weight: 500;
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    min-width: 80px;
    border-radius: 8px;
    font-weight: 500;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .config-viewer-content {
    padding: 12px;

    .system-info-wrapper {
      grid-template-columns: 1fr;

      .info-card.metrics-card {
        grid-column: span 1;
      }
    }
  }
}
</style>
