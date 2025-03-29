<script setup>
import { fetchProtectionSave, fetchProtectionUpdate } from "@/api/monitor/protection";
import { message } from "@repo/utils";
import { defineExpose, defineEmits, shallowRef, reactive, nextTick } from "vue";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 表单引用
const formRef = shallowRef();

// 定义事件
const emit = defineEmits(["close", "success"]);

// 环境变量
const env = reactive({
  visible: false,
  title: "",
  params: {},
  data: {},
  loading: false,
  mode: "save",
  form: {}
});

// 表单验证规则
const rules = {
  monitorProtectionName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  monitorProtectionPid: [{ required: true, message: "请输入监听的PID", trigger: "blur" }],
  monitorProtectionShell: [{ required: true, message: "请输入脚本", trigger: "blur" }],
  monitorProtectionStatus: [{ required: true, message: "请输入状态", trigger: "blur" }]
};

/**
 * 关闭对话框
 */
const handleClose = async () => {
  env.visible = false;
  env.form = {};
  emit("close");
};

/**
 * 保存或更新数据
 */
const handleUpdate = async () => {
  formRef.value.validate(async valid => {
    if (valid) {
      env.loading = true;

      try {
        if (env.mode === "edit") {
          await fetchProtectionUpdate(env.form);
        } else {
          await fetchProtectionSave(env.form);
        }

        message(t("message.updateSuccess"), { type: "success" });
        emit("success");
        handleClose();
      } catch (error) {
        message(error.message || t("message.updateFailed"), { type: "error" });
      } finally {
        env.loading = false;
      }
    }
  });
};

/**
 * 打开对话框
 * @param {Object} item - 表单数据
 * @param {String} mode - 操作模式：save-新增，edit-编辑
 */
const handleOpen = async (item, mode) => {
  env.form = { ...item };
  env.mode = mode;
  env.visible = true;

  if (mode === "save") {
    env.title = "新增防护配置";
    env.form.monitorProtectionStatus = 0; // 默认启用
    env.form.sysServiceModuleSort = 1;
  } else {
    env.title = "编辑防护配置";
  }

  // 等待DOM更新后重置表单验证
  await nextTick();
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  handleOpen,
  handleClose
});
</script>

<template>
  <div class="protection-save">
    <!-- 对话框 -->
    <el-dialog v-model="env.visible" :title="env.title" draggable :close-on-click-modal="false" :destroy-on-close="true" class="protection-save__dialog" width="600px">
      <div class="protection-save__content">
        <!-- 表单 -->
        <el-form ref="formRef" :model="env.form" :rules="rules" label-width="120px" class="protection-save__form">
          <!-- 名称 -->
          <el-form-item label="名称" prop="monitorProtectionName" class="protection-save__form-item">
            <el-input v-model="env.form.monitorProtectionName" placeholder="请输入名称" class="protection-save__input">
              <template #prefix>
                <IconifyIconOnline icon="ri:file-list-line" class="protection-save__input-icon" />
              </template>
            </el-input>
            <div class="protection-save__form-tip">请输入防护配置名称，便于识别</div>
          </el-form-item>

          <!-- PID -->
          <el-form-item label="PID" prop="monitorProtectionPid" class="protection-save__form-item">
            <el-input-number v-model="env.form.monitorProtectionPid" placeholder="请输入监听的PID" :min="1" :max="65535" class="protection-save__input-number" />
            <div class="protection-save__form-tip">请输入需要监听的进程PID</div>
          </el-form-item>

          <!-- 启动脚本 -->
          <el-form-item label="启动脚本" prop="monitorProtectionShell" class="protection-save__form-item">
            <el-input v-model="env.form.monitorProtectionShell" type="textarea" :rows="3" placeholder="请输入脚本" class="protection-save__textarea" />
            <div class="protection-save__form-tip">当进程不存在时，将执行此脚本重新启动服务</div>
          </el-form-item>

          <!-- 状态 -->
          <el-form-item label="状态" prop="monitorProtectionStatus" class="protection-save__form-item">
            <el-select v-model="env.form.monitorProtectionStatus" placeholder="请选择状态" class="protection-save__select">
              <el-option label="启用" :value="0">
                <div class="protection-save__option">
                  <IconifyIconOnline icon="ri:check-line" class="protection-save__option-icon protection-save__option-icon--success" />
                  <span>启用</span>
                </div>
              </el-option>
              <el-option label="禁用" :value="1">
                <div class="protection-save__option">
                  <IconifyIconOnline icon="ri:close-line" class="protection-save__option-icon protection-save__option-icon--danger" />
                  <span>禁用</span>
                </div>
              </el-option>
            </el-select>
            <div class="protection-save__form-tip">启用后将自动监控进程状态</div>
          </el-form-item>

          <!-- 备注 -->
          <el-form-item label="备注" prop="monitorProtectionRemark" class="protection-save__form-item">
            <el-input v-model="env.form.monitorProtectionRemark" type="textarea" :rows="3" placeholder="请输入备注" class="protection-save__textarea" />
            <div class="protection-save__form-tip">可选，添加额外说明信息</div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 底部按钮 -->
      <template #footer>
        <div class="protection-save__footer">
          <el-button class="protection-save__cancel-btn" @click="handleClose">
            <IconifyIconOnline icon="ri:close-line" />
            <span>{{ $t("buttons.cancel") }}</span>
          </el-button>
          <el-button type="primary" :loading="env.loading" class="protection-save__confirm-btn" @click="handleUpdate">
            <IconifyIconOnline icon="ri:save-line" />
            <span>{{ $t("buttons.confirm") }}</span>
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.protection-save {
  /* 对话框样式 */
  &__dialog {
    :deep(.el-dialog__header) {
      margin-bottom: 0;
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-color-primary);
      }

      .el-dialog__close-btn {
        color: var(--el-color-primary);
        transition: transform 0.3s ease;

        &:hover {
          transform: rotate(90deg);
          color: var(--el-color-primary-dark-2);
        }
      }
    }

    :deep(.el-dialog__body) {
      padding: 20px;
    }

    :deep(.el-dialog__footer) {
      padding: 16px 20px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-bg-color-overlay);
    }
  }

  /* 内容区域样式 */
  &__content {
    max-height: 60vh;
    overflow-y: auto;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-color-primary-light-7);
      border-radius: 3px;

      &:hover {
        background-color: var(--el-color-primary-light-5);
      }
    }

    &::-webkit-scrollbar-track {
      background-color: var(--el-fill-color-lighter);
      border-radius: 3px;
    }
  }

  /* 表单样式 */
  &__form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* 表单项样式 */
  &__form-item {
    margin-bottom: 16px;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    :deep(.el-form-item__content) {
      display: flex;
      flex-direction: column;
    }

    :deep(.el-form-item__error) {
      animation: shake 0.5s ease-in-out;
    }
  }

  /* 表单提示文本样式 */
  &__form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
    line-height: 1.4;
    transition: color 0.3s ease;
  }

  /* 输入框样式 */
  &__input {
    transition: all 0.3s ease;

    &:hover {
      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }

    &:focus {
      transform: translateY(-2px);
    }
  }

  /* 输入框图标样式 */
  &__input-icon {
    color: var(--el-color-primary-light-5);
    font-size: 16px;
  }

  /* 数字输入框样式 */
  &__input-number {
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }
  }

  /* 文本域样式 */
  &__textarea {
    transition: all 0.3s ease;

    &:hover {
      :deep(.el-textarea__inner) {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }

    &:focus {
      transform: translateY(-2px);
    }
  }

  /* 选择器样式 */
  &__select {
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }
  }

  /* 选项样式 */
  &__option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 选项图标样式 */
  &__option-icon {
    font-size: 16px;

    &--success {
      color: var(--el-color-success);
    }

    &--danger {
      color: var(--el-color-danger);
    }
  }

  /* 底部操作区域样式 */
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  /* 取消按钮样式 */
  &__cancel-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 确认按钮样式 */
  &__confirm-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition:
        width 0.4s ease,
        height 0.4s ease;
      z-index: 0;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      &::before {
        width: 150%;
        height: 150%;
      }
    }

    &:active {
      transform: translateY(0);
    }

    span,
    i {
      position: relative;
      z-index: 1;
    }
  }
}

/* 动画效果 */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-5px);
  }
  40%,
  80% {
    transform: translateX(5px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
