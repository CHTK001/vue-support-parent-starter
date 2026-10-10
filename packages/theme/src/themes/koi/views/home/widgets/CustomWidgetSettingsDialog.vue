<!--
  CustomWidgetSettingsDialog - 自定义 widget 配置对话框

  编辑模式下允许用户配置：title、url、heightMode、fixedHeight、scrolling
  保存后通过 emit('save', config) 把新配置交给父组件。
-->
<script setup lang="ts">
import { message } from "@repo/core";
import { reactive, ref, watch } from "vue";

import type { CustomWidgetConfig } from "../widgets";
import ReDialog from "@repo/ui/re-dialog";

interface Props {
  modelValue: boolean;
  initialConfig?: CustomWidgetConfig;
}

const props = withDefaults(defineProps<Props>(), {
  initialConfig: () => ({}),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", config: CustomWidgetConfig): void;
}>();

interface FormState extends CustomWidgetConfig {
  title: string;
  url: string;
  heightMode: "fill" | "fixed";
  fixedHeight: number;
  scrolling: "auto" | "yes" | "no";
}

const form = reactive<FormState>({
  title: "",
  url: "",
  heightMode: "fill",
  fixedHeight: 360,
  scrolling: "auto",
});

const formRef = ref();

const formRules = {
  url: [
    { required: true, message: "请输入链接地址", trigger: "blur" },
    { type: "url", message: "请输入合法的 URL", trigger: "blur" },
  ],
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
  fixedHeight: [{ required: true, message: "请输入固定高度", trigger: "blur" }],
};

watch(
  () => [props.modelValue, props.initialConfig] as const,
  ([open, cfg]) => {
    if (!open) return;
    form.title = cfg?.title ?? "";
    form.url = cfg?.url ?? "";
    form.heightMode = cfg?.heightMode ?? "fill";
    form.fixedHeight = cfg?.fixedHeight ?? 360;
    form.scrolling = cfg?.scrolling ?? "auto";
  },
  { immediate: true },
);

function close(): void {
  emit("update:modelValue", false);
}

async function handleSave(): Promise<void> {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    message.warning("请检查表单输入");
    return;
  }
  const payload: CustomWidgetConfig = {
    url: form.url,
    title: form.title,
    heightMode: form.heightMode,
    fixedHeight: form.heightMode === "fixed" ? form.fixedHeight : undefined,
    scrolling: form.scrolling,
  };
  emit("save", payload);
  emit("update:modelValue", false);
}
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    title="自定义 widget 配置"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @close="close"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="84px"
      label-position="right"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="显示在组件头部的标题" maxlength="32" />
      </el-form-item>
      <el-form-item label="链接" prop="url">
        <el-input
          v-model="form.url"
          placeholder="https://example.com/embed"
          clearable
        />
      </el-form-item>
      <el-form-item label="高度模式" prop="heightMode">
        <el-radio-group v-model="form.heightMode">
          <el-radio value="fill">自适应铺满</el-radio>
          <el-radio value="fixed">固定高度</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.heightMode === 'fixed'" label="固定高度" prop="fixedHeight">
        <el-input-number
          v-model="form.fixedHeight"
          :min="120"
          :max="2000"
          :step="20"
          controls-position="right"
        />
        <span style="margin-left: 8px; color: var(--el-text-color-secondary);">px</span>
      </el-form-item>
      <el-form-item label="滚动条" prop="scrolling">
        <el-radio-group v-model="form.scrolling">
          <el-radio value="auto">自动</el-radio>
          <el-radio value="yes">始终显示</el-radio>
          <el-radio value="no">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </ReDialog>
</template>