<template>
  <div class="skywalking-config">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon :size="28"><Setting /></el-icon>
        </div>
        <div class="header-text">
          <h2>配置管理</h2>
          <p>管理 SkyWalking 服务器连接配置</p>
        </div>
      </div>
      <div class="header-actions">
        <el-input v-model="searchForm.name" placeholder="配置名称" clearable style="width: 160px" />
        <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        <el-button type="success" :icon="Plus" @click="handleAdd">新增配置</el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <ScTable
        ref="tableRef"
        :url="getSkywalkingConfigPage"
        :params="searchParams"
        row-key="skywalkingConfigId"
        border
        stripe
        height="100%"
      >
        <el-table-column prop="skywalkingConfigName" label="配置名称" min-width="150" />
        <el-table-column prop="skywalkingConfigHost" label="服务地址" min-width="150" />
        <el-table-column prop="skywalkingConfigPort" label="端口" width="100" />
        <el-table-column label="HTTPS" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.skywalkingConfigUseHttps === 1 ? 'success' : 'info'" size="small">
              {{ row.skywalkingConfigUseHttps === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.skywalkingConfigStatus"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="skywalkingConfigDesc" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleTest(row)">测试</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该配置吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <sc-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="850px" 
      destroy-on-close
      :icon="formData.skywalkingConfigId ? 'ri:edit-line' : 'ri:add-line'"
      icon-mode="inline"
      :show-footer="false"
    >
      <div class="config-form-wrapper">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px" class="config-form">
          <!-- 基本信息 -->
          <div class="form-section">
            <div class="section-header">
              <IconifyIconOnline icon="ri:information-line" class="section-icon" />
              <span>基本信息</span>
            </div>
            <div class="section-content">
              <el-form-item label="配置名称" prop="skywalkingConfigName">
                <el-input 
                  v-model="formData.skywalkingConfigName" 
                  placeholder="请输入配置名称"
                  :prefix-icon="useRenderIcon('ri:bookmark-line')"
                />
              </el-form-item>
              <el-form-item label="描述">
                <el-input 
                  v-model="formData.skywalkingConfigDesc" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="请输入配置描述（可选）" 
                />
              </el-form-item>
            </div>
          </div>

          <!-- 连接配置 -->
          <div class="form-section">
            <div class="section-header">
              <IconifyIconOnline icon="ri:link" class="section-icon" />
              <span>连接配置</span>
            </div>
            <div class="section-content">
              <el-row :gutter="16">
                <el-col :span="16">
                  <el-form-item label="服务地址" prop="skywalkingConfigHost">
                    <el-input 
                      v-model="formData.skywalkingConfigHost" 
                      placeholder="如: localhost 或 192.168.1.100"
                      :prefix-icon="useRenderIcon('ri:server-line')"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="端口" prop="skywalkingConfigPort">
                    <el-input-number 
                      v-model="formData.skywalkingConfigPort" 
                      :min="1" 
                      :max="65535" 
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="启用 HTTPS">
                <div class="switch-wrapper">
                  <el-switch 
                    v-model="formData.skywalkingConfigUseHttps" 
                    :active-value="1" 
                    :inactive-value="0"
                    active-text="是"
                    inactive-text="否"
                  />
                  <span class="switch-hint">如果 SkyWalking 服务启用了 HTTPS，请开启此选项</span>
                </div>
              </el-form-item>
            </div>
          </div>

          <!-- 认证配置 -->
          <div class="form-section">
            <div class="section-header">
              <IconifyIconOnline icon="ri:shield-keyhole-line" class="section-icon" />
              <span>认证配置</span>
              <el-tag type="info" size="small" class="optional-tag">可选</el-tag>
            </div>
            <div class="section-content">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="用户名">
                    <el-input 
                      v-model="formData.skywalkingConfigUsername" 
                      placeholder="请输入用户名"
                      :prefix-icon="useRenderIcon('ri:user-line')"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="密码">
                    <el-input 
                      v-model="formData.skywalkingConfigPassword" 
                      type="password" 
                      placeholder="请输入密码" 
                      show-password
                      :prefix-icon="useRenderIcon('ri:lock-line')"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 状态配置 -->
          <div class="form-section">
            <div class="section-header">
              <IconifyIconOnline icon="ri:toggle-line" class="section-icon" />
              <span>状态配置</span>
            </div>
            <div class="section-content">
              <el-form-item label="启用状态">
                <div class="switch-wrapper">
                  <el-switch 
                    v-model="formData.skywalkingConfigStatus" 
                    :active-value="1" 
                    :inactive-value="0"
                    active-text="启用"
                    inactive-text="禁用"
                    inline-prompt
                    style="--el-switch-on-color: var(--el-color-success); --el-switch-off-color: var(--el-color-danger)"
                  />
                  <span class="switch-hint">禁用后该配置将不会被使用</span>
                </div>
              </el-form-item>
            </div>
          </div>
        </el-form>

        <!-- 底部操作按钮 -->
        <div class="form-actions">
          <el-button @click="dialogVisible = false">
            <IconifyIconOnline icon="ri:close-line" />
            取消
          </el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            <IconifyIconOnline icon="ri:check-line" />
            {{ formData.skywalkingConfigId ? '更新配置' : '创建配置' }}
          </el-button>
        </div>
      </div>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { Search, RefreshRight, Plus, Setting } from "@element-plus/icons-vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import {
  getSkywalkingConfigPage,
  saveSkywalkingConfig,
  updateSkywalkingConfig,
  deleteSkywalkingConfig,
  testSkywalkingConnection,
  toggleSkywalkingConfigStatus,
  type SkywalkingConfig,
} from "@/api/skywalking/config";

defineOptions({ name: "SkywalkingConfig" });

// 表格引用
const tableRef = ref();

// 搜索表单
const searchForm = reactive({
  name: "",
  status: undefined as number | undefined,
});

// 搜索参数
const searchParams = computed(() => ({
  name: searchForm.name || undefined,
  status: searchForm.status,
}));

// 弹窗相关
const dialogVisible = ref(false);
const dialogTitle = ref("新增配置");
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive<SkywalkingConfig>({
  skywalkingConfigName: "",
  skywalkingConfigHost: "",
  skywalkingConfigPort: 12800,
  skywalkingConfigUsername: "",
  skywalkingConfigPassword: "",
  skywalkingConfigStatus: 1,
  skywalkingConfigDesc: "",
  skywalkingConfigUseHttps: 0,
});

// 表单验证规则
const rules: FormRules = {
  skywalkingConfigName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  skywalkingConfigHost: [{ required: true, message: "请输入服务地址", trigger: "blur" }],
  skywalkingConfigPort: [{ required: true, message: "请输入端口", trigger: "blur" }],
};

// 搜索
const handleSearch = () => {
  tableRef.value?.refresh();
};

// 重置
const handleReset = () => {
  searchForm.name = "";
  searchForm.status = undefined;
  tableRef.value?.refresh();
};

// 新增
const handleAdd = () => {
  dialogTitle.value = "新增配置";
  Object.assign(formData, {
    skywalkingConfigId: undefined,
    skywalkingConfigName: "",
    skywalkingConfigHost: "",
    skywalkingConfigPort: 12800,
    skywalkingConfigUsername: "",
    skywalkingConfigPassword: "",
    skywalkingConfigStatus: 1,
    skywalkingConfigDesc: "",
    skywalkingConfigUseHttps: 0,
  });
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: SkywalkingConfig) => {
  dialogTitle.value = "编辑配置";
  Object.assign(formData, { ...row });
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  submitLoading.value = true;
  try {
    const api = formData.skywalkingConfigId ? updateSkywalkingConfig : saveSkywalkingConfig;
    const res = await api(formData);
    if (res.code === "00000") {
      ElMessage.success(formData.skywalkingConfigId ? "更新成功" : "新增成功");
      dialogVisible.value = false;
      tableRef.value?.refresh();
    } else {
      ElMessage.error(res.msg || "操作失败");
    }
  } finally {
    submitLoading.value = false;
  }
};

// 删除
const handleDelete = async (row: SkywalkingConfig) => {
  const res = await deleteSkywalkingConfig(row.skywalkingConfigId!);
  if (res.code === "00000") {
    ElMessage.success("删除成功");
    tableRef.value?.refresh();
  } else {
    ElMessage.error(res.msg || "删除失败");
  }
};

// 测试连接
const handleTest = async (row: SkywalkingConfig) => {
  ElMessage.info("正在测试连接...");
  const res = await testSkywalkingConnection(row);
  if (res.code === "00000" && res.data) {
    ElMessage.success("连接成功");
  } else {
    ElMessage.error(res.msg || "连接失败");
  }
};

// 切换状态
const handleToggleStatus = async (row: SkywalkingConfig) => {
  const res = await toggleSkywalkingConfigStatus(row.skywalkingConfigId!);
  if (res.code === "00000") {
    ElMessage.success("状态更新成功");
  } else {
    ElMessage.error(res.msg || "状态更新失败");
    // 还原状态
    row.skywalkingConfigStatus = row.skywalkingConfigStatus === 1 ? 0 : 1;
  }
};

</script>

<style scoped lang="scss">
.skywalking-config {
  padding: 20px;
  height: 100%;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 24px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
        border-radius: 10px;
        color: #fff;
      }

      .header-text {
        h2 {
          margin: 0 0 2px;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
        p {
          margin: 0;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      :deep(.el-select),
      :deep(.el-input) {
        .el-input__wrapper {
          background: var(--el-fill-color-blank);
          border: 1px solid var(--el-border-color-lighter);
          box-shadow: none;
        }
      }

      :deep(.el-button) {
        border: 1px solid var(--el-border-color-lighter);
        box-shadow: none;
      }
    }
  }

  .table-card {
    flex: 1;
    overflow: hidden;
    min-height: 0;
    border-radius: 16px;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

    :deep(.el-card__body) {
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
    }

    :deep(.el-table) {
      border-radius: 8px;
    }
  }
}

/* 配置表单样式 */
.config-form-wrapper {
  padding: 8px 0;
}

.config-form {
  .form-section {
    margin-bottom: 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
    overflow: hidden;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-light) 100%);
    border-bottom: 1px solid var(--el-border-color-lighter);
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);

    .section-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }

    .optional-tag {
      margin-left: auto;
    }
  }

  .section-content {
    padding: 16px;

    :deep(.el-form-item) {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
    }
  }
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;

  .switch-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 20px;

  .el-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 8px;
  }
}
</style>
