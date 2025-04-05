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
          <el-option label="执行脚本" value="6" />
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
      <el-table v-loading="loading" :data="filteredLogs" style="width: 100%" border stripe max-height="650">
        <el-table-column type="expand">
          <template #default="props">
            <div class="log-detail">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="操作详情" :span="2">
                  <div class="detail-content">{{ formatDetails(props.row.operationDetails) }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="结果消息" :span="2">
                  {{ props.row.resultMessage || "无" }}
                </el-descriptions-item>
                <el-descriptions-item label="IP地址">
                  {{ props.row.ipAddress }}
                </el-descriptions-item>
                <el-descriptions-item label="操作对象">
                  <el-tag size="small" :type="getTargetTagType(props.row.targetType)">
                    {{ getTargetTypeDesc(props.row.targetType) }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="operationTime" label="操作时间" min-width="160" sortable>
          <template #default="scope">
            {{ formatTime(scope.row.operationTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="operationUser" label="操作用户" min-width="120" />
        <el-table-column prop="operationType" label="操作类型" min-width="120">
          <template #default="scope">
            <el-tag size="small" :type="getOperationTagType(scope.row.operationType)">
              {{ getOperationTypeDesc(scope.row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operationResult" label="结果" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.operationResult" type="success" size="small">成功</el-tag>
            <el-tag v-else type="danger" size="small">失败</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredLogs.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineExpose } from "vue";
import { getMaintenanceLogs } from "@/api/monitor/maintenance";
import { useRoute } from "vue-router";

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
    6: "执行脚本",
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

// 分页数据
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredLogs.value.slice(start, end);
});

// 获取日志列表
const fetchLogs = async () => {
  if (!props.groupId) return;

  loading.value = true;
  try {
    const res = await getMaintenanceLogs(props.groupId);
    if (res.code === 200 && res.data) {
      logs.value = res.data;
    } else {
      logs.value = [];
    }
  } catch (error) {
    console.error("获取维护日志失败:", error);
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理分页大小变化
const handleSizeChange = size => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 处理页码变化
const handleCurrentChange = page => {
  currentPage.value = page;
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
};

// 初始加载
onMounted(() => {
  fetchLogs();
});

// 暴露方法
defineExpose({
  fetchLogs
});
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
    overflow: auto;

    .el-table {
      width: 100%;

      :deep(.el-table__expanded-cell) {
        padding: 20px !important;
      }
    }

    .log-detail {
      padding: 0 10px;

      .detail-content {
        white-space: pre-line;
        font-family: monospace;
        background-color: #f8f9fa;
        padding: 8px;
        border-radius: 4px;
        max-height: 150px;
        overflow-y: auto;
      }
    }
  }

  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
}
</style>
