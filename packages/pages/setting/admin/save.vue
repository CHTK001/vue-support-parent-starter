<script setup>
import { defineExpose, defineEmits, reactive, ref } from "vue";
import { fetchUpdateSetting, fetchSaveSetting } from "@repo/core";
import { $t } from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
const config = reactive({
  visible: false,
  mode: "edit",
  rules: {
    sysSettingName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
    sysSettingValueType: [{ required: true, message: "请输入配置值类型", trigger: "blur" }],
    sysSettingGroup: [{ required: true, message: "请输入配置所属分组", trigger: "blur" }],
  },
  valueType: [
    { value: "String", label: "字符串" },
    { value: "Number", label: "数字" },
    { value: "Boolean", label: "布尔" },
    { value: "Array", label: "数组" },
    { value: "TextArea", label: "文本" },
    { value: "Dict", label: "字典" },
    { value: "Color", label: "颜色" },
    { value: "Mail", label: "邮件" },
    { value: "Password", label: "密码" },
    { value: "AppSecret", label: "密钥" },
    { value: "Object", label: "对象" },
  ],
  data: {
    sysSettingValue: null,
    sysSettingValueType: null,
  },
  title: $t("title.setting"),
});

const emit = defineEmits(["close"]);
const itemSaveRef = ref();
const open = (mode) => {
  config.visible = true;
  config.mode = mode;
};

const handleClose = () => {
  config.visible = false;
  emit("close");
};

const handleUpdate = async () => {
  fetchUpdateSetting(config.data).then((res) => {
    if (res.code == "00000") {
      message($t("message.updateSuccess"), { type: "success" });
      config.visible = false;
    }
  });
};
const handleSave = async () => {
  itemSaveRef.value.validate(async (valid) => {
    if (valid) {
      fetchSaveSetting(config.data).then((res) => {
        if (res.code == "00000") {
          message($t("message.updateSuccess"), { type: "success" });
          config.visible = false;
        }
      });
    }
  });
};

const handle = () => {
  if (config.mode == "edit") {
    handleUpdate();
  } else {
    handleSave();
  }
};
const setData = async (data) => {
  config.data = data;
};
defineExpose({
  setData,
  open,
});
</script>

<template>
  <div>
    <el-dialog v-model="config.visible" :title="config.title" draggable :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" @close="handleClose">
      <el-form v-if="config.mode == 'edit'" :rules="config.rules" :model="config.data" class="w-full" :label-width="120">
        <el-form-item label="数据分组" prop="sysSettingGroup">
          <el-input v-model="config.data.sysSettingGroup" placeholder="请输入配置所属分组" />
        </el-form-item>
        <el-form-item label="名称" prop="sysSettingName">
          <el-input v-model="config.data.sysSettingName" placeholder="请输入配置名称" />
        </el-form-item>

        <el-form-item label="数据类型" prop="sysSettingValueType">
          <el-select v-model="config.data.sysSettingValueType" placeholder="请选择">
            <el-option v-for="item in config.valueType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="数据值" prop="sysSettingValue">
          <el-switch v-if="config.data.sysSettingValueType == 'Boolean'" v-model="config.data.sysSettingValue" active-value="true" inactive-value="false" />
          <el-input v-else-if="config.data.sysSettingValueType == 'Number'" v-model="config.data.sysSettingValue" type="number" placeholder="请输入配置值" />
          <el-input v-else-if="config.data.sysSettingValueType == 'AppSecret'" v-model="config.data.sysSettingValue" :rows="5" type="textarea" placeholder="请输入配置值" />
          <el-input v-else v-model="config.data.sysSettingValue" class="w-full" placeholder="请输入配置值" />
        </el-form-item>

        <el-form-item label="描述" prop="sysSettingRemark">
          <el-input v-model="config.data.sysSettingRemark" placeholder="请输入描述" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="数据优先级" prop="sysSettingSort">
          <el-input v-model="config.data.sysSettingSort" placeholder="请输入数据优先级" type="number" />
        </el-form-item>
      </el-form>
      <el-form v-if="config.mode == 'add'" ref="itemSaveRef" :model="config.data" :rules="config.rules" :label-width="120">
        <el-form-item label="数据分组" prop="sysSettingGroup">
          <el-input v-model="config.data.sysSettingGroup" placeholder="请输入配置所属分组" />
        </el-form-item>
        <el-form-item label="名称" prop="sysSettingName">
          <el-input v-model="config.data.sysSettingName" placeholder="请输入配置名称" />
        </el-form-item>

        <el-form-item label="数据类型" prop="sysSettingValueType">
          <el-select v-model="config.data.sysSettingValueType" placeholder="请选择">
            <el-option v-for="item in config.valueType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="数据值" prop="sysSettingValue">
          <el-input v-model="config.data.sysSettingValue" placeholder="请输入配置值" />
        </el-form-item>

        <el-form-item label="描述" prop="sysSettingRemark">
          <el-input v-model="config.data.sysSettingRemark" placeholder="请输入描述" type="textarea" :rows="5" />
        </el-form-item>

        <el-form-item label="数据优先级" prop="sysSettingSort">
          <el-input v-model="config.data.sysSettingSort" placeholder="请输入数据优先级" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :icon="useRenderIcon('ri:save-line')" @click="handle">
          {{ $t("button.save") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss"></style>
