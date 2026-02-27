<template>
  <div class="sc-secret-input">
    <ScInput v-model="innerValue" type="textarea" :rows="rows" :disabled="disabled" :placeholder="placeholder" :show-password="false" class="secret-textarea" />

    <div class="secret-actions" v-if="!disabled">
      <ScButton type="primary" plain size="small" @click="generateSecret" class="generate-btn">
        <IconifyIconOnline icon="ep:refresh-right" />
        生成新密钥
      </ScButton>

      <ScButton type="info" plain size="small" @click="copySecret" class="copy-btn">
        <IconifyIconOnline icon="ep:document-copy" />
        复制密钥
      </ScButton>
    </div>

    <div class="secret-info">
      <IconifyIconOnline icon="ep:info-filled" class="info-icon" />
      <span>密钥用于API认证，请妥善保管，不要泄露给他人</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { message } from "@repo/utils";

/**
 * 组件属性定义
 */
interface Props {
  modelValue: string; // 绑定值
  disabled?: boolean; // 是否禁用
  placeholder?: string; // 占位文本
  rows?: number; // 文本域行数
  length?: number; // 生成密钥的长度
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  disabled: false,
  placeholder: "请输入或生成密钥",
  rows: 3,
  length: 32,
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 内部值，用于双向绑定
 */
const innerValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

/**
 * 生成随机密钥
 */
const generateSecret = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // 添加前缀
  result = "sk_";

  // 生成随机字符
  for (let i = 0; i < props.length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  innerValue.value = result;
  message("已生成新密钥", { type: "success" });
};

/**
 * 复制密钥到剪贴板
 */
const copySecret = () => {
  if (!innerValue.value) {
    message("没有可复制的密钥", { type: "warning" });
    return;
  }

  navigator.clipboard
    .writeText(innerValue.value)
    .then(() => {
      message("密钥已复制到剪贴板", { type: "success" });
    })
    .catch(() => {
      message("复制失败，请手动复制", { type: "error" });
    });
};
</script>

<style lang="scss">
.sc-secret-input {
  .secret-textarea {
    font-family: monospace;

    .el-textarea__inner {
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
      }

      &:focus {
        box-shadow: 0 0 0 1px var(--el-color-primary);
      }
    }
  }

  .secret-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;

    .generate-btn,
    .copy-btn {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }

  .secret-info {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 12px;
    background-color: var(--el-color-info-light-9);
    border-radius: 4px;
    font-size: 12px;
    color: var(--el-color-info-dark-2);

    .info-icon {
      color: var(--el-color-info);
    }
  }
}
</style>
