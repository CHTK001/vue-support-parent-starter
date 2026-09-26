<script setup lang="ts">
/**
 * 模板新增/编辑弹窗组件
 *
 * 通过 v-model:visible 控制显隐，v-model:model 绑定当前行数据，
 * 提供模板基本字段录入与校验，保存成功后通过 save 事件通知父组件刷新列表。
 */
import { reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { saveTemplate, updateTemplate } from "../api/messageApi";
import type { MessageProvider, MessageTemplate } from "../api/types";

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
    ElMessage.success(isEdit.value ? "更新成功" : "新增成功");
    visible.value = false;
    emit("save");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <el-dialog
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
        <el-input
          v-model="model.sysMessageTemplateContent"
          type="textarea"
          :rows="4"
          placeholder="模板内容，变量用 ${var} 表示"
        />
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
  </el-dialog>
</template>
