<script setup lang="ts">
/**
 * 模板新增/编辑弹窗组件
 *
 * 通过 v-model:visible 控制显隐，v-model:model 绑定当前行数据，
 * 提供模板基本字段录入与校验，保存成功后通过 save 事件通知父组件刷新列表。
 */
import { message } from "@repo/core";
import { computed, nextTick, reactive, ref, watch } from "vue";

import type { FormInstance, FormRules, InputInstance } from "element-plus";
import { saveTemplate, updateTemplate } from "../api/messageApi";
import type { MessageProvider, MessageTemplate } from "../api/types";
import ReDialog from "@repo/ui/re-dialog";

const visible = defineModel<boolean>("visible", { required: true });

const model = defineModel<MessageTemplate>("model", { required: true });

defineProps<{
  /** 提供商列表（用于下拉选择） */
  providers: MessageProvider[];
}>();

const emit = defineEmits<{
  (e: "save"): void;
}>();

const saving = ref(false);
const formRef = ref<FormInstance>();

const rules = reactive<FormRules>({
  sysMessageProviderId: [
    { required: true, message: "请选择提供商", trigger: "change" },
  ],
  sysMessageTemplateCode: [
    { required: true, message: "请输入模板编码", trigger: "blur" },
  ],
  sysMessageTemplateName: [
    { required: true, message: "请输入模板名称", trigger: "blur" },
  ],
  sysMessageTemplateContent: [
    { required: true, message: "请输入模板内容", trigger: "blur" },
  ],
});

const isEdit = ref(false);

/** 常用模板变量：点击插入到内容光标处（仅快捷建议，实际可用变量以后端模板引擎为准） */
const COMMON_VARS = ["userName", "nickname", "code", "time", "date", "link", "orderNo", "amount"] as const;

const contentInputRef = ref<InputInstance>();

/** 把 ${name} 插入模板内容当前光标处（取不到光标时追加到末尾） */
function insertVariable(name: string) {
  const token = "${" + name + "}";
  const cur = model.value.sysMessageTemplateContent ?? "";
  const ta = contentInputRef.value?.textarea;
  const start = ta?.selectionStart ?? cur.length;
  const end = ta?.selectionEnd ?? start;
  model.value.sysMessageTemplateContent = cur.slice(0, start) + token + cur.slice(end);
  void nextTick(() => {
    ta?.focus();
    ta?.setSelectionRange(start + token.length, start + token.length);
  });
}

/** 预览分段：按 ${var} 切分模板内容，变量段高亮展示（纯文本分段渲染，不走 v-html） */
const previewSegments = computed(() => {
  const text = model.value.sysMessageTemplateContent ?? "";
  if (!text) return [];
  const segments: Array<{ text: string; isVar: boolean }> = [];
  const re = /\$\{([^}]*)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index), isVar: false });
    segments.push({ text: m[0], isVar: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), isVar: false });
  return segments;
});

// 打开弹窗时根据 model 判断新增/编辑
watch(
  () => visible.value,
  (open) => {
    if (open) {
      isEdit.value = !!model.value?.sysMessageTemplateId;
    }
  },
);

/** 保存 */
async function handleSave() {
  if (!formRef.value) return;
  await formRef.value.validate();
  saving.value = true;
  try {
    if (model.value?.sysMessageTemplateId) {
      await updateTemplate({ ...model.value });
    } else {
      await saveTemplate({ ...model.value });
    }
    message.success(isEdit.value ? "更新成功" : "新增成功");
    visible.value = false;
    emit("save");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="isEdit ? '编辑模板' : '新增模板'"
    width="640px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="model" :rules="rules" label-width="110px">
      <el-form-item label="提供商" prop="sysMessageProviderId">
        <el-select v-model="model.sysMessageProviderId" placeholder="请选择" class="!w-full">
          <el-option
            v-for="p in providers"
            :key="p.sysMessageProviderId"
            :label="p.sysMessageProviderName"
            :value="p.sysMessageProviderId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模板编码" prop="sysMessageTemplateCode">
        <el-input v-model="model.sysMessageTemplateCode" placeholder="模板唯一标识" />
      </el-form-item>
      <el-form-item label="模板名称" prop="sysMessageTemplateName">
        <el-input v-model="model.sysMessageTemplateName" placeholder="模板名称" />
      </el-form-item>
      <el-form-item label="模板标题">
        <el-input
          v-model="model.sysMessageTemplateTitle"
          placeholder="消息标题/邮件主题，支持 ${param} 占位符"
        />
      </el-form-item>
      <el-form-item label="模板类型">
        <el-input v-model="model.sysMessageTemplateType" placeholder="EMAIL / SMS / WECHAT 等" />
      </el-form-item>
      <el-form-item label="模板内容" prop="sysMessageTemplateContent">
        <div class="tpl-content-wrap">
          <el-input
            ref="contentInputRef"
            v-model="model.sysMessageTemplateContent"
            type="textarea"
            :rows="4"
            placeholder="模板内容，变量用 ${var} 表示"
          />
          <div class="tpl-var-bar">
            <span class="tpl-var-bar__label">常用变量</span>
            <el-tag
              v-for="v in COMMON_VARS"
              :key="v"
              class="tpl-var-tag"
              size="small"
              effect="plain"
              @click="insertVariable(v)"
            >
              {{ "${" + v + "}" }}
            </el-tag>
          </div>
          <div v-if="previewSegments.length" class="tpl-preview">
            <span class="tpl-preview__label">预览</span>
            <span class="tpl-preview__body">
              <template v-for="(seg, i) in previewSegments" :key="i">
                <mark v-if="seg.isVar" class="tpl-preview__var">{{ seg.text }}</mark>
                <span v-else>{{ seg.text }}</span>
              </template>
            </span>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="回调地址">
        <el-input v-model="model.sysMessageTemplateCallbackUrl" placeholder="邮件状态回调 URL" />
      </el-form-item>
      <el-form-item label="排序号">
        <el-input-number v-model="model.sysMessageTemplateSort" :min="0" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="model.sysMessageTemplateRemark" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </ReDialog>
</template>

<style scoped>
.tpl-content-wrap {
  width: 100%;
}

.tpl-var-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.tpl-var-bar__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tpl-var-tag {
  cursor: pointer;
  user-select: none;
}

.tpl-var-tag:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.tpl-preview {
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  font-size: 13px;
  line-height: 1.7;
  word-break: break-all;
}

.tpl-preview__label {
  margin-right: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tpl-preview__var {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>
