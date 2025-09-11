<template>
  <el-dialog v-model="dialogVisible" top="10px" :title="dialogTitle" :width="dialogWidth" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" class="modern-dialog" @close="handleClose">
    <div class="dialog-content">
      <!-- 表单头部 -->
      <div class="form-header" v-if="!isViewMode">
        <div class="header-icon">
          <el-icon class="icon">
            <component :is="useRenderIcon(getHeaderIcon())" />
          </el-icon>
        </div>
        <div class="header-content">
          <h3 class="header-title">{{ getHeaderTitle() }}</h3>
          <p class="header-subtitle">{{ getHeaderSubtitle() }}</p>
        </div>
      </div>

      <!-- 查看模式信息卡片 -->
      <div class="view-card" v-if="isViewMode">
        <div class="card-header">
          <div class="project-avatar">
            <img v-if="formData.sysProjectIcon" :src="formData.sysProjectIcon" :alt="formData.sysProjectName" class="avatar-image" @error="handleImageError" />
            <div v-else class="avatar-placeholder">
              <el-icon class="placeholder-icon">
                <component :is="useRenderIcon('ri:apps-line')" />
              </el-icon>
            </div>
          </div>
          <div class="project-info">
            <h2 class="project-name">{{ formData.sysProjectName }}</h2>
            <div class="project-meta">
              <el-tag :type="formData.sysProjectStatus === 1 ? 'success' : 'danger'" class="status-tag">
                {{ formData.sysProjectStatus === 1 ? "启用" : "禁用" }}
              </el-tag>
              <span class="meta-divider">•</span>
              <span class="meta-text">{{ getVenderName(formData.sysProjectVender) }}</span>
            </div>
          </div>
        </div>

        <div class="card-content">
          <div class="info-grid">
            <div class="info-item">
              <label class="info-label">项目分组</label>
              <div class="info-value">{{ formData.sysProjectGroup || "未分组" }}</div>
            </div>
            <div class="info-item">
              <label class="info-label">排序值</label>
              <div class="info-value">{{ formData.sysProjectSort || 0 }}</div>
            </div>
            <div class="info-item">
              <label class="info-label">创建时间</label>
              <div class="info-value">{{ formatDateTime(formData.createTime) }}</div>
            </div>
            <div class="info-item">
              <label class="info-label">更新时间</label>
              <div class="info-value">{{ formatDateTime(formData.updateTime) }}</div>
            </div>
          </div>

          <div class="info-section" v-if="formData.sysProjectFunction">
            <label class="section-label">项目功能</label>
            <div class="function-tags">
              <el-tag v-for="funcId in getFunctionIds(formData.sysProjectFunction)" :key="funcId" type="primary" class="function-tag">
                {{ getFunctionName(funcId) }}
              </el-tag>
            </div>
          </div>

          <div class="info-section" v-if="formData.sysProjectRemark">
            <label class="section-label">项目描述</label>
            <div class="remark-content">{{ formData.sysProjectRemark }}</div>
          </div>
        </div>
      </div>

      <!-- 编辑表单 -->
      <el-form v-else ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="modern-form" @submit.prevent>
        <div class="form-grid">
          <!-- 基本信息 -->
          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon">
                <component :is="useRenderIcon('ri:information-line')" />
              </el-icon>
              <span>基本信息</span>
            </div>

            <div class="form-row">
              <el-form-item label="项目名称" prop="sysProjectName" class="form-item">
                <el-input v-model="formData.sysProjectName" placeholder="请输入项目名称" clearable maxlength="50" show-word-limit class="form-input">
                  <template #prefix>
                    <el-icon><component :is="useRenderIcon('ri:apps-line')" /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="项目分组" prop="sysProjectGroup" class="form-item">
                <el-input v-model="formData.sysProjectGroup" placeholder="请输入项目分组" clearable maxlength="30" show-word-limit class="form-input">
                  <template #prefix>
                    <el-icon><component :is="useRenderIcon('ri:folder-line')" /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="项目厂商" prop="sysProjectVender" class="form-item">
                <el-select v-model="formData.sysProjectVender" placeholder="请选择项目厂商" clearable filterable class="form-select">
                  <el-option v-for="item in venderOptions" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId">
                    <div class="option-content">
                      <span class="option-name">{{ item.sysDictItemName }}</span>
                      <span class="option-code">{{ item.sysDictItemCode }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="项目状态" prop="sysProjectStatus" class="form-item">
                <el-radio-group v-model="formData.sysProjectStatus" class="status-radio">
                  <el-radio :label="1" class="status-option">
                    <div class="radio-content">
                      <el-icon class="radio-icon success">
                        <component :is="useRenderIcon('ri:checkbox-circle-line')" />
                      </el-icon>
                      <span>启用</span>
                    </div>
                  </el-radio>
                  <el-radio :label="0" class="status-option">
                    <div class="radio-content">
                      <el-icon class="radio-icon danger">
                        <component :is="useRenderIcon('ri:close-circle-line')" />
                      </el-icon>
                      <span>禁用</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </div>

            <el-form-item label="排序值" prop="sysProjectSort" class="form-item full-width">
              <el-input-number v-model="formData.sysProjectSort" :min="0" :max="9999" :step="1" placeholder="请输入排序值" class="form-number" />
              <div class="form-tip">
                <el-icon><component :is="useRenderIcon('ri:information-line')" /></el-icon>
                数值越小排序越靠前，默认为0
              </div>
            </el-form-item>
          </div>

          <!-- 功能配置 -->
          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon">
                <component :is="useRenderIcon('ri:settings-3-line')" />
              </el-icon>
              <span>功能配置</span>
            </div>

            <el-form-item label="项目功能" prop="sysProjectFunction" class="form-item full-width">
              <el-select v-model="selectedFunctions" :max-collapse-tags="5" placeholder="请选择项目功能" multiple collapse-tags collapse-tags-tooltip filterable class="form-select multiple">
                <el-option v-for="item in functionOptions" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId">
                  <div class="option-content">
                    <span class="option-name">{{ item.sysDictItemName }}</span>
                    <span class="option-code">{{ item.sysDictItemCode }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </div>

          <!-- 图标和描述 -->
          <div class="form-section">
            <div class="section-title">
              <el-icon class="section-icon">
                <component :is="useRenderIcon('ri:image-line')" />
              </el-icon>
              <span>图标和描述</span>
            </div>

            <el-form-item label="项目图标" prop="sysProjectIcon" class="form-item full-width">
              <div class="icon-upload">
                <div class="icon-preview">
                  <img v-if="formData.sysProjectIcon" :src="formData.sysProjectIcon" :alt="formData.sysProjectName" class="preview-image" @error="handleImageError" />
                  <div v-else class="preview-placeholder">
                    <el-icon class="placeholder-icon">
                      <component :is="useRenderIcon('ri:image-add-line')" />
                    </el-icon>
                    <span class="placeholder-text">暂无图标</span>
                  </div>
                </div>
                <div class="icon-actions">
                  <el-input v-model="formData.sysProjectIcon" placeholder="请输入图标URL地址" clearable class="icon-input">
                    <template #prefix>
                      <el-icon><component :is="useRenderIcon('ri:link')" /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" :icon="useRenderIcon('ri:upload-line')" @click="handleUploadIcon" class="upload-btn"> 上传图标 </el-button>
                </div>
              </div>
              <div class="form-tip">
                <el-icon><component :is="useRenderIcon('ri:information-line')" /></el-icon>
                支持JPG、PNG格式，建议尺寸64x64像素
              </div>
            </el-form-item>

            <el-form-item label="项目描述" prop="sysProjectRemark" class="form-item full-width">
              <el-input v-model="formData.sysProjectRemark" type="textarea" placeholder="请输入项目描述信息..." :rows="4" maxlength="200" show-word-limit resize="none" class="form-textarea" />
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 对话框底部 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <div class="operation-info" v-if="!isViewMode">
            <el-icon class="info-icon">
              <component :is="useRenderIcon('ri:information-line')" />
            </el-icon>
            <span class="info-text">{{ getOperationInfo() }}</span>
          </div>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose" class="cancel-btn">
            {{ isViewMode ? "关闭" : "取消" }}
          </el-button>
          <el-button v-if="!isViewMode" type="primary" :loading="submitLoading" @click="handleSubmit" class="submit-btn">
            <template #loading>
              <div class="loading-content">
                <el-icon class="loading-icon">
                  <component :is="useRenderIcon('ri:loader-line')" />
                </el-icon>
                <span>{{ getSubmitLoadingText() }}</span>
              </div>
            </template>
            {{ getSubmitText() }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { ElMessage } from "element-plus";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { fetchSaveProject, fetchUpdateProject } from "../../api/manage/project";

// 组件事件
const emit = defineEmits(["success", "close"]);

// 响应式数据
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();

// 操作模式
const operationMode = ref("add"); // add, edit, copy, view

// 表单数据
const formData = reactive({
  sysProjectId: null,
  sysProjectName: "",
  sysProjectGroup: "",
  sysProjectVender: null,
  sysProjectFunction: "",
  sysProjectIcon: "",
  sysProjectRemark: "",
  sysProjectStatus: 1,
  sysProjectSort: 0,
  createTime: "",
  updateTime: "",
});

// 选中的功能列表
const selectedFunctions = ref([]);

// 选项数据
const venderOptions = ref([]);
const functionOptions = ref([]);

// 表单验证规则
const formRules = {
  sysProjectName: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    { min: 2, max: 50, message: "项目名称长度在2到50个字符", trigger: "blur" },
  ],
  sysProjectVender: [{ required: true, message: "请选择项目厂商", trigger: "change" }],
  sysProjectStatus: [{ required: true, message: "请选择项目状态", trigger: "change" }],
};

// 计算属性
const isViewMode = computed(() => operationMode.value === "view");

const dialogTitle = computed(() => {
  const titles = {
    add: "新建项目",
    edit: "编辑项目",
    copy: "复制项目",
    view: "项目详情",
  };
  return titles[operationMode.value] || "项目管理";
});

const dialogWidth = computed(() => {
  return isViewMode.value ? "800px" : "900px";
});

// 监听功能选择变化
watch(
  selectedFunctions,
  (newVal) => {
    formData.sysProjectFunction = newVal.join(",");
  },
  { deep: true }
);

// 方法
const getHeaderIcon = () => {
  const icons = {
    add: "ri:add-circle-line",
    edit: "ri:edit-circle-line",
    copy: "ri:file-copy-line",
  };
  return icons[operationMode.value] || "ri:apps-line";
};

const getHeaderTitle = () => {
  const titles = {
    add: "创建新项目",
    edit: "编辑项目信息",
    copy: "复制项目配置",
  };
  return titles[operationMode.value] || "项目管理";
};

const getHeaderSubtitle = () => {
  const subtitles = {
    add: "填写项目基本信息和功能配置",
    edit: "修改项目信息和配置参数",
    copy: "基于现有项目创建新项目",
  };
  return subtitles[operationMode.value] || "";
};

const getOperationInfo = () => {
  const infos = {
    add: "请填写完整的项目信息",
    edit: "修改后的信息将立即生效",
    copy: "将创建一个新的项目副本",
  };
  return infos[operationMode.value] || "";
};

const getSubmitText = () => {
  const texts = {
    add: "创建项目",
    edit: "保存修改",
    copy: "创建副本",
  };
  return texts[operationMode.value] || "确定";
};

const getSubmitLoadingText = () => {
  const texts = {
    add: "创建中...",
    edit: "保存中...",
    copy: "复制中...",
  };
  return texts[operationMode.value] || "处理中...";
};

const getVenderName = (venderId) => {
  const vender = venderOptions.value.find((item) => item.sysDictItemId === venderId);
  return vender?.sysDictItemName || "未知厂商";
};

const getFunctionIds = (functionStr) => {
  if (!functionStr) return [];
  return functionStr
    .split(",")
    .map((id) => parseInt(id))
    .filter((id) => !isNaN(id));
};

const getFunctionName = (functionId) => {
  const func = functionOptions.value.find((item) => item.sysDictItemId === functionId);
  return func?.sysDictItemName || "未知功能";
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";
  const date = new Date(dateTime);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const handleImageError = (event) => {
  event.target.style.display = "none";
};

const handleUploadIcon = () => {
  ElMessage.info("图标上传功能开发中...");
};

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    sysProjectId: null,
    sysProjectName: "",
    sysProjectGroup: "",
    sysProjectVender: null,
    sysProjectFunction: "",
    sysProjectIcon: "",
    sysProjectRemark: "",
    sysProjectStatus: 1,
    sysProjectSort: 0,
    createTime: "",
    updateTime: "",
  });
  selectedFunctions.value = [];

  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

// 填充表单数据
const fillFormData = (data) => {
  Object.assign(formData, {
    sysProjectId: data.sysProjectId || null,
    sysProjectName: data.sysProjectName || "",
    sysProjectGroup: data.sysProjectGroup || "",
    sysProjectVender: data.sysProjectVender || null,
    sysProjectFunction: data.sysProjectFunction || "",
    sysProjectIcon: data.sysProjectIcon || "",
    sysProjectRemark: data.sysProjectRemark || "",
    sysProjectStatus: data.sysProjectStatus ?? 1,
    sysProjectSort: data.sysProjectSort || 0,
    createTime: data.createTime || "",
    updateTime: data.updateTime || "",
  });

  // 设置功能选择
  if (data.sysProjectFunction) {
    selectedFunctions.value = getFunctionIds(data.sysProjectFunction);
  } else {
    selectedFunctions.value = [];
  }
};

// 打开对话框
const handleOpen = async (mode, data = null) => {
  operationMode.value = mode;
  resetForm();

  if (data) {
    if (mode === "copy") {
      // 复制模式：清除ID和时间，修改名称
      const copyData = { ...data };
      delete copyData.sysProjectId;
      delete copyData.createTime;
      delete copyData.updateTime;
      copyData.sysProjectName = `${data.sysProjectName}_副本`;
      fillFormData(copyData);
    } else {
      // 编辑和查看模式：直接填充数据
      fillFormData(data);
    }
  }

  dialogVisible.value = true;

  // 等待DOM更新后聚焦第一个输入框
  await nextTick();
  if (!isViewMode.value && formRef.value) {
    const firstInput = formRef.value.$el.querySelector("input");
    if (firstInput) {
      firstInput.focus();
    }
  }
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  emit("close");
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    submitLoading.value = true;

    const submitData = {
      ...formData,
      sysProjectFunction: selectedFunctions.value.join(","),
    };

    let response;
    if (operationMode.value === "edit") {
      response = await fetchUpdateProject(submitData);
    } else {
      // 新增和复制都使用新增接口
      const { sysProjectId, createTime, updateTime, ...addData } = submitData;
      response = await fetchSaveProject(addData);
    }

    if (response?.code === "00000") {
      const successMessages = {
        add: "项目创建成功",
        edit: "项目更新成功",
        copy: "项目复制成功",
      };

      message(successMessages[operationMode.value], { type: "success" });
      emit("success");
      handleClose();
    } else {
      throw new Error(response?.message || "操作失败");
    }
  } catch (error) {
    console.error("提交失败:", error);
    message(error.message || "操作失败", { type: "error" });
  } finally {
    submitLoading.value = false;
  }
};

// 设置字典数据
const handleDictItem = (data) => {
  venderOptions.value = data || [];
};

const handleFunction = (data) => {
  functionOptions.value = data || [];
};

// 暴露方法给父组件
defineExpose({
  handleOpen,
  handleDictItem,
  handleFunction,
});
</script>

<style lang="scss" scoped>
.modern-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;

    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      color: white;
      padding: 10px 12px;
      border-bottom: none;

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: white;
      }

      .el-dialog__headerbtn {
        top: 20px;
        right: 24px;

        .el-dialog__close {
          color: white;
          font-size: 18px;

          &:hover {
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }
    }

    .el-dialog__body {
      padding: 0;
      max-height: none;
      overflow-y: visible;
    }

    .el-dialog__footer {
      padding: 20px 24px;
      background: var(--el-bg-color-page);
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
}

.dialog-content {
  padding: 16px;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--el-color-primary-light-9);
  border-radius: 12px;
  border-left: 4px solid var(--el-color-primary);

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--el-color-primary);

    .icon {
      font-size: 24px;
      color: white;
    }
  }

  .header-content {
    .header-title {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .header-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}

.view-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  .card-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));

    .project-avatar {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      overflow: hidden;
      background: var(--el-bg-color);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .placeholder-icon {
          font-size: 32px;
          color: var(--el-text-color-placeholder);
        }
      }
    }

    .project-info {
      flex: 1;

      .project-name {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
        color: var(--el-text-color-primary);
      }

      .project-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .status-tag {
          font-weight: 600;
        }

        .meta-divider {
          color: var(--el-text-color-placeholder);
        }

        .meta-text {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .card-content {
    padding: 12px;

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 12px;

      .info-item {
        .info-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--el-text-color-secondary);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          color: var(--el-text-color-primary);
          font-weight: 500;
        }
      }
    }

    .info-section {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--el-text-color-secondary);
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .function-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .function-tag {
          font-size: 12px;
          border-radius: 6px;
        }
      }

      .remark-content {
        padding: 16px;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.6;
        color: var(--el-text-color-primary);
      }
    }
  }
}

.modern-form {
  .form-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .section-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .form-item {
    margin-bottom: 12px;

    &.full-width {
      grid-column: 1 / -1;
    }

    :deep(.el-form-item__label) {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .form-input,
    .form-select,
    .form-number,
    .form-textarea {
      width: 100%;

      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper),
      :deep(.el-textarea__inner) {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary-light-7);
        }

        &.is-focus {
          border-color: var(--el-color-primary);
          box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
        }
      }
    }

    .form-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);

      .el-icon {
        font-size: 14px;
      }
    }
  }

  .status-radio {
    display: flex;
    gap: 20px;

    .status-option {
      :deep(.el-radio__label) {
        padding-left: 8px;
      }

      .radio-content {
        display: flex;
        align-items: center;
        gap: 6px;

        .radio-icon {
          font-size: 16px;

          &.success {
            color: var(--el-color-success);
          }

          &.danger {
            color: var(--el-color-danger);
          }
        }
      }
    }
  }

  .option-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .option-name {
      font-weight: 500;
    }

    .option-code {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      background: var(--el-fill-color-light);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  .icon-upload {
    display: flex;
    gap: 16px;
    align-items: flex-start;

    .icon-preview {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      border: 2px dashed var(--el-border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-fill-color-light);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
      }

      .preview-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .placeholder-icon {
          font-size: 24px;
          color: var(--el-text-color-placeholder);
        }

        .placeholder-text {
          font-size: 11px;
          color: var(--el-text-color-placeholder);
        }
      }
    }

    .icon-actions {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .icon-input {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
        }
      }

      .upload-btn {
        align-self: flex-start;
        border-radius: 8px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .footer-left {
    .operation-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .info-icon {
        font-size: 16px;
        color: var(--el-color-primary);
      }

      .info-text {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .footer-right {
    display: flex;
    gap: 12px;

    .cancel-btn {
      border-radius: 8px;
      padding: 10px 20px;
    }

    .submit-btn {
      border-radius: 8px;
      padding: 10px 24px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      border: none;

      .loading-content {
        display: flex;
        align-items: center;
        gap: 6px;

        .loading-icon {
          animation: rotate 1s linear infinite;
        }
      }

      &:hover:not(.is-loading) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .view-card {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);

    .card-header {
      background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-6));
    }
  }

  .form-header {
    background: var(--el-color-primary-light-8);
  }

  .icon-preview {
    background: var(--el-fill-color);
    border-color: var(--el-border-color);
  }

  .remark-content {
    background: var(--el-fill-color);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .modern-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 20px auto;

      .el-dialog__body {
        max-height: 60vh;
      }
    }
  }

  .dialog-content {
    padding: 16px;
  }

  .form-header {
    padding: 16px;

    .header-icon {
      width: 40px;
      height: 40px;

      .icon {
        font-size: 20px;
      }
    }

    .header-content {
      .header-title {
        font-size: 16px;
      }

      .header-subtitle {
        font-size: 13px;
      }
    }
  }

  .view-card {
    .card-header {
      flex-direction: column;
      text-align: center;
      gap: 16px;

      .project-avatar {
        width: 56px;
        height: 56px;
      }

      .project-info {
        .project-name {
          font-size: 20px;
        }
      }
    }

    .card-content {
      padding: 16px;

      .info-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  }

  .modern-form {
    .form-row {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .icon-upload {
      flex-direction: column;
      align-items: center;

      .icon-preview {
        width: 100px;
        height: 100px;
      }

      .icon-actions {
        width: 100%;
      }
    }
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .footer-left {
      order: 2;

      .operation-info {
        justify-content: center;
      }
    }

    .footer-right {
      order: 1;
      justify-content: center;
    }
  }
}
</style>
