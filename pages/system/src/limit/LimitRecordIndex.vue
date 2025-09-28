<template>
  <div class="limit-record-container">
    <el-card class="limit-record-card">
      <template #header>
        <div class="card-header">
          <span>限流记录管理</span>
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="接口路径">
          <el-input v-model="searchForm.sysLimitPath" placeholder="请输入接口路径" clearable />
        </el-form-item>
        <el-form-item label="规则名称">
          <el-input v-model="searchForm.sysLimitName" placeholder="请输入规则名称" clearable />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.sysUserId" placeholder="请输入用户ID" clearable />
        </el-form-item>
        <el-form-item label="客户端IP">
          <el-input v-model="searchForm.clientIp" placeholder="请输入客户端IP" clearable />
        </el-form-item>
        <el-form-item label="限流时间">
          <el-date-picker
            v-model="searchForm.sysLimitTime"
            type="date"
            placeholder="请选择限流时间"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="useRenderIcon('ep:refresh')" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button
          type="danger"
          :icon="useRenderIcon('ep:delete')"
          @click="handleBatchDelete"
          :disabled="selectedRows.length === 0"
        >
          批量删除
        </el-button>
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
        <el-table-column prop="sysLimitDimension" label="限流维度" min-width="100" />
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
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import {
  fetchLimitRecordPage,
  deleteLimitRecord,
  deleteBatchLimitRecord,
  type SysLimitRecord
} from "../api/limitRecord";

// 搜索表单
const searchForm = reactive({
  sysLimitPath: "",
  sysLimitName: "",
  sysUserId: undefined,
  clientIp: "",
  sysLimitTime: ""
});

// 表格数据
const tableData = ref<SysLimitRecord[]>([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
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
      size: pagination.pageSize
    };
    const res = await fetchLimitRecordPage(params);
    if (res.success) {
      tableData.value = res.data.records;
      pagination.total = res.data.total;
    } else {
      ElMessage.error(res.msg || "获取数据失败");
    }
  } catch (error) {
    ElMessage.error("获取数据失败");
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
    type: "warning"
  }).then(async () => {
    try {
      const res = await deleteLimitRecord(row.sysLimitRecordId!);
      if (res.success) {
        ElMessage.success("删除成功");
        getData();
      } else {
        ElMessage.error(res.msg || "删除失败");
      }
    } catch (error) {
      ElMessage.error("删除失败");
    }
  }).catch(() => {
    // 取消删除
  });
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择要删除的记录");
    return;
  }

  ElMessageBox.confirm(`确定要删除选中的${selectedRows.value.length}条限流记录吗？`, "提示", {
    type: "warning"
  }).then(async () => {
    try {
      const ids = selectedRows.value.map(item => item.sysLimitRecordId!);
      const res = await deleteBatchLimitRecord(ids);
      if (res.success) {
        ElMessage.success("批量删除成功");
        getData();
      } else {
        ElMessage.error(res.msg || "批量删除失败");
      }
    } catch (error) {
      ElMessage.error("批量删除失败");
    }
  }).catch(() => {
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
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.limit-record-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>