<template>
  <div class="modern-otp-container">
    <!-- 标题和描述 -->
    <div class="otp-header">
      <div class="otp-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h3 class="otp-title">请输入验证码</h3>
      <p class="otp-description">请输入您收到的6位数字验证码</p>
    </div>

    <!-- 验证码输入区域 -->
    <form class="modern-otp-form">
      <div class="verification-container">
        <input
          v-for="(code, index) in verificationCodes"
          :key="index"
          :ref="el => (inputRefs[index] = el)"
          v-model="verificationCodes[index]"
          :disabled="props.disabled"
          maxlength="1"
          class="modern-otp-input"
          :class="{
            active: activeIndex === index,
            filled: verificationCodes[index],
            error: hasError,
            disabled: props.disabled
          }"
          type="text"
          inputmode="numeric"
          @input="handleInput(index, $event)"
          pattern="[0-9]*"
          @keydown="handleKeyDown(index, $event)"
          autocomplete="one-time-code"
          @focus="handleFocus(index)"
          @blur="handleBlur(index)"
        />
      </div>
    </form>

    <!-- 底部操作区域 -->
    <div class="otp-footer">
      <div class="otp-actions">
        <button type="button" class="clear-button" :disabled="!hasValue || props.disabled" @click="clearAll">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path
              d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          清空
        </button>

        <div class="paste-hint">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          支持粘贴验证码
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, defineExpose, computed, onMounted, onUnmounted } from "vue";

// 定义props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
});

const verificationCodes = ref(["", "", "", "", "", ""]);
const activeIndex = ref(-1);
const hasError = ref(false);
const inputRefs = ref([]);

const emit = defineEmits(["complete", "change"]);

// 计算属性
const hasValue = computed(() => {
  return verificationCodes.value.some(code => code !== "");
});

// 粘贴处理函数
const handlePaste = e => {
  e.preventDefault();
  const clipboardData = e.clipboardData || window.clipboardData;
  const pastedText = clipboardData.getData("text");

  // 只保留数字
  const numericText = pastedText.replace(/\D/g, "");
  let text = numericText.substring(0, 6);

  // 清空当前输入
  verificationCodes.value = ["", "", "", "", "", ""];

  // 填入粘贴的内容
  for (let i = 0; i < text.length; i++) {
    verificationCodes.value[i] = text[i];
  }

  const _value = verificationCodes.value.join("");
  emit("onChange", _value);

  if (_value.length === 6) {
    emit("onComplete", _value);
    // 移除焦点
    if (inputRefs.value[5]) {
      inputRefs.value[5].blur();
    }
  } else if (text.length > 0) {
    // 聚焦到下一个空输入框
    const nextEmptyIndex = text.length < 6 ? text.length : 5;
    if (inputRefs.value[nextEmptyIndex]) {
      inputRefs.value[nextEmptyIndex].focus();
    }
  }
};

// 输入处理
const handleInput = (index, event) => {
  if (props.disabled) {
    return; // 如果禁用，不处理输入
  }

  const value = event.target.value.replace(/\D/g, ""); // 只允许数字

  if (value.length > 1) {
    // 处理多字符输入（可能是粘贴）
    const chars = value.split("");
    for (let i = 0; i < Math.min(chars.length, 6 - index); i++) {
      if (index + i < 6) {
        verificationCodes.value[index + i] = chars[i];
      }
    }

    // 聚焦到适当位置
    const nextIndex = Math.min(index + chars.length, 5);
    if (inputRefs.value[nextIndex]) {
      nextTick(() => {
        inputRefs.value[nextIndex].focus();
      });
    }
  } else {
    verificationCodes.value[index] = value;

    // 自动跳到下一个输入框
    if (value && index < 5) {
      nextTick(() => {
        if (inputRefs.value[index + 1]) {
          inputRefs.value[index + 1].focus();
        }
      });
    }
  }

  const _value = verificationCodes.value.join("");
  emit("onChange", _value);

  if (_value.length === 6) {
    emit("onComplete", _value);
    // 移除焦点以显示完成状态
    nextTick(() => {
      if (inputRefs.value[5]) {
        inputRefs.value[5].blur();
      }
    });
  }

  // 清除错误状态
  if (hasError.value) {
    hasError.value = false;
  }
};

// 键盘事件处理
const handleKeyDown = (index, event) => {
  // 处理删除操作
  if (event.key === "Backspace") {
    if (!verificationCodes.value[index] && index > 0) {
      // 当前输入框为空，删除前一个
      verificationCodes.value[index - 1] = "";
      nextTick(() => {
        if (inputRefs.value[index - 1]) {
          inputRefs.value[index - 1].focus();
        }
      });
    } else {
      // 清空当前输入框
      verificationCodes.value[index] = "";
    }

    const _value = verificationCodes.value.join("");
    emit("onChange", _value);
  }

  // 处理左右箭头键
  if (event.key === "ArrowLeft" && index > 0) {
    nextTick(() => {
      if (inputRefs.value[index - 1]) {
        inputRefs.value[index - 1].focus();
      }
    });
  }

  if (event.key === "ArrowRight" && index < 5) {
    nextTick(() => {
      if (inputRefs.value[index + 1]) {
        inputRefs.value[index + 1].focus();
      }
    });
  }
};

// 焦点处理
const handleFocus = index => {
  activeIndex.value = index;
  // 选中输入框中的内容
  nextTick(() => {
    if (inputRefs.value[index]) {
      inputRefs.value[index].select();
    }
  });
};

const handleBlur = index => {
  activeIndex.value = -1;
};

// 清空所有输入
const clearAll = () => {
  verificationCodes.value = ["", "", "", "", "", ""];
  hasError.value = false;
  const _value = verificationCodes.value.join("");
  emit("onChange", _value);

  // 聚焦到第一个输入框
  nextTick(() => {
    if (inputRefs.value[0]) {
      inputRefs.value[0].focus();
    }
  });
};

// 清空函数（保持向后兼容）
const clear = () => {
  clearAll();
};

// 设置错误状态
const setError = (error = true) => {
  hasError.value = error;
};

// 生命周期
onMounted(() => {
  // 为第一个输入框添加粘贴事件监听
  inputRefs.value.forEach(input => {
    if (input) {
      input.addEventListener("paste", handlePaste);
    }
  });

  // 自动聚焦第一个输入框
  nextTick(() => {
    if (inputRefs.value[0]) {
      inputRefs.value[0].focus();
    }
  });
});

onUnmounted(() => {
  // 清理事件监听
  inputRefs.value.forEach(input => {
    if (input) {
      input.removeEventListener("paste", handlePaste);
    }
  });
});

defineExpose({
  clear,
  clearAll,
  setError
});
</script>

<style lang="scss" scoped>
// 现代化动态验证码组件样式 - 完全适配 Element Plus 主题系统
.modern-otp-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 0;
  background: transparent;
  transition: all 0.3s ease;

  // 禁用状态
  &:has(.modern-otp-input:disabled) {
    opacity: 0.7;
    pointer-events: none;

    .otp-header {
      .otp-icon {
        opacity: 0.6;
        animation: none;
      }

      .otp-title,
      .otp-description {
        color: var(--el-text-color-disabled);
      }
    }

    .otp-footer {
      .paste-hint {
        color: var(--el-text-color-disabled);

        svg {
          opacity: 0.4;
        }
      }
    }
  }
}

// 头部区域
.otp-header {
  text-align: center;
  margin-bottom: 32px;

  .otp-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border-radius: 50%;
    margin-bottom: 16px;
    box-shadow:
      0 8px 24px rgba(var(--el-color-primary-rgb), 0.3),
      0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      background: conic-gradient(from 0deg, var(--el-color-primary-light-8), var(--el-color-primary-light-5), var(--el-color-primary-light-8));
      border-radius: 50%;
      z-index: -1;
      animation: rotate 3s linear infinite;
    }

    svg {
      width: 32px;
      height: 32px;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
  }

  .otp-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
    text-align: center;
    writing-mode: horizontal-tb;
  }

  .otp-description {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin: 0;
    text-align: center;
    writing-mode: horizontal-tb;
  }
}

// 表单区域
.modern-otp-form {
  margin-bottom: 24px;
}

.verification-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

// 现代化输入框样式
.modern-otp-input {
  width: 48px;
  height: 56px;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  // 基础状态
  &::placeholder {
    color: var(--el-text-color-placeholder);
    font-weight: 400;
  }

  // 悬停状态
  &:hover {
    border-color: var(--el-color-primary-light-7);
    background: var(--el-fill-color-extra-light);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.1);
  }

  // 聚焦状态
  &:focus,
  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-bg-color);
    box-shadow:
      0 0 0 4px var(--el-color-primary-light-8),
      0 4px 16px rgba(var(--el-color-primary-rgb), 0.2);
    transform: translateY(-2px) scale(1.05);
    z-index: 2;
  }

  // 已填充状态
  &.filled {
    border-color: var(--el-color-success);
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);

    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      background: var(--el-color-success);
      border-radius: 50%;
      opacity: 0.3;
      animation: pulse 2s ease-in-out infinite;
    }
  }

  // 错误状态
  &.error {
    border-color: var(--el-color-error);
    background: var(--el-color-error-light-9);
    color: var(--el-color-error);
    animation: shake 0.5s ease-in-out;

    &:focus {
      box-shadow:
        0 0 0 4px var(--el-color-error-light-8),
        0 4px 16px rgba(var(--el-color-error-rgb), 0.2);
    }
  }

  // 禁用状态
  &:disabled,
  &.disabled {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-extra-light);
    color: var(--el-text-color-disabled);
    cursor: not-allowed;
    opacity: 0.6;

    &:hover {
      transform: none;
      box-shadow: none;
      border-color: var(--el-border-color-extra-light);
      background: var(--el-fill-color-light);
    }

    &:focus {
      border-color: var(--el-border-color-extra-light);
      box-shadow: none;
      transform: none;
    }
  }
}

// 底部操作区域
.otp-footer {
  .otp-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    .clear-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: var(--el-fill-color-extra-light);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      color: var(--el-text-color-regular);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      writing-mode: horizontal-tb;

      svg {
        width: 14px;
        height: 14px;
        opacity: 0.7;
      }

      &:hover:not(:disabled) {
        background: var(--el-color-danger-light-9);
        border-color: var(--el-color-danger-light-7);
        color: var(--el-color-danger);
        transform: translateY(-1px);

        svg {
          opacity: 1;
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
          transform: none;
        }
      }
    }

    .paste-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      text-align: right;
      writing-mode: horizontal-tb;

      svg {
        width: 14px;
        height: 14px;
        opacity: 0.6;
      }
    }
  }
}

// 动画关键帧
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(2px);
  }
}

// 响应式设计
@media (max-width: 480px) {
  .modern-otp-container {
    padding: 0 16px;
  }

  .otp-header {
    margin-bottom: 24px;

    .otp-icon {
      width: 56px;
      height: 56px;
      margin-bottom: 12px;

      svg {
        width: 28px;
        height: 28px;
      }
    }

    .otp-title {
      font-size: 18px;
    }

    .otp-description {
      font-size: 13px;
    }
  }

  .verification-container {
    gap: 8px;
  }

  .modern-otp-input {
    width: 42px;
    height: 50px;
    font-size: 18px;
    border-radius: 10px;
  }

  .otp-footer {
    .otp-actions {
      flex-direction: column;
      gap: 12px;

      .clear-button {
        align-self: center;
      }

      .paste-hint {
        align-self: center;
        text-align: center;
      }
    }
  }
}

.exitBtn {
  position: absolute;
  top: 5px;
  right: 5px;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.171);
  background-color: rgb(255, 255, 255);
  border-radius: 50%;
  width: 25px;
  height: 25px;
  border: none;
  color: black;
  font-size: 1.1em;
  cursor: pointer;
}

.resendNote {
  font-size: 0.7em;
  color: black;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.resendBtn {
  background-color: transparent;
  border: none;
  color: rgb(127, 129, 255);
  cursor: pointer;
  font-size: 1.1em;
  font-weight: 700;
}

.verification-container {
  display: flex;
}

.verification-input {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  text-align: center;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.verification-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px #007bff;
}
</style>
