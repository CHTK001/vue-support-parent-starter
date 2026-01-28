<template>
  <div class="limit-record-container system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:history-line" class="title-icon" />
            限流记录管理
          </h1>
          <p class="page-subtitle">查看和管理 API 接口的限流触发记录</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ pagination.total }}</span>
            <span class="stat-label">记录总数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ selectedRows.length }}</span>
            <span class="stat-label">已选择</span>
          </div>
        </div>
      </div>
    </div>

    <el-card class="limit-record-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchForm.sysLimitPath"
            placeholder="接口路径"
            clearable
            style="width: 160px"
          >
            <template #prefix
              ><IconifyIconOnline icon="ri:links-line"
            /></template>
          </el-input>
          <el-input
            v-model="searchForm.sysLimitName"
            placeholder="规则名称"
            clearable
            style="width: 140px"
          >
            <template #prefix><IconifyIconOnline icon="ri:text" /></template>
          </el-input>
          <el-input
            v-model="searchForm.clientIp"
            placeholder="客户端IP"
            clearable
            style="width: 140px"
          >
            <template #prefix
              ><IconifyIconOnline icon="ri:computer-line"
            /></template>
          </el-input>
          <el-date-picker
            v-model="searchForm.sysLimitTime"
            type="date"
            placeholder="限流时间"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 150px"
          />
        </div>
        <div class="toolbar-right">
          <el-button @click="handleReset">
            <IconifyIconOnline icon="ri:refresh-line" />
            重置
          </el-button>
          <el-button type="primary" @click="handleSearch">
            <IconifyIconOnline icon="ri:search-line" />
            查询
          </el-button>
          <el-button
            type="danger"
            @click="handleBatchDelete"
            :disabled="selectedRows.length === 0"
          >
            <IconifyIconOnline icon="ri:delete-bin-line" />
            批量删除
          </el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        row-key="sysLimitRecordId"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="sysLimitName" label="规则名称" min-width="120" />
        <el-table-column prop="sysLimitPath" label="接口路径" min-width="150" />
        <el-table-column
          prop="sysLimitDimension"
          label="限流维度"
          min-width="100"
        />
        <el-table-column prop="sysLimitKey" label="限流键值" min-width="120" />
        <el-table-column prop="sysUserName" label="用户名" min-width="100" />
        <el-table-column prop="clientIp" label="客户端IP" min-width="120" />
        <el-table-column prop="requestMethod" label="请求方法" min-width="80" />
        <el-table-column prop="sysLimitTime" label="限流时间" min-width="150" />
        <el-table-column label="操作" fixed="right" min-width="100">
          <template #default="scope">
            <el-button
              type="danger"
              link
              :icon="useRenderIcon('ep:delete')"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import {
  fetchLimitRecordPage,
  deleteLimitRecord,
  deleteBatchLimitRecord,
  type SysLimitRecord,
} from "../api/limitRecord";

// 搜索表单
const searchForm = reactive({
  sysLimitPath: "",
  sysLimitName: "",
  sysUserId: undefined,
  clientIp: "",
  sysLimitTime: "",
});

// 表格数据
const tableData = ref<SysLimitRecord[]>([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 选中的行
const selectedRows = ref<SysLimitRecord[]>([]);

// 获取数据
const getData = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      current: pagination.currentPage,
      size: pagination.pageSize,
    };
    const res = await fetchLimitRecordPage(params);
    if (res.success) {
      tableData.value = res.data.records;
      pagination.total = res.data.total;
    } else {
      message(res.msg || "获取数据失败", { type: "error" });
    }
  } catch (error) {
    message("获取数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getData();
};

// 重置
const handleReset = () => {
  searchForm.sysLimitPath = "";
  searchForm.sysLimitName = "";
  searchForm.sysUserId = undefined;
  searchForm.clientIp = "";
  searchForm.sysLimitTime = "";
  pagination.currentPage = 1;
  getData();
};

// 选中行变化
const handleSelectionChange = (rows: SysLimitRecord[]) => {
  selectedRows.value = rows;
};

// 删除
const handleDelete = (row: SysLimitRecord) => {
  ElMessageBox.confirm("确定要删除该限流记录吗？", "提示", {
    type: "warning",
  })
    .then(async () => {
      try {
        const res = await deleteLimitRecord(row.sysLimitRecordId!);
        if (res.success) {
          message("删除成功", { type: "success" });
          getData();
        } else {
          message(res.msg || "删除失败", { type: "error" });
        }
      } catch (error) {
        message("删除失败", { type: "error" });
      }
    })
    .catch(() => {
      // 取消删除
    });
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    message("请先选择要删除的记录", { type: "warning" });
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的${selectedRows.value.length}条限流记录吗？`,
    "提示",
    {
      type: "warning",
    }
  )
    .then(async () => {
      try {
        const ids = selectedRows.value.map((item) => item.sysLimitRecordId!);
        const res = await deleteBatchLimitRecord(ids);
        if (res.success) {
          message("批量删除成功", { type: "success" });
          getData();
        } else {
          message(res.msg || "批量删除失败", { type: "error" });
        }
      } catch (error) {
        message("批量删除失败", { type: "error" });
      }
    })
    .catch(() => {
      // 取消删除
    });
};

// 分页变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  getData();
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  getData();
};

// 初始化
onMounted(() => {
  getData();
});
</script>

<style scoped lang="scss">
.limit-record-container {
  padding: 0;
  height: 100%;
  box-sizing: border-box;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-danger-light-9) 0%,
    var(--el-color-warning-light-9) 100%
  );
  padding: 24px 32px;
  border-radius: 8px;
  margin: 16px 16px 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-section {
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .title-icon {
        font-size: 28px;
        color: var(--el-color-danger);
      }
    }

    .page-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .header-stats {
    display: flex;
    gap: 32px;

    .stat-item {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 28px;
        font-weight: 700;
        color: var(--el-color-danger);
      }

      .stat-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.limit-record-card {
  flex: 1;
  margin: 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);

  :deep(.el-card__body) {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;

  th {
    background-color: var(--el-fill-color-light) !important;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .el-table__row {
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-color-primary-light-9) !important;
    }
  }
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
