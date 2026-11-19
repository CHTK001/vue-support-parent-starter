<script setup lang="ts">
/**
 * RePromptDialog —— 统一输入弹窗（ReDialog 实现）
 *
 * 替代 Element Plus 原生 ElMessageBox.prompt：原生消息框 teleport 到 body 且层级独立，
 * 与 ReDialog 遮罩 / 全屏覆盖层并存时互相遮挡；本组件与 ReConfirmDialog 同一套
 * ReDialog 外壳，层级与主题保持一致。
 *
 * 用法（命令式）：
 *   const promptDialog = ref<InstanceType<typeof RePromptDialog>>();
 *   const input = await promptDialog.value?.open('请填写驳回理由', {
 *     title: '驳回题目', placeholder: '如：题干表述不清', validator: (v) => !!v || '理由不能为空',
 *   });
 *   if (input === null) return; // 取消或关闭
 *
 * open 返回 Promise<string | null>：点确定返回校验后的输入值（已 trim）；取消/关闭返回 null。
 */
import { ref, watch } from "vue";
import ReDialog from "@repo/ui/re-dialog";

const visible = ref(false);
const title = ref("请输入");
const message = ref("");
const placeholder = ref("");
const inputType = ref<"text" | "password">("text");
const confirmText = ref("确定");
const validator = ref<((value: string) => true | string) | null>(null);
const value = ref("");
const error = ref("");
let resolver: ((v: string | null) => void) | null = null;

/**
 * 打开输入弹窗
 *
 * @param msg  提示文案
 * @param opts 标题 / 占位提示 / 输入类型 / 确定按钮文案 / 校验器（返回 true 或错误提示）
 * @returns 点确定返回 trim 后的输入值；取消或关闭返回 null
 */
function open(
  msg: string,
  opts?: {
    title?: string;
    placeholder?: string;
    inputType?: "text" | "password";
    confirmText?: string;
    validator?: (value: string) => true | string;
  },
): Promise<string | null> {
  message.value = msg;
  title.value = opts?.title ?? "请输入";
  placeholder.value = opts?.placeholder ?? "";
  inputType.value = opts?.inputType ?? "text";
  confirmText.value = opts?.confirmText ?? "确定";
  validator.value = opts?.validator ?? null;
  value.value = "";
  error.value = "";
  visible.value = true;
  return new Promise<string | null>((resolve) => {
    resolver = resolve;
  });
}

/** 确认：先过校验器，通过才回传输入值（幂等：无 pending Promise 时只负责关闭） */
function done(v: boolean): void {
  if (!resolver) {
    visible.value = false;
    return;
  }
  if (v) {
    const raw = value.value.trim();
    const check = validator.value ? validator.value(raw) : true;
    if (check !== true) {
      error.value = check;
      return;
    }
    resolver(raw);
  } else {
    resolver(null);
  }
  resolver = null;
  visible.value = false;
}

/** 任何原因导致弹窗关闭（右上角 × / ESC）都按取消处理 */
watch(visible, (v) => {
  if (!v && resolver) {
    resolver(null);
    resolver = null;
  }
});

/** 输入变化即清除错误提示 */
watch(value, () => {
  error.value = "";
});

defineExpose({ open });
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="title"
    width="440px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <p class="rp-body">{{ message }}</p>
    <el-input
      v-model="value"
      :type="inputType"
      :placeholder="placeholder"
      :show-password="inputType === 'password'"
      :clearable="inputType !== 'password'"
      @keyup.enter="done(true)"
    />
    <p v-if="error" class="rp-error">{{ error }}</p>
    <template #footer>
      <el-button @click="done(false)">取消</el-button>
      <el-button type="primary" @click="done(true)">{{ confirmText }}</el-button>
    </template>
  </ReDialog>
</template>

<style scoped>
.rp-body {
  margin: 0 0 10px;
  padding: 0 2px;
  line-height: 1.6;
  word-break: break-word;
}
.rp-error {
  margin: 6px 2px 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-color-danger);
}
</style>
