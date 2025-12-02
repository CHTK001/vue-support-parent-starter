<template>
  <div class="limit-configuration-container">
    <el-card class="limit-configuration-card">
      <template #header>
        <div class="card-header">
          <span>限流配置管理</span>
          <el-button
            type="primary"
            :icon="useRenderIcon('ep:plus')"
            @click="handleAdd"
          >
            新增配置
          </el-button>
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="接口路径">
          <el-input
            v-model="searchForm.sysLimitPath"
            placeholder="请输入接口路径"
            clearable
          />
        </el-form-item>
        <el-form-item label="规则名称">
          <el-input
            v-model="searchForm.sysLimitName"
            placeholder="请输入规则名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.sysLimitStatus"
            placeholder="请选择状态"
            clearable
          >
            <el-option label="全部" :value="null" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ep:search')"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button :icon="useRenderIcon('ep:refresh')" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        row-key="sysLimitConfigurationId"
      >
        <el-table-column prop="sysLimitName" label="规则名称" min-width="120" />
        <el-table-column prop="sysLimitPath" label="接口路径" min-width="150" />
        <el-table-column
          prop="sysLimitForPeriod"
          label="许可数量"
          min-width="100"
        />
        <el-table-column
          prop="sysLimitRefreshPeriodSeconds"
          label="刷新周期(秒)"
          min-width="120"
        />
        <el-table-column
          prop="sysLimitTimeoutDurationMillis"
          label="超时时间(毫秒)"
          min-width="120"
        />
        <el-table-column
          prop="sysLimitDimension"
          label="限流维度"
          min-width="100"
        />
        <el-table-column prop="sysLimitSort" label="排序" min-width="80" />
        <el-table-column label="状态" min-width="80">
          <template #default="scope">
            <el-tag
              :type="scope.row.sysLimitStatus === 1 ? 'success' : 'danger'"
            >
              {{ scope.row.sysLimitStatus === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="150" />
        <el-table-column label="操作" fixed="right" min-width="150">
          <template #default="scope">
            <el-button
              type="primary"
              link
              :icon="useRenderIcon('ep:edit')"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="规则名称" prop="sysLimitName">
          <el-input
            v-model="formData.sysLimitName"
            placeholder="请输入规则名称"
          />
        </el-form-item>
        <el-form-item label="接口路径" prop="sysLimitPath">
          <el-input
            v-model="formData.sysLimitPath"
            placeholder="请输入接口路径"
          />
        </el-form-item>
        <el-form-item label="许可数量" prop="sysLimitForPeriod">
          <el-input-number
            v-model="formData.sysLimitForPeriod"
            :min="1"
            :max="10000"
            placeholder="请输入许可数量"
          />
        </el-form-item>
        <el-form-item label="刷新周期(秒)" prop="sysLimitRefreshPeriodSeconds">
          <el-input-number
            v-model="formData.sysLimitRefreshPeriodSeconds"
            :min="1"
            :max="3600"
            placeholder="请输入刷新周期"
          />
        </el-form-item>
        <el-form-item
          label="超时时间(毫秒)"
          prop="sysLimitTimeoutDurationMillis"
        >
          <el-input-number
            v-model="formData.sysLimitTimeoutDurationMillis"
            :min="1"
            :max="60000"
            placeholder="请输入超时时间"
          />
        </el-form-item>
        <el-form-item label="限流维度" prop="sysLimitDimension">
          <el-select
            v-model="formData.sysLimitDimension"
            placeholder="请选择限流维度"
          >
            <el-option label="全局" value="GLOBAL" />
            <el-option label="IP" value="IP" />
            <el-option label="用户" value="USER" />
            <el-option label="接口" value="API" />
          </el-select>
        </el-form-item>
        <el-form-item label="自定义键表达式" prop="sysLimitKeyExpression">
          <el-input
            v-model="formData.sysLimitKeyExpression"
            type="textarea"
            placeholder="请输入自定义键表达式（SpEL）"
          />
        </el-form-item>
        <el-form-item label="降级方法名称" prop="sysLimitFallbackMethod">
          <el-input
            v-model="formData.sysLimitFallbackMethod"
            placeholder="请输入降级方法名称"
          />
        </el-form-item>
        <el-form-item label="错误消息" prop="sysLimitMessage">
          <el-input
            v-model="formData.sysLimitMessage"
            placeholder="请输入错误消息"
          />
        </el-form-item>
        <el-form-item label="描述信息" prop="sysLimitDescription">
          <el-input
            v-model="formData.sysLimitDescription"
            type="textarea"
            placeholder="请输入描述信息"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sysLimitSort">
          <el-input-number
            v-model="formData.sysLimitSort"
            :min="0"
            :max="999"
            placeholder="请输入排序"
          />
        </el-form-item>
        <el-form-item label="状态" prop="sysLimitStatus">
          <ScSwitch
            v-model="formData.sysLimitStatus"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
            layout="modern"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import {
  fetchLimitConfigurationPage,
  fetchLimitConfigurationList,
  saveLimitConfiguration,
  updateLimitConfiguration,
  deleteLimitConfiguration,
  type SysLimitConfiguration,
} from "../api/limit";

// 搜索表单
const searchForm = reactive({
  sysLimitPath: "",
  sysLimitName: "",
  sysLimitStatus: null,
});

// 表格数据
const tableData = ref<SysLimitConfiguration[]>([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 对话框
const dialogVisible = ref(false);
const dialogTitle = ref("");
const isEdit = ref(false);

// 表单
const formRef = ref<FormInstance>();
const formData = ref<SysLimitConfiguration>({
  sysLimitStatus: 1,
  sysLimitForPeriod: 10,
  sysLimitRefreshPeriodSeconds: 1,
  sysLimitTimeoutDurationMillis: 500,
  sysLimitSort: 0,
});

// 表单验证规则
const formRules = {
  sysLimitName: [
    { required: true, message: "请输入规则名称", trigger: "blur" },
  ],
  sysLimitPath: [
    { required: true, message: "请输入接口路径", trigger: "blur" },
  ],
  sysLimitForPeriod: [
    { required: true, message: "请输入许可数量", trigger: "blur" },
  ],
  sysLimitRefreshPeriodSeconds: [
    { required: true, message: "请输入刷新周期", trigger: "blur" },
  ],
  sysLimitTimeoutDurationMillis: [
    { required: true, message: "请输入超时时间", trigger: "blur" },
  ],
  sysLimitDimension: [
    { required: true, message: "请选择限流维度", trigger: "change" },
  ],
};

// 获取数据
const getData = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      current: pagination.currentPage,
      size: pagination.pageSize,
    };
    const res = await fetchLimitConfigurationPage(params);
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
  searchForm.sysLimitStatus = null;
  pagination.currentPage = 1;
  getData();
};

// 新增
const handleAdd = () => {
  dialogTitle.value = "新增限流配置";
  isEdit.value = false;
  formData.value = {
    sysLimitStatus: 1,
    sysLimitForPeriod: 10,
    sysLimitRefreshPeriodSeconds: 1,
    sysLimitTimeoutDurationMillis: 500,
    sysLimitSort: 0,
  };
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// 编辑
const handleEdit = (row: SysLimitConfiguration) => {
  dialogTitle.value = "编辑限流配置";
  isEdit.value = true;
  formData.value = { ...row };
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// 删除
const handleDelete = (row: SysLimitConfiguration) => {
  ElMessageBox.confirm("确定要删除该限流配置吗？", "提示", {
    type: "warning",
  })
    .then(async () => {
      try {
        const res = await deleteLimitConfiguration(
          row.sysLimitConfigurationId!
        );
        if (res.success) {
          ElMessage.success("删除成功");
          getData();
        } else {
          ElMessage.error(res.msg || "删除失败");
        }
      } catch (error) {
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {
      // 取消删除
    });
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res;
        if (isEdit.value) {
          res = await updateLimitConfiguration(formData.value);
        } else {
          res = await saveLimitConfiguration(formData.value);
        }

        if (res.success) {
          ElMessage.success(`${isEdit.value ? "更新" : "新增"}成功`);
          dialogVisible.value = false;
          getData();
        } else {
          ElMessage.error(res.msg || `${isEdit.value ? "更新" : "新增"}失败`);
        }
      } catch (error) {
        ElMessage.error(`${isEdit.value ? "更新" : "新增"}失败`);
      }
    }
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
.limit-configuration-container {
  padding: 24px;
  height: 100%;
  box-sizing: border-box;
  background-color: var(--el-bg-color);
  border-radius: 12px;
}

.limit-configuration-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  :deep(.el-card__header) {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.search-form {
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;

  :deep(.el-form-item) {
    margin-bottom: 0;
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

:deep(.el-button--link) {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 16px 20px;
    margin: 0;
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>
