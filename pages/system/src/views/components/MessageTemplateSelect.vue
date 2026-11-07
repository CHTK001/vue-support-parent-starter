<template>
  <ReSelect
    v-model="code"
    class="message-template-select"
    :data="options"
    :loading="loading"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    @update:model-value="onPick"
  />
</template>

<script setup lang="ts">
/**
 * 消息模板选择器（系统消息模板 / sys_message_template）
 *
 * 数据源是消息管理「消息模板」页签维护的那套模板（`/v2/message/template/list`），
 * 与模板库（pages/template 的 `/api/channels/templates`）不是同一张表，切勿混用。
 *
 * 用法：
 *   <MessageTemplateSelect v-model="form.templateCode" @change="onPick" />
 *   <MessageTemplateSelect v-model="code" channel="SMS" />
 *
 * `@change` 回传完整模板对象（清空时为 undefined），供调用方回填标题 / 正文等字段。
 * 组件打开即拉取一次列表（父级弹框用 destroy-on-close 时每次都拿到最新数据），
 * 需要手动刷新可调用 expose 出去的 `reload()`。
 */
import { computed, onMounted, ref } from "vue";
import ReSelect from "@repo/ui/re-select";
import { listForMessageTemplate } from "../../api/systemApi";
import type { SysMessageTemplate } from "../../api/types";

const props = withDefaults(
  defineProps<{
    /** 渠道过滤：SMS / EMAIL；留空表示不过滤。未标注渠道的模板在任何渠道下都可见 */
    channel?: string;
    /** 只列启用中的模板（默认 true；编辑页等需要回显停用模板时传 false） */
    onlyEnabled?: boolean;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
  }>(),
  {
    channel: "",
    onlyEnabled: true,
    placeholder: "选择模板自动填充",
    clearable: true,
    disabled: false,
    filterable: true,
  },
);

const emit = defineEmits<{
  /** 选中变化：回传完整模板对象与模板编码（清空时 template 为 undefined） */
  (e: "change", template: SysMessageTemplate | undefined, code?: string): void;
}>();

const code = defineModel<string | undefined>({ default: "" });

const templates = ref<SysMessageTemplate[]>([]);
const loading = ref(false);

/** 渠道 + 启用状态过滤后的选项 */
const options = computed(() =>
  templates.value
    .filter((t) => {
      if (props.onlyEnabled && t.sysMessageTemplateStatus !== undefined && t.sysMessageTemplateStatus !== 1) {
        return false;
      }
      if (!props.channel) return true;
      return !t.sysMessageChannel || t.sysMessageChannel === props.channel;
    })
    .map((t) => ({
      label: t.sysMessageTemplateName || t.sysMessageTemplateCode,
      value: t.sysMessageTemplateCode,
    })),
);

async function load() {
  loading.value = true;
  try {
    const res = await listForMessageTemplate();
    templates.value = (res?.data ?? []) as SysMessageTemplate[];
  } catch (e) {
    console.warn("[message-template-select] 模板列表加载失败", e);
  } finally {
    loading.value = false;
  }
}

function onPick(value: string | number | (string | number)[] | null | undefined) {
  const picked = typeof value === "string" ? value : "";
  const template = picked
    ? templates.value.find((t) => t.sysMessageTemplateCode === picked)
    : undefined;
  emit("change", template, picked || undefined);
}

onMounted(load);

defineExpose({ reload: load });
</script>

<style scoped>
.message-template-select {
  width: 100%;
}
</style>
