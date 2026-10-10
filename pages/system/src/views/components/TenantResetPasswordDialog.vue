<script setup lang="ts">
/**
 * 租户重置密码弹窗组件
 *
 * 通过 v-model:visible 控制显隐，props 传入目标租户。
 * 重置后后端推送给租户端，租户端登录账号密码同步更新。
 */
import { message } from "@repo/core";
import { ref, watch } from "vue";

import { resetTenantPassword } from "../../api/systemApi";
import type { SysTenant } from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";

const visible = defineModel<boolean>("visible", { required: true });

const props = defineProps<{
  /** 目标租户 */
  tenant: SysTenant;
}>();

const emit = defineEmits<{
  (e: "success"): void;
}>();

const newPassword = ref("");

/** 打开弹窗时清空密码输入 */
watch(
  () => visible.value,
  (open) => {
    if (open) {
      newPassword.value = "";
    }
  },
);

/** 确认重置 */
async function handleSubmit() {
  if (!newPassword.value) {
    message.warning("请输入新密码");
    return;
  }
  await resetTenantPassword(props.tenant.sysTenantId ?? "", newPassword.value);
  message.success("密码已重置并推送租户端");
  visible.value = false;
  emit("success");
}
</script>

<template>
  <ReDialog v-model="visible" :title="`重置密码 - ${tenant.sysTenantName}`" width="420px" destroy-on-close>
    <p class="mb-3 text-sm text-[--el-text-color-secondary]">重置后将推送租户端，租户端登录账号密码同步更新</p>
    <el-input
      v-model="newPassword"
      type="password"
      show-password
      placeholder="请输入新密码"
      @keyup.enter="handleSubmit"
    />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认重置</el-button>
    </template>
  </ReDialog>
</template>
