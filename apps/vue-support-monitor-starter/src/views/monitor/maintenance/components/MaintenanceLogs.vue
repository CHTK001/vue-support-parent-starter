<template>
  <div class="logs-container">
    <div class="action-bar">
      <div class="search-area">
        <el-input v-model="searchText" placeholder="搜索日志内容" clearable @input="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ri:database-2-line" />
          </template>
        </el-input>
      </div>
      <div class="filter-area">
        <el-select v-model="logType" placeholder="操作类型" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="创建" value="1" />
          <el-option label="更新" value="2" />
          <el-option label="删除" value="3" />
          <el-option label="启用/禁用" value="4" />
          <el-option label="连接测试" value="5" />
          <el-option label="同步脚本" value="6" />
          <el-option label="上传文件" value="7" />
          <el-option label="部署文件" value="8" />
        </el-select>

        <el-select v-model="targetType" placeholder="对象类型" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="维护组" value="1" />
          <el-option label="维护主机" value="2" />
          <el-option label="维护脚本" value="3" />
          <el-option label="维护文件" value="4" />
        </el-select>

        <el-select v-model="resultType" placeholder="操作结果" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="成功" value="true" />
          <el-option label="失败" value="false" />
        </el-select>
      </div>
      <el-button type="primary" @click="fetchLogs">
        <IconifyIconOnline icon="ri:refresh-line" />
        刷新
      </el-button>
    </div>

    <div class="logs-list">
      <ScTable
        ref="logTable"
        v-loading="loading"
        layout="list"
        :url="getMaintenanceLogs"
        :params="{ groupId: props.groupId }"
        :page-size="pageSize"
        :height="'100%'"
        :hide-do="true"
        :hide-pagination="false"
        @data-loaded="handleDataLoaded"
      >
        <template #default="{ row }">
          <div class="log-item">
            <div class="log-header">
              <div class="log-time">
                <IconifyIconOnline icon="ri:time-line" class="icon" />
                {{ formatTime(row.operationTime) }}
              </div>
              <div class="log-user">
                <IconifyIconOnline icon="ri:user-line" class="icon" />
                {{ row.operationUser }}
              </div>
              <div class="log-type">
                <el-tag size="small" :type="getOperationTagType(row.operationType)">
                  {{ getOperationTypeDesc(row.operationType) }}
                </el-tag>
              </div>
              <div class="log-result">
                <el-tag v-if="row.operationResult" type="success" size="small">成功</el-tag>
                <el-tag v-else type="danger" size="small">失败</el-tag>
              </div>
            </div>

            <div class="log-content">
              <div class="log-details">
                <div class="log-target">
                  <span class="label">操作对象：</span>
                  <el-tag size="small" :type="getTargetTagType(row.targetType)">
                    {{ getTargetTypeDesc(row.targetType) }}
                  </el-tag>
                </div>
                <div class="log-detail-content">
                  <span class="label">操作详情：</span>
                  <div class="detail-content">{{ formatDetails(row.operationDetails) }}</div>
                </div>
                <div v-if="row.resultMessage" class="log-message">
                  <span class="label">结果消息：</span>
                  <span>{{ row.resultMessage }}</span>
                </div>
                <div class="log-ip">
                  <span class="label">IP地址：</span>
                  <span>{{ row.ipAddress }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineExpose } from "vue";
import { getMaintenanceLogs } from "@/api/monitor/maintenance";
import ScTable from "@repo/components/ScTable/index.vue";

const props = defineProps({
  groupId: {
    type: [String, Number],
    required: true
  }
});

// 数据状态
const loading = ref(false);
const logs = ref([]);
const searchText = ref("");
const logType = ref("");
const targetType = ref("");
const resultType = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const logTable = ref(null);

// 格式化日期时间
const formatTime = timestamp => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// 格式化操作详情
const formatDetails = details => {
  if (!details) return "无详细信息";
  try {
    const detailsObj = JSON.parse(details);
    return Object.entries(detailsObj)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  } catch (e) {
    return details;
  }
};

// 获取操作类型描述
const getOperationTypeDesc = type => {
  const types = {
    1: "创建",
    2: "更新",
    3: "删除",
    4: "启用/禁用",
    5: "连接测试",
    6: "同步脚本",
    7: "上传文件",
    8: "部署文件"
  };
  return types[type] || "未知";
};

// 获取操作类型标签颜色
const getOperationTagType = type => {
  const types = {
    1: "success",
    2: "warning",
    3: "danger",
    4: "info",
    5: "info",
    6: "warning",
    7: "success",
    8: "warning"
  };
  return types[type] || "info";
};

// 获取对象类型描述
const getTargetTypeDesc = type => {
  const types = {
    1: "维护组",
    2: "维护主机",
    3: "维护脚本",
    4: "维护文件"
  };
  return types[type] || "未知";
};

// 获取对象类型标签颜色
const getTargetTagType = type => {
  const types = {
    1: "",
    2: "success",
    3: "warning",
    4: "info"
  };
  return types[type] || "";
};

// 过滤日志
const filteredLogs = computed(() => {
  let result = logs.value;

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(log => {
      return (
        log.operationUser?.toLowerCase().includes(search) ||
        log.resultMessage?.toLowerCase().includes(search) ||
        log.operationDetails?.toLowerCase().includes(search) ||
        log.ipAddress?.toLowerCase().includes(search)
      );
    });
  }

  if (logType.value) {
    result = result.filter(log => log.operationType == logType.value);
  }

  if (targetType.value) {
    result = result.filter(log => log.targetType == targetType.value);
  }

  if (resultType.value !== "") {
    const isSuccess = resultType.value === "true";
    result = result.filter(log => log.operationResult === isSuccess);
  }

  return result;
});

// 处理数据加载完成
const handleDataLoaded = data => {
  console.log("数据加载完成:", data);
};

// 处理搜索
const handleSearch = () => {
  if (logTable.value) {
    logTable.value.goToPage(1);
  }
};
</script>

<style lang="scss" scoped>
.logs-container {
  height: 100%;
  display: flex;
  flex-direction: column;

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 16px;

    .search-area {
      flex: 1;
    }

    .filter-area {
      display: flex;
      gap: 12px;

      .el-select {
        width: 140px;
      }
    }
  }

  .logs-list {
    flex: 1;
    overflow: hidden;
  }

  .log-item {
    padding: 16px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    transition: all 0.3s ease;
    margin-bottom: 8px;
    width: 100%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      gap: 12px;

      .icon {
        margin-right: 6px;
        font-size: 16px;
        vertical-align: middle;
      }

      .log-time {
        flex: 2;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }

      .log-user {
        flex: 1;
        color: var(--el-text-color-primary);
        font-weight: 500;
      }

      .log-type,
      .log-result {
        flex: 0 0 auto;
      }
    }

    .log-content {
      font-size: 14px;

      .log-details {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .label {
          color: var(--el-text-color-secondary);
          margin-right: 8px;
          font-size: 13px;
        }

        .detail-content {
          white-space: pre-line;
          font-family: monospace;
          background-color: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
          max-height: 100px;
          overflow-y: auto;
          margin-top: 6px;
        }

        .log-message {
          color: var(--el-text-color-primary);
        }

        .log-ip {
          color: var(--el-text-color-secondary);
          font-size: 13px;
        }
      }
    }
  }
}
</style>
