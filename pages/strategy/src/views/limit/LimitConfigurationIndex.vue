<template>
  <div class="limit-configuration-container">
    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card class="search-card" shadow="never">
        <div class="search-container">
          <div class="search-left">
            <el-input
              v-model="searchForm.sysLimitName"
              placeholder="搜索限流规则名称"
              class="search-input"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <i class="ri-search-line"></i>
              </template>
            </el-input>
            <el-input
              v-model="searchForm.sysLimitPath"
              placeholder="搜索接口路径"
              class="path-input"
              clearable
              @input="handleSearch"
            />
            <el-select
              v-model="searchForm.sysLimitStatus"
              placeholder="状态"
              class="status-filter"
              clearable
              @change="handleSearch"
            >
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </div>
          <div class="search-right">
            <el-button type="primary" @click="handleAdd">
              <i class="ri-add-line"></i>
              新建配置
            </el-button>
            <el-button @click="handleRefresh">
              <i class="ri-refresh-line"></i>
              刷新
            </el-button>
            <el-button type="success" @click="handleRefreshConfig">
              <i class="ri-restart-line"></i>
              刷新配置
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 配置列表 -->
    <div class="list-section">
      <el-card shadow="never">
        <el-table
          v-loading="loading"
          :data="configList"
          row-key="sysLimitConfigurationId"
          stripe
          border
        >
          <el-table-column prop="sysLimitConfigurationId" label="ID" width="80" align="center" />
          <el-table-column prop="sysLimitName" label="规则名称" min-width="150">
            <template #default="{ row }">
              <div class="name-cell">
                <span class="name">{{ row.sysLimitName }}</span>
                <el-tag v-if="row.sysLimitDescription" size="small" type="info">
                  {{ row.sysLimitDescription }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sysLimitPath" label="接口路径" min-width="200">
            <template #default="{ row }">
              <el-tag type="warning" size="small">{{ row.sysLimitPath }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="限流配置" width="180">
            <template #default="{ row }">
              <div class="config-cell">
                <span>{{ row.sysLimitForPeriod }} 次/{{ row.sysLimitRefreshPeriodSeconds }}秒</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sysLimitDimension" label="限流维度" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getDimensionType(row.sysLimitDimension)" size="small">
                {{ getDimensionLabel(row.sysLimitDimension) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysLimitStatus" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.sysLimitStatus"
                :active-value="1"
                :inactive-value="0"
                @change="handleStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="170" />
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-button @click="handleEdit(row)">
                  <i class="ri-edit-line"></i>
                  编辑
                </el-button>
                <el-button type="danger" @click="handleDelete(row)">
                  <i class="ri-delete-bin-line"></i>
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSearch"
            @current-change="handleSearch"
          />
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑对话框 -->
    <sc-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规则名称" prop="sysLimitName">
              <el-input v-model="formData.sysLimitName" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接口路径" prop="sysLimitPath">
              <el-input v-model="formData.sysLimitPath" placeholder="如: /api/users/**" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="许可数量" prop="sysLimitForPeriod">
              <el-input-number v-model="formData.sysLimitForPeriod" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="刷新周期(秒)" prop="sysLimitRefreshPeriodSeconds">
              <el-input-number v-model="formData.sysLimitRefreshPeriodSeconds" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="超时时间(毫秒)">
              <el-input-number v-model="formData.sysLimitTimeoutDurationMillis" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="限流维度" prop="sysLimitDimension">
              <el-select v-model="formData.sysLimitDimension" placeholder="请选择限流维度" style="width: 100%">
                <el-option label="全局" value="GLOBAL" />
                <el-option label="IP" value="IP" />
                <el-option label="用户" value="USER" />
                <el-option label="接口" value="API" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="自定义键表达式">
              <el-input v-model="formData.sysLimitKeyExpression" placeholder="SpEL表达式" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="降级方法">
              <el-input v-model="formData.sysLimitFallbackMethod" placeholder="降级方法名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="formData.sysLimitSort" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="formData.sysLimitStatus" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="错误消息">
          <el-input v-model="formData.sysLimitMessage" placeholder="请输入限流错误提示消息" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.sysLimitDescription"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  fetchLimitConfigurationPageForStrategy,
  saveLimitConfigurationForStrategy,
  updateLimitConfigurationForStrategy,
  deleteLimitConfigurationForStrategy,
  refreshLimitConfigurationForStrategy,
  type SysLimitConfiguration,
  type LimitConfigurationQueryParams,
} from "../../api";

// 状态
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("新建限流配置");
const formRef = ref<FormInstance>();

// 搜索表单
const searchForm = reactive<LimitConfigurationQueryParams>({
  sysLimitName: "",
  sysLimitPath: "",
  sysLimitStatus: undefined,
});

// 分页
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

// 配置列表
const configList = ref<SysLimitConfiguration[]>([]);

// 当前编辑的配置
const currentConfig = ref<SysLimitConfiguration | null>(null);

// 表单数据
const formData = reactive<SysLimitConfiguration>({
  sysLimitName: "",
  sysLimitPath: "",
  sysLimitForPeriod: 100,
  sysLimitRefreshPeriodSeconds: 1,
  sysLimitTimeoutDurationMillis: 0,
  sysLimitDimension: "GLOBAL",
  sysLimitKeyExpression: "",
  sysLimitFallbackMethod: "",
  sysLimitMessage: "请求过于频繁，请稍后再试",
  sysLimitStatus: 1,
  sysLimitDescription: "",
  sysLimitSort: 0,
});

// 表单验证规则
const formRules: FormRules = {
  sysLimitName: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  sysLimitPath: [{ required: true, message: "请输入接口路径", trigger: "blur" }],
  sysLimitForPeriod: [{ required: true, message: "请输入许可数量", trigger: "blur" }],
  sysLimitRefreshPeriodSeconds: [{ required: true, message: "请输入刷新周期", trigger: "blur" }],
  sysLimitDimension: [{ required: true, message: "请选择限流维度", trigger: "change" }],
};

// 获取维度标签
const getDimensionLabel = (dimension: string | undefined): string => {
  const labels: Record<string, string> = {
    GLOBAL: "全局",
    IP: "IP",
    USER: "用户",
    API: "接口",
  };
  return labels[dimension || ""] || dimension || "-";
};

// 获取维度类型
const getDimensionType = (dimension: string | undefined): string => {
  const types: Record<string, string> = {
    GLOBAL: "danger",
    IP: "warning",
    USER: "success",
    API: "info",
  };
  return types[dimension || ""] || "info";
};

// 加载配置列表
const loadConfigList = async () => {
  loading.value = true;
  try {
    const response = await fetchLimitConfigurationPageForStrategy({
      ...searchForm,
      current: pagination.current,
      size: pagination.size,
    });
    if (response.success) {
      configList.value = response.data?.records || [];
      pagination.total = response.data?.total || 0;
    } else {
      ElMessage.error(response.msg || "加载配置列表失败");
    }
  } catch (error) {
    console.error("加载配置列表失败:", error);
    ElMessage.error("加载配置列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadConfigList();
};

// 刷新
const handleRefresh = () => {
  loadConfigList();
};

// 刷新配置（使配置生效）
const handleRefreshConfig = async () => {
  try {
    const response = await refreshLimitConfigurationForStrategy();
    if (response.success) {
      ElMessage.success("配置刷新成功");
    } else {
      ElMessage.error(response.msg || "配置刷新失败");
    }
  } catch (error) {
    console.error("配置刷新失败:", error);
    ElMessage.error("配置刷新失败");
  }
};

// 新增
const handleAdd = () => {
  dialogTitle.value = "新建限流配置";
  currentConfig.value = null;
  resetForm();
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: SysLimitConfiguration) => {
  dialogTitle.value = "编辑限流配置";
  currentConfig.value = row;
  Object.assign(formData, row);
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    sysLimitConfigurationId: undefined,
    sysLimitName: "",
    sysLimitPath: "",
    sysLimitForPeriod: 100,
    sysLimitRefreshPeriodSeconds: 1,
    sysLimitTimeoutDurationMillis: 0,
    sysLimitDimension: "GLOBAL",
    sysLimitKeyExpression: "",
    sysLimitFallbackMethod: "",
    sysLimitMessage: "请求过于频繁，请稍后再试",
    sysLimitStatus: 1,
    sysLimitDescription: "",
    sysLimitSort: 0,
  });
  formRef.value?.resetFields();
};

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  submitLoading.value = true;
  try {
    const api = currentConfig.value
      ? updateLimitConfigurationForStrategy
      : saveLimitConfigurationForStrategy;
    const data = currentConfig.value
      ? { ...formData, sysLimitConfigurationId: currentConfig.value.sysLimitConfigurationId }
      : formData;
    const response = await api(data);
    if (response.success) {
      ElMessage.success(currentConfig.value ? "修改成功" : "新增成功");
      dialogVisible.value = false;
      loadConfigList();
    } else {
      ElMessage.error(response.msg || "操作失败");
    }
  } catch (error) {
    console.error("操作失败:", error);
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};

// 删除
const handleDelete = async (row: SysLimitConfiguration) => {
  try {
    await ElMessageBox.confirm(`确定要删除配置"${row.sysLimitName}"吗？`, "删除确认", {
      type: "warning",
    });
    const response = await deleteLimitConfigurationForStrategy(row.sysLimitConfigurationId!);
    if (response.success) {
      ElMessage.success("删除成功");
      loadConfigList();
    } else {
      ElMessage.error(response.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 状态切换
const handleStatusChange = async (row: SysLimitConfiguration) => {
  try {
    const response = await updateLimitConfigurationForStrategy({
      sysLimitConfigurationId: row.sysLimitConfigurationId,
      sysLimitStatus: row.sysLimitStatus,
    });
    if (response.success) {
      ElMessage.success("状态更新成功");
    } else {
      // 恢复原状态
      row.sysLimitStatus = row.sysLimitStatus === 1 ? 0 : 1;
      ElMessage.error(response.msg || "状态更新失败");
    }
  } catch (error) {
    // 恢复原状态
    row.sysLimitStatus = row.sysLimitStatus === 1 ? 0 : 1;
    console.error("状态更新失败:", error);
    ElMessage.error("状态更新失败");
  }
};

// 生命周期
onMounted(() => {
  loadConfigList();
});

// 暴露方法
defineExpose({
  loadConfigList,
  handleRefresh,
});
</script>

<style lang="scss" scoped>
.limit-configuration-container {
  padding: 20px;

  .search-section {
    margin-bottom: 20px;

    .search-card {
      .search-container {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .search-left {
          display: flex;
          gap: 12px;

          .search-input {
            width: 200px;
          }

          .path-input {
            width: 200px;
          }

          .status-filter {
            width: 100px;
          }
        }

        .search-right {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .list-section {
    .name-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .name {
        font-weight: 500;
      }
    }

    .config-cell {
      font-size: 13px;
      color: #606266;
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}
</style>
