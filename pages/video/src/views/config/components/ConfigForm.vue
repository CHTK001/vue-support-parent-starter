<template>
  <sc-dialog
    :model-value="visible"
    @update:model-value="handleClose"
    :title="editing ? '编辑配置' : '新增配置'"
    width="650px"
    @close="handleClose"
    class="config-form-dialog"
    draggable
  >
    <template #header>
      <div class="dialog-header-gradient">
        <div class="dialog-header-content">
          <IconifyIconOnline
            :icon="editing ? 'ep:edit' : 'ep:plus'"
            class="dialog-header-icon"
          />
          <div>
            <h3 class="dialog-header-title">
              {{ editing ? '编辑同步配置' : '新增同步配置' }}
            </h3>
            <p class="dialog-header-desc">
              {{ editing ? '修改现有视频同步配置参数' : '创建新的视频同步配置' }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <ScForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="modern-form"
    >
      <div class="form-section">
        <div class="form-section-title">
          <span class="form-section-bar"></span>
          基本信息
        </div>
        <div class="form-section-body">
          <ScFormItem label="配置名称" prop="videoSyncConfigName">
            <ScInput
              v-model="formData.videoSyncConfigName"
              placeholder="请输入配置名称"
              clearable
            />
          </ScFormItem>

          <ScFormItem label="同步源" prop="videoSourceId">
            <ScSelect
              v-model="formData.videoSourceId"
              :props="selectProps"
              :url="getSourceList"
              :is-remote="true"
              layout="card"
              style="width: 100%"
              placeholder="请选择数据同步源"
              clearable
            />
          </ScFormItem>

          <ScFormItem label="同步间隔" prop="videoSyncInterval">
            <ScSelect
              v-model="formData.videoSyncInterval"
              placeholder="选择同步间隔"
              style="width: 100%"
              clearable
            >
              <ScOption label="手动同步（仅触发）" :value="0" />
              <ScOption label="每5分钟" :value="5" />
              <ScOption label="每15分钟" :value="15" />
              <ScOption label="每30分钟" :value="30" />
              <ScOption label="每小时" :value="60" />
              <ScOption label="每6小时" :value="360" />
              <ScOption label="每天" :value="1440" />
            </ScSelect>
          </ScFormItem>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">
          <span class="form-section-bar"></span>
          高级配置
        </div>
        <div class="form-section-body">
          <ScFormItem label="请求头">
            <ScInput
              v-model="formData.videoConfigHeaders"
              type="textarea"
              :rows="3"
              placeholder='JSON格式的请求头，如：{"Authorization": "Bearer xxx"}'
            />
          </ScFormItem>

          <ScFormItem label="配置说明">
            <ScInput
              v-model="formData.videoConfigRemark"
              type="textarea"
              :rows="2"
              placeholder="请输入配置说明，方便后续管理"
            />
          </ScFormItem>

          <ScFormItem label="当前索引">
            <div class="offset-display">
              <el-text type="info" class="offset-value">
                {{ formData.videoSyncConfigLastOffset || '无' }}
              </el-text>
              <ScTooltip content="重置索引" placement="top">
                <ScButton size="small" circle @click="handleReset" class="offset-reset-btn">
                  <IconifyIconOnline icon="ep:refresh" />
                </ScButton>
              </ScTooltip>
            </div>
          </ScFormItem>
        </div>
      </div>
    </ScForm>

    <template #footer>
      <span class="dialog-footer">
        <ScButton @click="handleClose" size="default">取消</ScButton>
        <ScButton type="primary" @click="handleSave" :loading="saving" size="default">
          <IconifyIconOnline :icon="editing ? 'ep:check' : 'ep-plus'" class="mr-1" />
          {{ editing ? "更新配置" : "保存配置" }}
        </ScButton>
      </span>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { message } from "@repo/utils";
import { reactive, ref, watch } from "vue";
import { addSyncConfig, updateSyncConfig } from "../../../api/config";
import { getSourceList } from "../../../api/source";
import type { VideoSyncConfig } from "../../../api/types";

/**
 * 配置表单组件
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// 定义props
interface Props {
  visible: boolean;
  config?: VideoSyncConfig | null;
  editing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  config: null,
  editing: false,
});

// 定义emits
interface Emits {
  "update:visible": [value: boolean];
  success: [];
  close: [];
}

const emit = defineEmits<Emits>();

// 表单引用
const formRef = ref();

// 保存状态
const saving = ref(false);

// 同步源选项
const syncSourceOptions = [
  { label: "PanSou", value: "pansou" },
  { label: "在线视频", value: "guanying" },
  { label: "本地文件", value: "local" },
  { label: "RSS订阅", value: "rss" },
  { label: "API接口", value: "api" },
] as any;

// 表单数据
const formData = reactive<Partial<VideoSyncConfig>>({
  videoSyncConfigName: "",
  videoSourceId: "",
  videoSyncConfigStatus: "",
  videoSyncConfigLastOffset: "",
  videoSyncInterval: 0,
  videoConfigHeaders: "",
  videoConfigRemark: "",
});

const selectProps = {
  label: "videoSourceName",
  prop: "videoSourceId",
  icon: "videoSourceIcon",
};

// 表单验证规则
const formRules = {
  videoSyncConfigName: [
    { required: true, message: "请输入配置名称", trigger: "blur" },
  ],
  videoSyncConfigSource: [
    { required: true, message: "请选择同步源", trigger: "change" },
  ],
  videoSyncInterval: [
    { required: true, message: "请选择同步间隔", trigger: "change" },
  ],
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    videoSyncConfigName: "",
    videoSyncConfigSource: "",
    videoSyncConfigUrl: "",
    videoSyncConfigKeyword: "",
    videoSyncConfigCategory: "",
    videoSyncConfigCron: "",
    videoSyncConfigStatus: 1,
    videoSyncInterval: 0,
    videoConfigHeaders: "",
    videoConfigRemark: "",
  });
  formRef.value?.resetFields();
};

const handleReset = async () => {
  formData.videoSyncConfigLastOffset = "";
};
/**
 * 处理保存
 */
const handleSave = () => {
  formRef.value
    .validate()
    .then((valid: boolean) => {
      if (!valid) return;

      saving.value = true;

      // 根据编辑状态调用不同的API
      const apiCall =
        props.editing && props.config?.videoSyncConfigId
          ? updateSyncConfig({
              ...formData,
              videoSyncConfigId: props.config.videoSyncConfigId,
            } as VideoSyncConfig)
          : addSyncConfig(formData as VideoSyncConfig);

      apiCall
        .then((result) => {
          message(props.editing ? "配置更新成功" : "配置添加成功", {
            type: "success",
          });
          emit("success");
          handleClose();
        })
        .catch((error) => {
          console.error("保存配置失败:", error);
          message("操作失败，请重试", { type: "error" });
        })
        .finally(() => {
          saving.value = false;
        });
    })
    .catch((error) => {
      console.error("表单验证失败:", error);
    });
};

/**
 * 处理关闭
 */
const handleClose = () => {
  resetForm();
  emit("update:visible", false);
  emit("close");
};

// 监听编辑配置变化
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      // 编辑模式，填充表单数据
      Object.assign(formData, newConfig);
    } else {
      // 新增模式，重置表单
      resetForm();
    }
  },
  { immediate: true, deep: true },
);

// 暴露给父组件的方法
defineExpose({
  validate: (callback: (valid: boolean) => void) => {
    formRef.value.validate(callback);
  },
  resetFields: () => {
    formRef.value?.resetFields();
  },
});
</script>

<style scoped lang="scss">
.config-form-dialog {
  :deep(.el-dialog__header) {
    padding: 0;
    border-radius: 12px 12px 0 0;
    overflow: hidden;
  }
}

.dialog-header-gradient {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  padding: 20px 24px;
  color: white;
}

.dialog-header-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dialog-header-icon {
  font-size: 32px;
  opacity: 0.9;
}

.dialog-header-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.dialog-header-desc {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.form-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.form-section-bar {
  display: inline-block;
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--el-color-primary-light-3), var(--el-color-primary));
  flex-shrink: 0;
}

.form-section-body {
  padding-left: 12px;
}

.offset-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.offset-value {
  font-family: monospace;
  font-size: 13px;
}

.offset-reset-btn {
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 4px 0;
}

.mr-1 {
  margin-right: 4px;
}

@media (max-width: 640px) {
  .dialog-header-gradient {
    padding: 16px;
  }

  .dialog-header-icon {
    font-size: 24px;
  }

  .dialog-header-title {
    font-size: 16px;
  }

  .form-section-body {
    padding-left: 0;
  }
}
</style>
