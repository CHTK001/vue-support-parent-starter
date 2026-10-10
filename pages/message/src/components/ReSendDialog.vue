<script setup lang="ts">
/**
 * 按模板发送消息弹窗组件
 *
 * 通过 v-model:visible 控制显隐，v-model:model 绑定当前模板。
 * 支持发送前预览渲染结果，未填充的占位符会高亮提示。
 * 发送完成后通过 success 事件通知父组件。
 */
import { message } from "@repo/core";
import { reactive, ref, watch } from "vue";

import { previewTemplate, sendMessage } from "../api/messageApi";
import type { MessageTemplate, TemplatePreviewResponse } from "../api/types";
import ReDialog from "@repo/ui/re-dialog";

const visible = defineModel<boolean>("visible", { required: true });

const model = defineModel<MessageTemplate | null>("model", { required: true });

const emit = defineEmits<{
  (e: "success"): void;
}>();

const sending = ref(false);
const previewing = ref(false);

const sendForm = reactive<{ target: string; subject: string; params: string }>({
  target: "",
  subject: "",
  params: "{}",
});

// 预览结果
const previewVisible = ref(false);
const previewResult = ref<TemplatePreviewResponse | null>(null);

// 打开弹窗时重置表单
watch(
  () => visible.value,
  (open) => {
    if (open) {
      sendForm.target = "";
      sendForm.subject = "";
      sendForm.params = "{}";
      previewResult.value = null;
    }
  },
);

/** 解析参数 JSON，非法时返回 null 并提示 */
function parseParams(): Record<string, unknown> | null {
  try {
    return JSON.parse(sendForm.params || "{}");
  } catch {
    message.error("参数不是合法的 JSON");
    return null;
  }
}

/** 预览渲染结果 */
async function handlePreview() {
  if (!model.value) return;
  const params = parseParams();
  if (!params) return;
  previewing.value = true;
  try {
    const res = await previewTemplate({
      sysMessageTemplateId: model.value.sysMessageTemplateId,
      params,
    });
    previewResult.value = res?.data ?? null;
    previewVisible.value = true;
  } finally {
    previewing.value = false;
  }
}

/** 发送 */
async function handleSend() {
  if (!model.value) return;
  const params = parseParams();
  if (!params) return;
  sending.value = true;
  try {
    const res = await sendMessage({
      sysMessageTemplateId: model.value.sysMessageTemplateId,
      subject: sendForm.subject || undefined,
      target: sendForm.target
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      params,
    });
    const failed = (res?.data ?? []).filter((r) => !r.success);
    if (failed.length === 0) {
      message.success("发送成功");
    } else {
      message.warning(`部分发送失败：${failed.map((r) => r.errorMessage).join("; ")}`);
    }
    visible.value = false;
    emit("success");
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="`发送：${model?.sysMessageTemplateName ?? ''}`"
    width="560px"
  >
    <el-form label-width="90px">
      <el-form-item label="接收人">
        <el-input v-model="sendForm.target" placeholder="多个接收人用英文逗号分隔" />
      </el-form-item>
      <el-form-item label="主题">
        <el-input v-model="sendForm.subject" placeholder="邮件标题等（可选）" />
      </el-form-item>
      <el-form-item label="参数">
        <el-input
          v-model="sendForm.params"
          type="textarea"
          :rows="4"
          placeholder='JSON，如 {"code":"123456"}'
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="previewing" @click="handlePreview">预览</el-button>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="sending" @click="handleSend">发送</el-button>
    </template>

    <!-- 预览结果弹窗 -->
    <ReDialog
      v-model="previewVisible"
      title="渲染预览"
      width="560px"
      append-to-body
      destroy-on-close
    >
      <el-alert
        v-if="previewResult && !previewResult.complete"
        :title="`存在未填充占位符：${(previewResult.unresolvedParams ?? []).join(', ')}`"
        type="warning"
        :closable="false"
        class="mb-4"
      />
      <el-alert
        v-if="previewResult && previewResult.complete"
        title="模板参数填充完整"
        type="success"
        :closable="false"
        class="mb-4"
      />
      <div class="rounded-xl bg-[--el-fill-color-light] p-4">
        <pre class="whitespace-pre-wrap text-sm text-[--el-text-color-primary] leading-relaxed">{{
          previewResult?.content ?? ""
        }}</pre>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </ReDialog>
  </ReDialog>
</template>
