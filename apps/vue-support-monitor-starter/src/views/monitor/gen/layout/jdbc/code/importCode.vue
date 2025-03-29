<template>
  <el-dialog v-model="dialogStatus" title="代码导出向导" :close-on-click-modal="false" width="70%" destroy-on-close draggable class="import-code-dialog" @closed="$emit('closed')">
    <!-- 步骤导航 -->
    <div class="import-code-header">
      <IconifyIconOnline icon="ri:code-box-line" class="import-code-header__icon" />
      <span class="import-code-header__title">代码生成配置</span>
    </div>

    <el-steps :active="active" align-center class="import-code-steps" finish-status="success">
      <el-step>
        <template #title>
          <span class="import-code-step__title">填写基本信息</span>
        </template>
        <template #icon>
          <IconifyIconOnline icon="ri:file-info-line" class="import-code-step__icon" />
        </template>
      </el-step>
      <el-step>
        <template #title>
          <span class="import-code-step__title">确认信息</span>
        </template>
        <template #icon>
          <IconifyIconOnline icon="ri:check-double-line" class="import-code-step__icon" />
        </template>
      </el-step>
      <el-step>
        <template #title>
          <span class="import-code-step__title">完成</span>
        </template>
        <template #icon>
          <IconifyIconOnline icon="ri:check-line" class="import-code-step__icon" />
        </template>
      </el-step>
    </el-steps>

    <div class="import-code-content">
      <!-- 步骤1：基本信息表单 -->
      <el-form v-if="active === 0" ref="stepForm_0" :model="downloadForm" :rules="rules" label-width="120px" class="import-code-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="import-code-form__section">
              <div class="import-code-form__header">
                <IconifyIconOnline icon="ri:information-line" class="import-code-form__icon" />
                <span class="import-code-form__title">基础信息</span>
              </div>

              <el-form-item label="包名" prop="packageName">
                <el-input v-model="downloadForm.packageName" clearable placeholder="请输入Java包名">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:folder-line" />
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="作者" prop="author">
                <el-input v-model="downloadForm.author" clearable placeholder="请输入作者名称">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:user-line" />
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item v-if="downloadForm.tableNames && downloadForm.tableNames.length === 1" label="功能名称" prop="functionName">
                <el-input v-model="downloadForm.functionName" clearable placeholder="请输入功能名称">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:function-line" />
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="模块名称" prop="moduleName">
                <el-input v-model="downloadForm.moduleName" clearable placeholder="请输入模块名称">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:apps-line" />
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="版本" prop="version">
                <el-input v-model="downloadForm.version" clearable placeholder="请输入版本号">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:git-branch-line" />
                  </template>
                </el-input>
                <div class="import-code-form__help">用于连接上区分版本/version/xxxx</div>
              </el-form-item>
            </div>
          </el-col>

          <el-col :span="12">
            <div class="import-code-form__section">
              <div class="import-code-form__header">
                <IconifyIconOnline icon="ri:settings-line" class="import-code-form__icon" />
                <span class="import-code-form__title">基础功能</span>
              </div>

              <el-form-item label="swagger注释" prop="openSwagger">
                <el-switch v-model="downloadForm.openSwagger" active-text="启用" inactive-text="禁用" class="import-code-switch" />
              </el-form-item>

              <!-- 可以在这里添加更多配置选项 -->
            </div>
          </el-col>
        </el-row>
      </el-form>

      <!-- 步骤2：确认信息 -->
      <div v-if="active === 1" class="import-code-confirm">
        <el-form ref="stepForm_1" :model="downloadForm" :rules="rules" label-position="top">
          <div class="import-code-confirm__header">
            <IconifyIconOnline icon="ri:alert-line" class="import-code-confirm__icon" />
            <span class="import-code-confirm__title">请确认以下信息无误</span>
          </div>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-card class="import-code-confirm__card" shadow="hover">
                <template #header>
                  <div class="import-code-confirm__card-header">
                    <IconifyIconOnline icon="ri:information-line" />
                    <span>基本配置信息</span>
                  </div>
                </template>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="包名">
                    <el-tag size="small">{{ downloadForm.packageName }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="作者">
                    <el-tag size="small" type="success">{{ downloadForm.author }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="downloadForm.moduleName" label="模块名称">
                    <el-tag size="small" type="warning">{{ downloadForm.moduleName }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="downloadForm.version" label="版本">
                    <el-tag size="small" type="info">{{ downloadForm.version }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="Swagger">
                    <el-tag size="small" :type="downloadForm.openSwagger ? 'success' : 'danger'">
                      {{ downloadForm.openSwagger ? "启用" : "禁用" }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-card class="import-code-confirm__card" shadow="hover">
                <template #header>
                  <div class="import-code-confirm__card-header">
                    <IconifyIconOnline icon="ri:table-line" />
                    <span>选中的数据表</span>
                  </div>
                </template>
                <el-scrollbar height="200px">
                  <div v-for="(table, index) in downloadForm.tableNames" :key="index" class="import-code-confirm__table">
                    <IconifyIconOnline icon="ri:table-2" class="import-code-confirm__table-icon" />
                    <span>{{ table }}</span>
                  </div>
                  <el-empty v-if="!downloadForm.tableNames || downloadForm.tableNames.length === 0" description="未选择数据表" />
                </el-scrollbar>
              </el-card>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 步骤3：完成 -->
      <div v-if="active === 2" class="import-code-result">
        <el-result icon="success" title="操作成功" sub-title="代码已成功导出，您可以下载并使用">
          <template #icon>
            <IconifyIconOnline icon="ri:checkbox-circle-line" class="import-code-result__icon" />
          </template>
          <template #extra>
            <el-button type="primary" @click="again">
              <IconifyIconOnline icon="ri:restart-line" class="import-code-button__icon" />
              再次下载
            </el-button>
          </template>
        </el-result>
      </div>
    </div>

    <!-- 底部按钮区域 -->
    <div class="import-code-footer">
      <el-button v-if="active > 0 && active < 2" :disabled="submitLoading" @click="pre">
        <IconifyIconOnline icon="ri:arrow-left-line" class="import-code-button__icon" />
        上一步
      </el-button>

      <el-button v-if="active < 1" type="primary" @click="next">
        下一步
        <IconifyIconOnline icon="ri:arrow-right-line" class="import-code-button__icon" />
      </el-button>

      <el-button v-if="active === 1" type="primary" :loading="submitLoading" @click="submit">
        <IconifyIconOnline icon="ri:download-cloud-line" class="import-code-button__icon" />
        导出代码
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { fetchGenTableGenCode } from "@/api/monitor/gen/table";
import { downLoadZip } from "@repo/utils";
import { ref, reactive, defineEmits, defineExpose } from "vue";

// 定义组件事件
defineEmits(["closed"]);

// 组件状态
const active = ref(0);
const submitLoading = ref(false);
const dialogStatus = ref(false);
const stepForm_0 = ref(null);
const stepForm_1 = ref(null);

// 下载表单数据
const downloadForm = reactive({
  packageName: "com",
  author: "admin",
  openSwagger: false,
  tableNames: []
});

// 表单验证规则
const rules = {
  packageName: [
    { required: true, message: "包名不能为空", trigger: "blur" },
    { pattern: /^[a-z][a-z0-9.]*[a-z0-9]$/, message: "包名格式不正确", trigger: "blur" }
  ],
  author: [{ required: true, message: "作者不能为空", trigger: "blur" }],
  moduleName: [{ pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: "模块名称格式不正确", trigger: "blur" }]
};

/**
 * 下载代码
 * 调用API下载生成的代码
 */
const download = () => {
  downLoadZip(fetchGenTableGenCode, downloadForm, "code");
};

/**
 * 打开对话框
 * @param {Object} data - 初始化数据
 */
const open = data => {
  dialogStatus.value = true;
  active.value = 0;

  // 合并数据到表单
  Object.assign(downloadForm, data);
};

/**
 * 下一步
 * 验证当前表单并前进到下一步
 */
const next = () => {
  const formRef = active.value === 0 ? stepForm_0.value : stepForm_1.value;

  formRef.validate(valid => {
    if (valid) {
      active.value += 1;
    }
  });
};

/**
 * 上一步
 * 返回到上一步
 */
const pre = () => {
  active.value -= 1;
};

/**
 * 提交表单
 * 验证表单并下载代码
 */
const submit = () => {
  stepForm_1.value.validate(valid => {
    if (valid) {
      submitLoading.value = true;

      try {
        download();
        active.value = 2;
      } catch (error) {
        console.error("代码导出失败:", error);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

/**
 * 再次下载
 * 重置步骤到第一步
 */
const again = () => {
  active.value = 0;
};

// 导出组件方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.import-code-dialog {
  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__title) {
    font-weight: 600;
    font-size: 18px;
  }
}

.import-code-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;

  &__icon {
    font-size: 20px;
    color: var(--el-color-primary);
    margin-right: 8px;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.import-code-steps {
  padding: 20px;
  margin-bottom: 20px;

  :deep(.el-step__title) {
    font-size: 14px;
  }

  :deep(.el-step__head.is-process) {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}

.import-code-step {
  &__title {
    font-weight: 500;
  }

  &__icon {
    font-size: 16px;
  }
}

.import-code-content {
  padding: 0 20px 20px;
  min-height: 400px;
}

.import-code-form {
  &__section {
    background-color: var(--el-bg-color-overlay);
    border-radius: var(--el-border-radius-base);
    padding: 16px;
    margin-bottom: 16px;
  }

  &__header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  &__icon {
    font-size: 18px;
    color: var(--el-color-primary);
    margin-right: 8px;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__help {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
}

.import-code-confirm {
  &__header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  &__icon {
    font-size: 20px;
    color: var(--el-color-warning);
    margin-right: 8px;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__card {
    margin-bottom: 16px;

    :deep(.el-card__header) {
      padding: 12px 16px;
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;

    .iconify-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }
  }

  &__table {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  &__table-icon {
    font-size: 16px;
    color: var(--el-color-info);
    margin-right: 8px;
  }
}

.import-code-result {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;

  &__icon {
    font-size: 72px;
    color: var(--el-color-success);
  }
}

.import-code-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  gap: 12px;
}

.import-code-button__icon {
  margin-right: 4px;
}

.import-code-switch {
  :deep(.el-switch__label) {
    font-size: 12px;
  }
}
</style>
