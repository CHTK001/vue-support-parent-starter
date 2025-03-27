<template>
  <!-- 环境配置查看器 -->
  <el-drawer v-model="visiable" :size="800" :title="title" :direction="direction" :close-on-click-modal="false"
    :destroy-on-close="true" class="env-drawer" @close="close">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :loading="loading" animated :count="5">
        <template #template>
          <div class="skeleton-item">
            <el-skeleton-item variant="text" style="width: 30%" />
            <el-skeleton-item variant="text" style="width: 70%" />
          </div>
          <el-divider />
        </template>
      </el-skeleton>
    </div>

    <!-- 环境配置内容 -->
    <div v-else class="env-content">
      <!-- 搜索工具栏 -->
      <div class="search-toolbar">
        <el-input v-model="inputValue" placeholder="搜索配置项..." clearable class="search-input">
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
      </div>

      <!-- 环境信息概览 -->
      <div class="env-overview">
        <el-card class="overview-card">
          <div class="overview-item">
            <div class="item-label">
              <IconifyIconOnline icon="ep:monitor" class="item-icon" />
              <span>当前激活的环境:</span>
            </div>
            <el-tag type="success" effect="light" class="env-tag">
              {{ metadata.applicationActive }}
            </el-tag>
          </div>

          <div class="overview-item">
            <div class="item-label">
              <IconifyIconOnline icon="ep:setting" class="item-icon" />
              <span>配置文件:</span>
            </div>
            <span class="item-value">{{ profile }}</span>
          </div>
        </el-card>
      </div>

      <!-- 配置源列表 -->
      <div class="property-sources">
        <transition-group name="fade-slide" tag="div">
          <el-card v-for="item in propertySources" :key="item.name" class="property-source-card">
            <!-- 配置源标题 -->
            <template #header>
              <div class="source-header">
                <div class="source-title">
                  <IconifyIconOnline icon="ep:files" class="source-icon" />
                  <span>{{ item?.name }}</span>
                </div>
                <el-tag size="small" type="info" effect="plain">
                  {{ Object.keys(item?.properties || {}).length }} 项
                </el-tag>
              </div>
            </template>

            <!-- 配置项表格 -->
            <el-table :data="getPropertyItems(item?.properties)" stripe border size="small" class="property-table">
              <el-table-column label="配置项" min-width="40%" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="property-key">{{ row.key }}</div>
                </template>
              </el-table-column>

              <el-table-column label="值" min-width="60%" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="property-value" :class="{ 'is-object': typeof row.value === 'object' }">
                    <template v-if="typeof row.value === 'object'">
                      <el-popover placement="right" trigger="click" :width="400" popper-class="json-popover">
                        <template #reference>
                          <el-button type="info" size="small" text>
                            <IconifyIconOnline icon="ep:view" class="mr-1" />
                            查看对象
                          </el-button>
                        </template>
                        <div class="json-content">
                          <pre>{{ JSON.stringify(row.value, null, 2) }}</pre>
                        </div>
                      </el-popover>
                    </template>
                    <template v-else>
                      <span>{{ row.value }}</span>
                    </template>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </transition-group>

        <!-- 空状态展示 -->
        <el-empty v-if="propertySources.length === 0" description="暂无环境配置" :image-size="200" class="empty-state">
          <template #description>
            <p>暂无环境配置或未找到匹配项</p>
            <el-button type="primary" @click="resetFilter">
              <IconifyIconOnline icon="ep:refresh" class="mr-1" />
              重置过滤器
            </el-button>
          </template>
        </el-empty>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { fetchActuatorCall } from "@/api/monitor/actuator";
import { cloneDeep } from "@pureadmin/utils";
import { computed, ref, watch } from "vue";

// 状态变量
const loading = ref(true);
const item = ref({});
const metadata = ref({});
const visiable = ref(false);
const title = ref("");
const inputValue = ref("");
const direction = ref("rtl");
const drawerVisible = ref(false);
const originPropertySources = ref([]);
const propertySources = ref([]);
const profile = ref("");

// 监听搜索输入变化
watch(inputValue, () => {
  filterPropertySources();
});

// 过滤配置源
const filterPropertySources = () => {
  if (!inputValue.value) {
    propertySources.value = cloneDeep(originPropertySources.value);
    return;
  }

  const searchTerm = inputValue.value.toLowerCase();
  const filteredSources = [];

  for (const source of cloneDeep(originPropertySources.value)) {
    // 如果配置源名称包含搜索词，直接添加
    if (source.name.toLowerCase().includes(searchTerm)) {
      filteredSources.push(source);
      continue;
    }

    // 过滤配置项
    const filteredProperties = {};
    let hasMatch = false;

    for (const [key, value] of Object.entries(source.properties || {})) {
      const stringValue = value?.value !== undefined ? String(value.value) : '';

      if (key.toLowerCase().includes(searchTerm) ||
        stringValue.toLowerCase().includes(searchTerm)) {
        filteredProperties[key] = value;
        hasMatch = true;
      }
    }

    if (hasMatch) {
      filteredSources.push({
        ...source,
        properties: filteredProperties
      });
    }
  }

  propertySources.value = filteredSources;
};

// 将配置项对象转换为表格数据
const getPropertyItems = (properties) => {
  if (!properties) return [];

  return Object.entries(properties).map(([key, prop]) => ({
    key,
    value: prop?.value
  }));
};

// 重置过滤器
const resetFilter = () => {
  inputValue.value = "";
  propertySources.value = cloneDeep(originPropertySources.value);
};

// 关闭抽屉
const close = () => {
  item.value = {};
  drawerVisible.value = false;
  inputValue.value = "";
  visiable.value = false;
  propertySources.value = [];
  originPropertySources.value = [];
};

// 打开抽屉
const open = (itemData) => {
  loading.value = true;
  item.value = itemData;
  const itemMetadata = itemData.metadata;
  metadata.value = itemMetadata;
  visiable.value = true;
  inputValue.value = "";
  title.value = `{${itemMetadata.applicationName}}的环境配置`;
  drawerVisible.value = true;

  // 获取环境配置数据
  fetchActuatorCall({
    url: `http://${itemData.host}:${itemData.port}${itemMetadata.contextPath}${itemMetadata.endpointsUrl}/env`,
    method: "GET"
  })
    .then(res => {
      if (res.code === "00000") {
        const data = JSON.parse(res.data);
        // 转换为数组以便更好地处理
        const sourcesArray = Object.values(data?.propertySources || {});
        originPropertySources.value = sourcesArray;
        propertySources.value = cloneDeep(sourcesArray);
        profile.value = data?.profiles?.join(", ") || "未指定";
      }
    })
    .catch(error => {
      console.error("获取环境配置失败:", error);
    })
    .finally(() => {
      loading.value = false;
    });
};

// 导出方法
defineExpose({
  open,
  close
});
</script>

<style scoped lang="scss">
.env-drawer {
  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-drawer__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  :deep(.el-drawer__body) {
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

// 加载状态
.loading-container {
  padding: 20px;

  .skeleton-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }
}

// 环境配置内容
.env-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  // 搜索工具栏
  .search-toolbar {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);

    .search-input {
      width: 100%;
    }
  }

  // 环境信息概览
  .env-overview {
    padding: 16px 20px;

    .overview-card {
      background-color: var(--el-bg-color-overlay);
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .overview-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .item-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--el-text-color-secondary);

          .item-icon {
            color: var(--el-color-primary);
          }
        }

        .env-tag {
          font-weight: 600;
        }

        .item-value {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }
    }
  }

  // 配置源列表
  .property-sources {
    flex: 1;
    padding: 0 20px 20px;
    overflow-y: auto;

    .property-source-card {
      margin-bottom: 16px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .source-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .source-title {
          display: flex;
          align-items: center;
          gap: 8px;

          .source-icon {
            color: var(--el-color-primary);
          }
        }
      }

      .property-table {
        margin: 0;

        :deep(.el-table__header) {
          th {
            background-color: var(--el-fill-color);
            font-weight: 600;
          }
        }

        .property-key {
          font-family: monospace;
          color: var(--el-color-primary);
        }

        .property-value {
          font-family: monospace;

          &.is-object {
            color: var(--el-color-info);
          }
        }
      }
    }

    // 空状态
    .empty-state {
      padding: 40px 0;

      p {
        margin-bottom: 16px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// JSON 弹出框样式
:deep(.json-popover) {
  .json-content {
    max-height: 400px;
    overflow: auto;

    pre {
      margin: 0;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

// 动画效果
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

// 暗黑模式适配
:root[data-theme='dark'] {

  .overview-card,
  .property-source-card {
    background-color: var(--el-bg-color);
  }
}
</style>