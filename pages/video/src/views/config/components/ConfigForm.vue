<template>
  <sc-dialog :model-value="visible" @update:model-value="handleClose" :title="editing ? '编辑配置' : '新增配置'" width="600px" @close="handleClose">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="modern-form">
      <el-form-item label="配置名称" prop="videoSyncConfigName">
        <el-input v-model="formData.videoSyncConfigName" placeholder="请输入配置名称" />
      </el-form-item>

      <el-form-item label="同步源" prop="videoSourceId">
        <ScSelect v-model="formData.videoSourceId" :props="selectProps" :url="getSourceList" :is-remote="true" layout="card" style="width: 100%" />
      </el-form-item>

      <el-form-item label="同步间隔">
        <el-select v-model="formData.videoSyncInterval" placeholder="选择同步间隔">
          <el-option label="手动同步" :value="0" />
          <el-option label="每5分钟" :value="5" />
          <el-option label="每15分钟" :value="15" />
          <el-option label="每30分钟" :value="30" />
          <el-option label="每小时" :value="60" />
          <el-option label="每6小时" :value="360" />
          <el-option label="每天" :value="1440" />
        </el-select>
      </el-form-item>

      <el-form-item label="请求头">
        <el-input v-model="formData.videoConfigHeaders" type="textarea" :rows="3" placeholder="JSON格式的请求头" />
      </el-form-item>

      <el-form-item label="配置说明">
        <el-input v-model="formData.videoConfigRemark" type="textarea" :rows="2" placeholder="请输入配置说明" />
      </el-form-item>

      <el-form-item label="当前索引">
        <el-tooltip content="点击刷新当前索引" placement="top">
          <el-text>{{ formData.videoSyncConfigLastOffset }} </el-text>
          <IconifyIcon icon="ep:refresh" @click="handleReset" />
        </el-tooltip>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ editing ? "更新" : "保存" }}
        </el-button>
      </span>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import ScSelect from "@repo/components/ScSelect/index.vue";
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
  videoSyncConfigName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  videoSyncConfigSource: [{ required: true, message: "请选择同步源", trigger: "change" }],
  videoSyncInterval: [{ required: true, message: "请选择同步间隔", trigger: "change" }],
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
      const apiCall = props.editing && props.config?.videoSyncConfigId ? updateSyncConfig({ ...formData, videoSyncConfigId: props.config.videoSyncConfigId } as VideoSyncConfig) : addSyncConfig(formData as VideoSyncConfig);

      apiCall
        .then((result) => {
          message(props.editing ? "配置更新成功" : "配置添加成功", { type: "success" });
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
  { immediate: true, deep: true }
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

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
