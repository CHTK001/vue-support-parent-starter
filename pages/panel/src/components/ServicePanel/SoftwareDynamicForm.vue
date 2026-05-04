<template>
  <div class="dynamic-form">
    <div class="config-fields-header">
      <span class="config-fields-title">配置字段</span>
      <ElButton size="small" type="primary" @click="showAddField = true">
        + 新增字段
      </ElButton>
    </div>

    <div v-if="configFields.length === 0" class="config-fields-empty">
      <ElEmpty description="暂无配置字段" :image-size="60" />
    </div>

    <div v-else class="config-fields-list">
      <div v-for="(field, index) in configFields" :key="index" class="config-field-item">
        <div class="field-item-left">
          <ElTag size="small" type="info">{{ field.componentType }}</ElTag>
          <span class="field-key">{{ field.fieldKey }}</span>
          <span class="field-label">{{ field.fieldLabel }}</span>
          <ElTag v-if="field.requiredFlag" size="small" type="danger">必填</ElTag>
        </div>
        <div class="field-item-right">
          <ElTooltip :content="field.description || ''" placement="top">
            <IconifyIconOnline icon="ep:info-filled" />
          </ElTooltip>
          <ElButton size="small" text type="danger" @click="removeField(index)">
            <IconifyIconOnline icon="ep:delete" />
          </ElButton>
        </div>
      </div>
    </div>

    <ElDialog
      v-model="showAddField"
      title="新增配置字段"
      width="480px"
      :close-on-click-modal="false"
    >
      <ElForm :model="newField" label-width="100px" label-position="top">
        <ElFormItem label="字段名称">
          <ElInput v-model="newField.fieldLabel" placeholder="如：端口" />
        </ElFormItem>
        <ElFormItem label="字段 Key">
          <ElInput v-model="newField.fieldKey" placeholder="如：port" />
        </ElFormItem>
        <ElFormItem label="组件类型">
          <ElSelect v-model="newField.componentType">
            <ElOption label="文本输入" value="input" />
            <ElOption label="数字输入" value="number" />
            <ElOption label="密码输入" value="password" />
            <ElOption label="开关" value="switch" />
            <ElOption label="下拉选择" value="select" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="newField.componentType === 'select'" label="选项列表">
          <ElInput
            v-model="selectOptionsText"
            type="textarea"
            :rows="3"
            placeholder="每行一个选项，格式：标签|值，如&#10;开启|1&#10;关闭|0"
          />
        </ElFormItem>
        <ElFormItem label="分组">
          <ElInput v-model="newField.groupName" placeholder="如：基础配置" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model="newField.description"
            type="textarea"
            :rows="2"
            placeholder="字段说明"
          />
        </ElFormItem>
        <ElFormItem label="默认值">
          <ElInput v-model="newField.defaultValue" placeholder="可选" />
        </ElFormItem>
        <ElFormItem label="是否必填">
          <ElSwitch v-model="newField.requiredFlag" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showAddField = false">取消</ElButton>
        <ElButton type="primary" @click="confirmAddField">确认新增</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTag,
  ElTooltip,
} from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { ConfigFieldDef } from "../../api/software";

const props = withDefaults(
  defineProps<{
    modelValue?: ConfigFieldDef[];
  }>(),
  { modelValue: () => [] },
);
const emit = defineEmits<{
  "update:modelValue": [value: ConfigFieldDef[]];
}>();

const configFields = ref<ConfigFieldDef[]>([...props.modelValue]);
const showAddField = ref(false);
const selectOptionsText = ref("");

const newField = reactive<ConfigFieldDef>({
  fieldKey: "",
  fieldLabel: "",
  componentType: "input",
  groupName: "基础配置",
  requiredFlag: false,
  defaultValue: "",
  description: "",
});

const removeField = (index: number) => {
  configFields.value.splice(index, 1);
  emit("update:modelValue", [...configFields.value]);
};

const confirmAddField = () => {
  if (!newField.fieldKey || !newField.fieldLabel) return;
  if (newField.componentType === "select" && selectOptionsText.value) {
    newField.options = selectOptionsText.value
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|");
        return { label: parts[0]?.trim() || "", value: parts[1]?.trim() || parts[0]?.trim() || "" };
      });
  }
  configFields.value.push({ ...newField });
  emit("update:modelValue", [...configFields.value]);
  showAddField.value = false;
  newField.fieldKey = "";
  newField.fieldLabel = "";
  newField.componentType = "input";
  newField.groupName = "基础配置";
  newField.requiredFlag = false;
  newField.defaultValue = "";
  newField.description = "";
  selectOptionsText.value = "";
};
</script>

<style scoped>
.dynamic-form {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px;
}
.config-fields-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.config-fields-title {
  font-weight: 600;
  font-size: 14px;
}
.config-fields-empty {
  padding: 20px 0;
}
.config-fields-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.config-field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  gap: 8px;
}
.field-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.field-key {
  font-family: monospace;
  font-size: 13px;
  color: var(--el-color-primary);
}
.field-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.field-item-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
