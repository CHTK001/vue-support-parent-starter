<template>
  <ReDialog
    v-model="visible"
    :title="title"
    width="360px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
    class="otp-dialog"
  >
    <div class="otp-dialog-content">
      <div class="otp-dialog-icon">
        <el-icon :size="28"><Lock /></el-icon>
      </div>
      <div class="otp-dialog-desc">
        {{ $t("menu.login.totpTip") }}
      </div>

      <div class="otp-dialog-cells-wrap">
        <ReOtpInput
          ref="otpInputRef"
          v-model="otpCode"
          @complete="onComplete"
        />
      </div>

      <div class="otp-dialog-footer">
        <el-button text @click="visible = false">
          <span class="otp-cancel-text">{{ $t("menu.login.otpCancel") }}</span>
        </el-button>
        <el-button
          type="primary"

          :disabled="otpCode.length !== 6"
          @click="onConfirm"
        >
          {{ $t("menu.login.otpConfirm") }}
        </el-button>
      </div>
    </div>
  </ReDialog>
</template>

<script lang="ts" setup>
import { Lock } from "@element-plus/icons-vue";
import { ref, nextTick } from "vue";
import ReOtpInput from "./ReOtpInput.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const visible = ref(false);
const otpCode = ref("");
const otpInputRef = ref<InstanceType<typeof ReOtpInput>>();

const title = t("menu.login.otpTitle");

const emit = defineEmits<{
  (e: "confirm", code: string): void;
}>();

async function open(): Promise<void> {
  otpCode.value = "";
  visible.value = true;
  await nextTick();
  otpInputRef.value?.focus();
}

function onComplete(_value: string): void {
  if (otpCode.value.length === 6) {
    onConfirm();
  }
}

function onConfirm(): void {
  if (otpCode.value.length !== 6) return;
  emit("confirm", otpCode.value);
  visible.value = false;
}

defineExpose({ open });
</script>

<style lang="scss" scoped>
.otp-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px 0;
    margin-right: 0;
  }

  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  :deep(.el-dialog__body) {
    padding: 8px 24px 24px;
  }
}

.otp-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.otp-dialog-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.otp-dialog-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
  line-height: 1.6;
}

.otp-dialog-cells-wrap {
  width: 100%;
}

.otp-dialog-footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.otp-cancel-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--el-text-color-primary);
  }
}
</style>