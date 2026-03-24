<template>
  <div class="limit-configuration-container system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:shield-check-line" class="title-icon" />
            限流配置管理
          </h1>
          <p class="page-subtitle">配置 API 接口的访问频率限制规则</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ pagination.total }}</span>
            <span class="stat-label">配置总数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{
              tableData.filter((i) => i.sysLimitStatus === 1).length
            }}</span>
            <span class="stat-label">已启用</span>
          </div>
        </div>
      </div>
    </div>

    <ScCard class="limit-configuration-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <ScInput 
            v-model="searchForm.sysLimitPath"
            placeholder="接口路径"
            clearable
            style="width: 180px"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:links-line" />
            </template>
          </ScInput>
          <ScInput 
            v-model="searchForm.sysLimitName"
            placeholder="规则名称"
            clearable
            style="width: 160px"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:text" />
            </template>
          </ScInput>
          <ScSelect 
            v-model="searchForm.sysLimitStatus"
            placeholder="状态"
            clearable
            style="width: 120px"
          >
            <ScOption label="全部" :value="null" />
            <ScOption label="启用" :value="1" />
            <ScOption label="禁用" :value="0" />
          </ScSelect>
        </div>
        <div class="toolbar-right">
          <ScButton @click="handleReset">
            <IconifyIconOnline icon="ri:refresh-line" />
            重置
          </ScButton>
          <ScButton type="primary" @click="handleSearch">
            <IconifyIconOnline icon="ri:search-line" />
            查询
          </ScButton>
          <ScButton type="success" @click="handleAdd">
            <IconifyIconOnline icon="ri:add-line" />
            新增配置
          </ScButton>
        </div>
      </div>

      <ScForm 
        :model="searchForm"
        :inline="true"
        class="search-form"
        style="display: none"
      >
        <ScFormItem label="接口路径">
          <ScInput 
            v-model="searchForm.sysLimitPath"
            placeholder="请输入接口路径"
            clearable
          />
        </ScFormItem>
        <ScFormItem label="规则名称">
          <ScInput 
            v-model="searchForm.sysLimitName"
            placeholder="请输入规则名称"
            clearable
          />
        </ScFormItem>
        <ScFormItem label="状态">
          <ScSelect 
            v-model="searchForm.sysLimitStatus"
            placeholder="请选择状态"
            clearable
          >
            <ScOption label="全部" :value="null" />
            <ScOption label="启用" :value="1" />
            <ScOption label="禁用" :value="0" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem>
          <ScButton 
            type="primary"
            :icon="useRenderIcon('ep:search')"
            @click="handleSearch"
          >
            查询
          </ScButton>
          <ScButton :icon="useRenderIcon('ep:refresh')" @click="handleReset">
            重置
          </ScButton>
        </ScFormItem>
      </ScForm>

      <ScTable 
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        row-key="sysLimitConfigurationId"
      >
        <ScTableColumn prop="sysLimitName" label="规则名称" min-width="120" />
        <ScTableColumn prop="sysLimitPath" label="接口路径" min-width="150" />
        <ScTableColumn 
          prop="sysLimitForPeriod"
          label="许可数量"
          min-width="100"
        />
        <ScTableColumn 
          prop="sysLimitRefreshPeriodSeconds"
          label="刷新周期(秒)"
          min-width="120"
        />
        <ScTableColumn 
          prop="sysLimitTimeoutDurationMillis"
          label="超时时间(毫秒)"
          min-width="120"
        />
        <ScTableColumn 
          prop="sysLimitDimension"
          label="限流维度"
          min-width="100"
        />
        <ScTableColumn prop="sysLimitSort" label="排序" min-width="80" />
        <ScTableColumn label="状态" min-width="80">
          <template #default="scope">
            <ScTag 
              :type="scope.row.sysLimitStatus === 1 ? 'success' : 'danger'"
            >
              {{ scope.row.sysLimitStatus === 1 ? "启用" : "禁用" }}
            </ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="createTime" label="创建时间" min-width="150" />
        <ScTableColumn label="操作" fixed="right" min-width="150">
          <template #default="scope">
            <ScButton 
              type="primary"
              link
              :icon="useRenderIcon('ep:edit')"
              @click="handleEdit(scope.row)"
            >
              编辑
            </ScButton>
            <ScButton 
              type="danger"
              link
              :icon="useRenderIcon('ep:delete')"
              @click="handleDelete(scope.row)"
            >
              删除
            </ScButton>
          </template>
        </ScTableColumn>
      </ScTable>

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
    </ScCard>

    <!-- 新增/编辑对话框 -->
    <sc-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <ScForm 
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="right"
      >
        <ScFormItem label="规则名称" prop="sysLimitName">
          <ScInput 
            v-model="formData.sysLimitName"
            placeholder="请输入规则名称"
          />
        </ScFormItem>
        <ScFormItem label="接口路径" prop="sysLimitPath">
          <ScInput 
            v-model="formData.sysLimitPath"
            placeholder="请输入接口路径"
          />
        </ScFormItem>
        <ScFormItem label="许可数量" prop="sysLimitForPeriod">
          <ScInputNumber 
            v-model="formData.sysLimitForPeriod"
            :min="1"
            :max="10000"
            placeholder="请输入许可数量"
          />
        </ScFormItem>
        <ScFormItem label="刷新周期(秒)" prop="sysLimitRefreshPeriodSeconds">
          <ScInputNumber 
            v-model="formData.sysLimitRefreshPeriodSeconds"
            :min="1"
            :max="3600"
            placeholder="请输入刷新周期"
          />
        </ScFormItem>
        <ScFormItem 
          label="超时时间(毫秒)"
          prop="sysLimitTimeoutDurationMillis"
        >
          <ScInputNumber 
            v-model="formData.sysLimitTimeoutDurationMillis"
            :min="1"
            :max="60000"
            placeholder="请输入超时时间"
          />
        </ScFormItem>
        <ScFormItem label="限流维度" prop="sysLimitDimension">
          <ScSelect 
            v-model="formData.sysLimitDimension"
            placeholder="请选择限流维度"
          >
            <ScOption label="全局" value="GLOBAL" />
            <ScOption label="IP" value="IP" />
            <ScOption label="用户" value="USER" />
            <ScOption label="接口" value="API" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="自定义键表达式" prop="sysLimitKeyExpression">
          <ScInput 
            v-model="formData.sysLimitKeyExpression"
            type="textarea"
            placeholder="请输入自定义键表达式（SpEL）"
          />
        </ScFormItem>
        <ScFormItem label="降级方法名称" prop="sysLimitFallbackMethod">
          <ScInput 
            v-model="formData.sysLimitFallbackMethod"
            placeholder="请输入降级方法名称"
          />
        </ScFormItem>
        <ScFormItem label="错误消息" prop="sysLimitMessage">
          <ScInput 
            v-model="formData.sysLimitMessage"
            placeholder="请输入错误消息"
          />
        </ScFormItem>
        <ScFormItem label="描述信息" prop="sysLimitDescription">
          <ScInput 
            v-model="formData.sysLimitDescription"
            type="textarea"
            placeholder="请输入描述信息"
          />
        </ScFormItem>
        <ScFormItem label="排序" prop="sysLimitSort">
          <ScInputNumber 
            v-model="formData.sysLimitSort"
            :min="0"
            :max="999"
            placeholder="请输入排序"
          />
        </ScFormItem>
        <ScFormItem label="状态" prop="sysLimitStatus">
          <ScSwitch
            v-model="formData.sysLimitStatus"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
            layout="modern"
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <span class="dialog-footer">
          <ScButton @click="dialogVisible = false">取消</ScButton>
          <ScButton type="primary" @click="handleSubmit">确定</ScButton>
        </span>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { message, ScMessageBox, type FormInstance } from "@repo/utils";
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
  ScMessageBox.confirm("确定要删除该限流配置吗？", "提示", {
    type: "warning",
  })
    .then(async () => {
      try {
        const res = await deleteLimitConfiguration(
          row.sysLimitConfigurationId!
        );
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
          message(`${isEdit.value ? "更新" : "新增"}成功`, { type: "success" });
          dialogVisible.value = false;
          getData();
        } else {
          message(res.msg || `${isEdit.value ? "更新" : "新增"}失败`, { type: "error" });
        }
      } catch (error) {
        message(`${isEdit.value ? "更新" : "新增"}失败`, { type: "error" });
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
  padding: clamp(20px, 3vw, 32px);
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 2vw, 24px);
  min-height: 100%;
}

.page-header {
  background: linear-gradient(
    135deg,
    rgba(64, 158, 255, 0.12),
    rgba(64, 158, 255, 0.06)
  );
  padding: clamp(20px, 3vw, 28px);
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 70%, transparent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(8px);

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
        color: var(--el-color-primary);
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
        color: var(--el-color-primary);
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

.limit-configuration-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 95%, transparent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 60%, transparent);
  overflow: hidden;
  backdrop-filter: blur(8px);

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
