<script setup>
/**
 * 滑动验证码对话框组件
 * @author CH
 * @date 2025-12-02
 */
import { ref } from "vue";
import Vcode from "vue3-puzzle-vcode";
import Motion from "../../utils/motion";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  openVcode: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "success", "fail", "close"]);

const vcodeRef = ref();

const handleClose = () => {
  emit("update:modelValue", false);
  emit("close");
};

const onSuccess = () => {
  emit("success");
};

const onFail = () => {
  emit("fail");
};

const reset = () => {
  vcodeRef.value?.reset();
};

defineExpose({
  reset,
});
</script>

<template>
  <sc-dialog
    :model-value="modelValue"
    width="480px"
    draggable
    title="滑动验证"
    @close="handleClose"
    class="modern-dialog vcode-dialog"
    append-to-body
  >
    <div v-if="openVcode" class="vcode-container">
      <Motion :delay="150">
        <div class="vcode-wrapper">
          <!-- 验证说明 -->
          <div class="verification-notice">
            <div class="notice-icon">
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
            </div>
            <div class="notice-content">
              <h4 class="notice-title">请完成安全验证</h4>
              <p class="notice-desc">拖动滑块完成拼图验证</p>
            </div>
          </div>

          <!-- 滑动验证组件 -->
          <div class="vcode-component-wrapper">
            <div class="vcode-header">
              <div class="vcode-title">
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
                <span>拼图验证</span>
              </div>
              <div class="vcode-subtitle">请拖动滑块完成拼图</div>
            </div>

            <div class="vcode-puzzle-area">
              <Vcode
                ref="vcodeRef"
                :show="openVcode"
                type="inside"
                :puzzleScale="0.8"
                @fail="onFail"
                @success="onSuccess"
              />
            </div>

            <!-- 操作提示 -->
            <div class="vcode-tips">
              <div class="tip-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 10L12 15L17 10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>拖动滑块到正确位置</span>
              </div>
              <div class="tip-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>仔细观察拼图缺口</span>
              </div>
            </div>
          </div>

          <!-- 验证状态提示 -->
          <div class="verification-status">
            <div class="status-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>安全验证保护您的账户</span>
            </div>
          </div>
        </div>
      </Motion>
    </div>
  </sc-dialog>
</template>

<style lang="scss" scoped>
.vcode-container {
  padding: 8px 0;
}

.vcode-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.verification-notice {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    var(--el-color-success-light-9) 0%,
    var(--el-fill-color-light) 100%
  );
  border-radius: 12px;
  border: 1px solid var(--el-color-success-light-8);

  .notice-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-color-success);
    border-radius: 12px;
    color: #fff;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  .notice-content {
    .notice-title {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .notice-desc {
      margin: 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.vcode-component-wrapper {
  background: var(--el-fill-color-lighter);
  border-radius: 16px;
  padding: 20px;

  .vcode-header {
    margin-bottom: 16px;
    text-align: center;

    .vcode-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 6px;

      svg {
        width: 20px;
        height: 20px;
        color: var(--el-color-primary);
      }
    }

    .vcode-subtitle {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .vcode-puzzle-area {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.vcode-tips {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;

  .tip-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    svg {
      width: 14px;
      height: 14px;
      color: var(--el-color-primary-light-3);
    }
  }
}

.verification-status {
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  text-align: center;

  .status-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);

    svg {
      width: 16px;
      height: 16px;
      color: var(--el-color-primary);
    }
  }
}
</style>
