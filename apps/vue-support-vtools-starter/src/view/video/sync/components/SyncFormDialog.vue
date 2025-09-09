<template>
  <div>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑同步配置' : '新增同步配置'" width="60%" :close-on-click-modal="false" destroy-on-close @closed="handleDialogClosed" @open="handleDialogOpen">
      <el-form :model="formState" :rules="rules" ref="formRef" label-position="right" label-width="100px" class="sync-form" :disabled="loading">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="同步名称" prop="videoSyncConfigName">
              <el-input v-model="formState.videoSyncConfigName" placeholder="请输入同步配置名称" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="同步方式" prop="videoSyncConfigType">
              <el-select v-model="formState.videoSyncConfigSource" placeholder="请选择同步方式" class="sync-full-width">
                <el-option v-for="option in syncTypeOptions" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="同步地址" prop="videoSyncConfigUrl">
              <el-input v-model="formState.videoSyncConfigUrl" placeholder="请输入同步地址URL" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="密钥">
              <el-input v-model="formState.videoSyncConfigKey" placeholder="请输入接口密钥" :show-password="true" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="Cookie"> <el-input v-model="formState.videoSyncConfigCookie" type="textarea" placeholder="请输入Cookie信息" :rows="3" /> </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="是否启用">
              <el-switch v-model="formState.videoSyncConfigEnabled" active-text="启用" inactive-text="禁用" inline-prompt />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import { getVideoSyncDetail, createVideoSync, updateVideoSync } from "@/api/video";
import { createSyncFormState, syncConfigRules, resetSyncFormState, fillSyncFormFromResponse, validateExtraParams, syncTypeOptions } from "../data/syncConfig";

// 组件接收的属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  editId: {
    type: String,
    default: "",
  },
});

// 组件事件
const emit = defineEmits(["update:visible", "refresh", "close"]);

// 表单引用
const formRef = ref();
const loading = ref(false);
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

// 表单数据初始化
const formState = createSyncFormState();

// 表单校验规则
const rules = syncConfigRules;

// 重置表单
const resetForm = async () => {
  resetSyncFormState(formState);

  // 重置校验结果
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 处理弹窗打开事件
const handleDialogOpen = async () => {
  if (props.isEdit && props.editId) {
    fetchSyncDetail(props.editId);
  } else {
    resetForm();
  }
};

// 获取同步配置详情
const fetchSyncDetail = async (id) => {
  loading.value = true;

  getVideoSyncDetail(id)
    .then((response) => {
      if (response) {
        fillSyncFormFromResponse(formState, response, id);
      } else {
        message("获取同步配置详情失败", { type: "error" });
      }
    })
    .catch((error) => {
      console.error("获取同步配置详情出错:", error);
      message("获取同步配置详情失败", { type: "error" });
    })
    .finally(() => {
      loading.value = false;
    });
};

// 取消操作
const handleCancel = async () => {
  dialogVisible.value = false;
};

// 处理弹窗关闭事件
const handleDialogClosed = async () => {
  emit("close");
};

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    formRef.value.validate((valid) => {
      if (!valid) {
        console.log("表单验证失败", formState);
        return;
      }

      loading.value = true;

      const apiMethod = props.isEdit ? updateVideoSync : createVideoSync;
      apiMethod(formState)
        .then((res) => {
          message(props.isEdit ? "更新成功" : "创建成功", { type: "success" });
          dialogVisible.value = false;
          // 通知父组件刷新列表
          emit("refresh");
        })
        .catch((err) => {
          message(err.message, { type: "error" });
        })
        .finally(() => {
          loading.value = false;
        });
    });
  } catch (validationError) {
    console.error("表单验证出错:", validationError);
  }
};

// 使用watch代替watchEffect监听visible变化
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      // 弹窗打开时，不做任何操作
      // handleDialogOpen会在el-dialog的@open事件中调用
    }
  }
);
</script>

<style scoped>
.sync-form {
  max-width: 100%;
}

.sync-full-width {
  width: 100%;
}

.sync-extra-textarea {
  font-family: monospace;
}

.sync-json-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
