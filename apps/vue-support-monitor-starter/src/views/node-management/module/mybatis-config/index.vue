<template>
  <el-dialog
    v-model="visible"
    title="MyBatis 配置"
    width="1000px"
    :before-close="handleClose"
    append-to-body
    class="mybatis-config-dialog"
    destroy-on-close
    top="5vh"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <div class="header-icon-wrapper">
            <IconifyIconOnline icon="ri:database-2-line" class="header-icon" />
          </div>
          <div class="header-text">
            <h3>MyBatis 配置</h3>
            <p v-if="nodeInfo">
              <span class="node-name">{{ nodeInfo.nodeName || nodeInfo.applicationName }}</span>
              <span class="node-address">{{ nodeInfo.ipAddress }}:{{ nodeInfo.port }}</span>
            </p>
          </div>
        </div>
        <div class="header-stats" v-if="statistics">
          <div class="stat-item">
            <span class="stat-value">{{ statistics.mapperCount || 0 }}</span>
            <span class="stat-label">Mapper</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ statistics.mappedStatementCount || 0 }}</span>
            <span class="stat-label">SQL 语句</span>
          </div>
        </div>
      </div>
    </template>

    <div class="mybatis-config-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchText"
            placeholder="搜索 Mapper..."
            clearable
            class="search-input"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <span class="search-result" v-if="searchText">
            找到 <strong>{{ filteredMappers.length }}</strong> 个
          </span>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新所有 XML" placement="top">
            <el-button
              type="warning"
              :loading="refreshingAll"
              @click="handleRefreshAllXml"
            >
              <IconifyIconOnline v-if="!refreshingAll" icon="ri:refresh-fill" />
              刷新全部
            </el-button>
          </el-tooltip>
          <el-tooltip content="刷新配置" placement="top">
            <el-button
              type="primary"
              :loading="loading"
              @click="handleRefresh"
            >
              <IconifyIconOnline v-if="!loading" icon="ri:refresh-line" />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- Mapper 列表 -->
      <div class="table-wrapper">
        <ScTable
          ref="tableRef"
          :data="filteredMappers"
          table-name="node-mybatis-config"
          :page-size="50"
          border
          max-height="calc(90vh - 260px)"
          :loading="loading"
          @refresh="handleRefresh"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="mapper-detail" v-if="row.statements && row.statements.length > 0">
                <div class="detail-header">
                  <span class="detail-title">SQL 语句列表</span>
                  <el-tag size="small" type="info">{{ row.statements.length }} 个</el-tag>
                </div>
                <el-table :data="row.statements" size="small" border>
                  <el-table-column label="方法名" prop="methodName" min-width="180">
                    <template #default="{ row: stmt }">
                      <span class="method-name">{{ stmt.methodName }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" prop="sqlCommandType" width="100" align="center">
                    <template #default="{ row: stmt }">
                      <el-tag :type="getSqlTypeTagType(stmt.sqlCommandType)" size="small">
                        {{ stmt.sqlCommandType }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="返回类型" prop="resultType" min-width="200">
                    <template #default="{ row: stmt }">
                      <span class="result-type" :title="stmt.resultType">
                        {{ stmt.resultType || '-' }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="资源文件" prop="resource" min-width="200">
                    <template #default="{ row: stmt }">
                      <span class="resource-path" :title="stmt.resource">
                        {{ getResourceFileName(stmt.resource) }}
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="mapper-detail-empty" v-else>
                <el-empty description="暂无 SQL 语句" :image-size="60" />
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Mapper 名称" min-width="300">
            <template #default="{ row }">
              <div class="mapper-name-cell">
                <div class="mapper-icon-wrapper">
                  <IconifyIconOnline icon="ri:file-code-line" />
                </div>
                <div class="mapper-info">
                  <span class="mapper-simple-name">{{ row.simpleName }}</span>
                  <span class="mapper-full-name" :title="row.name">{{ row.name }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="方法数" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="primary" effect="plain" round>
                {{ row.methodCount || 0 }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :loading="row.loadingDetail"
                @click="loadMapperDetail(row)"
                plain
              >
                查看详情
              </el-button>
              <el-button
                type="warning"
                size="small"
                :loading="row.refreshing"
                @click="handleRefreshXml(row)"
                plain
              >
                刷新
              </el-button>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import {
  getNodeMappers,
  getMapperDetail,
  refreshXml,
  refreshAllXml,
  getMyBatisStatistics,
} from "@/api/server/node-mybatis-config";

// Mapper 信息接口
interface MapperInfo {
  name: string;
  simpleName: string;
  methodCount: number;
  statements?: StatementInfo[];
  loadingDetail?: boolean;
  refreshing?: boolean;
}

// SQL 语句信息接口
interface StatementInfo {
  id: string;
  methodName: string;
  sqlCommandType: string;
  resultType: string;
  resource: string;
}

// 统计信息接口
interface Statistics {
  enabled: boolean;
  mapperCount: number;
  mappedStatementCount: number;
  resultMapCount: number;
  sqlFragmentCount: number;
  cacheEnabled: boolean;
  lazyLoadingEnabled: boolean;
  sqlTypeCount: Record<string, number>;
}

/**
 * 编码节点URL
 */
const encodeNodeUrl = (ip: string, port: number): string => {
  return btoa(`${ip}:${port}`);
};

/**
 * 获取 SQL 类型标签类型
 */
const getSqlTypeTagType = (
  type?: string
): "success" | "warning" | "info" | "primary" | "danger" | undefined => {
  switch (type) {
    case "SELECT":
      return "primary";
    case "INSERT":
      return "success";
    case "UPDATE":
      return "warning";
    case "DELETE":
      return "danger";
    default:
      return "info";
  }
};

/**
 * 获取资源文件名
 */
const getResourceFileName = (resource?: string): string => {
  if (!resource) return "-";
  const parts = resource.split("/");
  return parts[parts.length - 1] || resource;
};

// 定义组件属性
interface Props {
  modelValue: boolean;
  nodeInfo?: {
    nodeName?: string;
    applicationName: string;
    ipAddress: string;
    port: number;
  } | null;
}

// 定义事件
interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const tableRef = ref();
const mappers = ref<MapperInfo[]>([]);
const statistics = ref<Statistics | null>(null);
const loading = ref(false);
const refreshingAll = ref(false);
const searchText = ref("");

// 过滤后的 Mapper 列表
const filteredMappers = computed(() => {
  if (!searchText.value) return mappers.value;
  return mappers.value.filter((mapper) =>
    mapper.name?.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 监听节点信息变化
watch(
  () => props.nodeInfo,
  (newNodeInfo) => {
    if (newNodeInfo && visible.value) {
      loadMappers();
      loadStatistics();
    }
  },
  { immediate: true }
);

// 监听弹框显示状态
watch(visible, (newVisible) => {
  if (newVisible && props.nodeInfo) {
    loadMappers();
    loadStatistics();
  } else if (!newVisible) {
    mappers.value = [];
    statistics.value = null;
    searchText.value = "";
  }
});

// 加载 Mapper 列表
const loadMappers = async () => {
  if (!props.nodeInfo) return;

  loading.value = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await getNodeMappers(encodedNodeUrl, searchText.value);

    if (response.success && (response as any).data) {
      mappers.value = ((response as any).data || []).map((mapper: any) => ({
        ...mapper,
        loadingDetail: false,
        refreshing: false,
      }));
    } else {
      message.error("获取 Mapper 列表失败: " + ((response as any).msg || "未知错误"));
      mappers.value = [];
    }
  } catch (error) {
    console.error("Load mappers error:", error);
    message.error("网络错误，请稍后重试");
    mappers.value = [];
  } finally {
    loading.value = false;
  }
};

// 加载统计信息
const loadStatistics = async () => {
  if (!props.nodeInfo) return;

  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await getMyBatisStatistics(encodedNodeUrl);

    if (response.success && (response as any).data) {
      statistics.value = (response as any).data;
    }
  } catch (error) {
    console.error("Load statistics error:", error);
  }
};

// 加载 Mapper 详情
const loadMapperDetail = async (mapper: MapperInfo) => {
  if (!props.nodeInfo) return;

  mapper.loadingDetail = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await getMapperDetail(encodedNodeUrl, mapper.name);

    if (response.success && (response as any).data) {
      mapper.statements = (response as any).data.statements || [];
    } else {
      message.error("获取 Mapper 详情失败: " + ((response as any).msg || "未知错误"));
    }
  } catch (error) {
    console.error("Load mapper detail error:", error);
    message.error("网络错误，请稍后重试");
  } finally {
    mapper.loadingDetail = false;
  }
};

// 刷新指定 XML
const handleRefreshXml = async (mapper: MapperInfo) => {
  if (!props.nodeInfo || !mapper.statements?.length) {
    message.warning("请先加载 Mapper 详情");
    return;
  }

  // 获取资源文件路径
  const resource = mapper.statements[0]?.resource;
  if (!resource) {
    message.warning("未找到资源文件路径");
    return;
  }

  mapper.refreshing = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await refreshXml(encodedNodeUrl, resource);

    if (response.success) {
      message.success("XML 刷新成功");
      await loadMapperDetail(mapper);
    } else {
      message.error("刷新 XML 失败: " + ((response as any).msg || "未知错误"));
    }
  } catch (error) {
    console.error("Refresh XML error:", error);
    message.error("网络错误，请稍后重试");
  } finally {
    mapper.refreshing = false;
  }
};

// 刷新所有 XML
const handleRefreshAllXml = async () => {
  if (!props.nodeInfo) return;

  refreshingAll.value = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await refreshAllXml(encodedNodeUrl);

    if (response.success) {
      const data = (response as any).data || {};
      message.success(`刷新完成: ${data.refreshedCount || 0}/${data.totalResources || 0}`);
      await loadMappers();
    } else {
      message.error("刷新 XML 失败: " + ((response as any).msg || "未知错误"));
    }
  } catch (error) {
    console.error("Refresh all XML error:", error);
    message.error("网络错误，请稍后重试");
  } finally {
    refreshingAll.value = false;
  }
};

// 刷新数据
const handleRefresh = async () => {
  await loadMappers();
  await loadStatistics();
  message.success("刷新成功");
};

const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--el-color-primary-light-9);
      border-radius: 10px;

      .header-icon {
        font-size: 20px;
        color: var(--el-color-primary);
      }
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 8px;

        .node-name {
          font-weight: 500;
        }

        .node-address {
          font-family: "JetBrains Mono", "Consolas", monospace;
          font-size: 12px;
          padding: 2px 6px;
          background: var(--el-fill-color-light);
          border-radius: 4px;
        }
      }
    }
  }

  .header-stats {
    display: flex;
    gap: 16px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 16px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--el-color-primary);
      }

      .stat-label {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }
  }
}

.mybatis-config-content {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .search-input {
        width: 240px;

        :deep(.el-input__wrapper) {
          border-radius: 6px;
          background: var(--el-bg-color);
        }
      }

      .search-result {
        font-size: 13px;
        color: var(--el-text-color-secondary);

        strong {
          color: var(--el-color-primary);
        }
      }
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .table-wrapper {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
  }

  .mapper-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;

    .mapper-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: var(--el-color-primary-light-9);
      border-radius: 6px;
      color: var(--el-color-primary);
      font-size: 16px;
      flex-shrink: 0;
    }

    .mapper-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .mapper-simple-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }

      .mapper-full-name {
        font-family: "JetBrains Mono", "Consolas", monospace;
        font-size: 11px;
        color: var(--el-text-color-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .mapper-detail {
    padding: 16px;
    background: var(--el-fill-color-lighter);

    .detail-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .detail-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }

    .method-name {
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 13px;
      color: var(--el-color-primary);
    }

    .result-type {
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }

    .resource-path {
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
  }

  .mapper-detail-empty {
    padding: 20px;
    background: var(--el-fill-color-lighter);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
