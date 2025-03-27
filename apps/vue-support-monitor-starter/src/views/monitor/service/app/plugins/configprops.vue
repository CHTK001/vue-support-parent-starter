<template>
  <!-- 系统配置属性查看器 -->
  <el-drawer v-model="drawerVisible" :size="800" :close-on-click-modal="true" :destroy-on-close="true" :title="title"
    :direction="direction" class="config-props-drawer" @close="handleClose">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-input v-model="searchQuery" placeholder="搜索配置项..." clearable class="search-input">
        <template #prefix>
          <IconifyIconOnline icon="ep:search" />
        </template>
      </el-input>

      <el-select v-model="currentContext" placeholder="选择上下文" class="context-select">
        <el-option v-for="(context, key) in Object.keys(propertySources)" :key="key" :label="key" :value="key" />
      </el-select>
    </div>

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

    <!-- 空状态 -->
    <el-empty v-else-if="Object.keys(propertySources).length === 0" description="暂无配置数据" :image-size="200"
      class="empty-state">
      <template #description>
        <p>暂无配置数据</p>
        <el-button type="primary" @click="refreshData">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          重新加载
        </el-button>
      </template>
    </el-empty>

    <!-- 配置内容 -->
    <div v-else class="config-content">
      <transition-group name="fade-slide" tag="div">
        <div v-for="(item, contextKey) in filteredPropertySources" :key="contextKey" class="context-section">
          <transition-group name="fade-slide" tag="div">
            <div v-for="(bean, beanKey) in item.beans" :key="beanKey" class="bean-card">
              <!-- 配置组标题 -->
              <div class="bean-header">
                <div class="bean-title">
                  <IconifyIconOnline icon="ep:setting" class="bean-icon" />
                  <span class="bean-name">{{ beanKey }}</span>
                </div>
                <el-tag size="small" type="info" effect="plain">
                  {{ Object.keys(bean?.properties || {}).length }} 项
                </el-tag>
              </div>

              <!-- 配置项列表 -->
              <div class="bean-properties">
                <el-table :data="getFilteredProperties(bean)" stripe border size="small" class="property-table">
                  <el-table-column label="配置项" min-width="40%" show-overflow-tooltip>
                    <template #default="{ row }">
                      <div class="property-key">
                        <el-tooltip :content="row.fullKey" placement="top">
                          <span>{{ row.key }}</span>
                        </el-tooltip>
                      </div>
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
              </div>
            </div>
          </transition-group>
        </div>
      </transition-group>
    </div>
  </el-drawer>
</template>

<script setup>
import { fetchActuatorCall } from "@/api/monitor/actuator";
import { computed, ref, watch } from "vue";

// 状态变量
const title = ref("");
const direction = ref("rtl");
const item = ref({});
const metadata = ref({});
const drawerVisible = ref(false);
const loading = ref(true);
const propertySources = ref({});
const searchQuery = ref("");
const currentContext = ref("");

// 过滤后的配置源
const filteredPropertySources = computed(() => {
  if (!searchQuery.value && !currentContext.value) {
    return propertySources.value;
  }

  // 根据上下文过滤
  let result = currentContext.value
    ? { [currentContext.value]: propertySources.value[currentContext.value] }
    : { ...propertySources.value };

  // 如果没有搜索关键字，直接返回上下文过滤结果
  if (!searchQuery.value) {
    return result;
  }

  // 搜索关键字过滤
  const query = searchQuery.value.toLowerCase();
  const filtered = {};

  Object.entries(result).forEach(([contextKey, context]) => {
    const filteredBeans = {};

    Object.entries(context.beans || {}).forEach(([beanKey, bean]) => {
      if (beanKey.toLowerCase().includes(query)) {
        filteredBeans[beanKey] = bean;
        return;
      }

      // 检查属性名是否包含搜索关键字
      const hasMatchingProperty = Object.keys(bean?.properties || {}).some(propKey =>
        propKey.toLowerCase().includes(query) ||
        `${bean.prefix}.${propKey}`.toLowerCase().includes(query)
      );

      if (hasMatchingProperty) {
        filteredBeans[beanKey] = bean;
      }
    });

    if (Object.keys(filteredBeans).length > 0) {
      filtered[contextKey] = {
        ...context,
        beans: filteredBeans
      };
    }
  });

  return filtered;
});

// 获取过滤后的属性列表
const getFilteredProperties = (bean) => {
  if (!bean?.properties) return [];

  const query = searchQuery.value.toLowerCase();
  const result = [];

  Object.entries(bean.properties).forEach(([key, value]) => {
    const fullKey = `${bean.prefix}.${key}`;

    if (!searchQuery.value ||
      key.toLowerCase().includes(query) ||
      fullKey.toLowerCase().includes(query)) {
      result.push({
        key,
        fullKey,
        value
      });
    }
  });

  return result;
};

// 监听搜索关键字变化
watch(searchQuery, () => {
  // 当搜索关键字变化时，如果只有一个上下文，自动选择它
  if (Object.keys(filteredPropertySources.value).length === 1) {
    currentContext.value = Object.keys(filteredPropertySources.value)[0];
  }
});

// 关闭抽屉
const handleClose = () => {
  close();
};

// 重置状态
const close = () => {
  searchQuery.value = "";
  currentContext.value = "";
  propertySources.value = {};
  drawerVisible.value = false;
  loading.value = false;
};

// 刷新数据
const refreshData = () => {
  loading.value = true;
  fetchData();
};

// 获取配置数据
const fetchData = () => {
  fetchActuatorCall({
    url: `http://${item.value.host}:${item.value.port}${metadata.value.contextPath}${metadata.value.endpointsUrl}/configprops`,
    method: "GET"
  })
    .then(res => {
      if (res.code === "00000") {
        const data = JSON.parse(res.data);
        propertySources.value = data?.contexts || {};

        // 如果只有一个上下文，自动选择它
        if (Object.keys(propertySources.value).length === 1) {
          currentContext.value = Object.keys(propertySources.value)[0];
        }
      }
    })
    .catch(error => {
      console.error("获取配置属性失败:", error);
    })
    .finally(() => {
      loading.value = false;
    });
};

// 打开抽屉
const open = (itemData) => {
  item.value = itemData;
  const itemMetadata = itemData.metadata;
  metadata.value = itemMetadata;
  title.value = `{${itemMetadata.applicationName}}的配置属性`;
  drawerVisible.value = true;
  loading.value = true;

  // 重置过滤条件
  searchQuery.value = "";
  currentContext.value = "";

  // 获取数据
  fetchData();
};

// 导出方法
defineExpose({
  open,
  close
});
</script>

<style scoped lang="scss">
.config-props-drawer {
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

// 工具栏样式
.toolbar {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);

  .search-input {
    flex: 1;
  }

  .context-select {
    width: 200px;
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

// 空状态
.empty-state {
  padding: 40px 0;

  p {
    margin-bottom: 16px;
    color: var(--el-text-color-secondary);
  }
}

// 配置内容
.config-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  .context-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // 配置组卡片
  .bean-card {
    margin-bottom: 16px;
    border-radius: 8px;
    background-color: var(--el-bg-color-overlay);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    // 配置组标题
    .bean-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--el-fill-color-light);
      border-bottom: 1px solid var(--el-border-color-lighter);

      .bean-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .bean-icon {
          color: var(--el-color-primary);
        }

        .bean-name {
          font-weight: 600;
          color: var(--el-text-color-primary);
          font-size: 14px;
        }
      }
    }

    // 配置项列表
    .bean-properties {
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
  .bean-card {
    background-color: var(--el-bg-color);

    .bean-header {
      background-color: var(--el-fill-color-darker);
    }
  }
}
</style>