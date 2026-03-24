<script setup>
/**
 * TOTP 验证码对话框组件
 * @author CH
 * @date 2025-12-02
 */
import { ref } from "vue";
import ScCode from "@repo/components/ScCode/index.vue";
import Motion from "../../utils/motion";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "complete", "change", "close"]);

const scCodeRef = ref();

const handleClose = () => {
  emit("update:modelValue", false);
  emit("close");
  scCodeRef.value?.clear();
};

const handleChange = (data) => {
  emit("change", data);
};

const handleComplete = () => {
  emit("complete");
};

const clear = () => {
  scCodeRef.value?.clear();
};

defineExpose({
  clear,
});
</script>

<template>
  <sc-dialog
    :model-value="modelValue"
    width="480px"
    :close-on-click-modal="false"
    draggable
    title="动态验证码验证"
    @close="handleClose"
    class="modern-dialog totp-dialog"
    append-to-body
  >
    <div class="totp-container">
      <Motion :delay="150">
        <div class="totp-wrapper">
          <!-- 安全提示 -->
          <div class="security-notice">
            <div class="notice-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 8V12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 16H12.01"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <p class="notice-text">为了您的账户安全，请输入动态验证码</p>
          </div>

          <!-- 验证码输入组件 -->
          <ScCode
            ref="scCodeRef"
            :disabled="loading"
            @onComplete="handleComplete"
            @onChange="handleChange"
          />

          <!-- 帮助信息 -->
          <div class="help-info">
            <div class="help-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>验证码每30秒更新一次</span>
            </div>
            <div class="help-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12L11 14L15 10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>支持粘贴验证码</span>
            </div>
          </div>
        </div>
      </Motion>
    </div>
  </sc-dialog>
</template>

<style lang="scss" scoped>
.totp-container {
  padding: 8px 0;
}

.totp-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.security-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-fill-color-light) 100%
  );
  border-radius: 12px;
  border: 1px solid var(--el-color-primary-light-8);

  .notice-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-color-primary);
    border-radius: 10px;
    color: #fff;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .notice-text {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
  }
}

.help-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;

  .help-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--el-text-color-secondary);

    svg {
      width: 16px;
      height: 16px;
      color: var(--el-color-primary);
      flex-shrink: 0;
    }
  }
}
</style>
