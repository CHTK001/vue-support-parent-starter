<template>
  <div>
    <el-dialog v-model="visible" draggable title="设置默认" width="400px">
      <el-form>
        <el-form-item v-for="item in currentValue" :key="item.value" prop="label" :label="item.label">
          <el-segmented
            v-model="defaultValue[item.value]"
            :options="[
              {
                value: false,
                label: '否'
              },
              {
                value: true,
                label: '是'
              }
            ]"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :icon="useRenderIcon('ri:save-2-line')" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchUpdateProject } from "@/api/manage/project";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message, stringSplitToNumber } from "@repo/utils";
import { defineExpose, ref, reactive, defineEmits } from "vue";

const emit = defineEmits(["success"]);
const visible = ref(false);
let defaultValue = reactive({});
let form = reactive({});
let options = reactive([]);
let currentValue = reactive([]);
const handleClose = async () => {
  visible.value = false;
  form = reactive({});
  options = reactive([]);
};
const handleSubmit = async () => {
  console.log(defaultValue);
  const defaultValueArr = Object.keys(defaultValue).map(key => {
    return defaultValue[key] ? key : 0;
  });
  form.sysProjectFunctionDefaultIds = defaultValueArr;
  fetchUpdateProject(form).then(res => {
    if (res.code == "00000") {
      message("修改成功", { type: "success" });
      handleClose();
      emit("success", res?.data);
      return;
    }
  });
};
const handleType = async items => {
  options = items.map(item => {
    return {
      label: item.sysDictItemName,
      value: item.sysDictItemId,
      key: item.sysDictItemId
    };
  });
};
const handleOpen = async data => {
  visible.value = true;
  Object.assign(form, data);
  const storeValues1 = stringSplitToNumber(form.sysProjectFunctionDefaultIds);
  storeValues1.forEach(element => {
    defaultValue[element] = true;
  });
  const storeValues = stringSplitToNumber(form.sysProjectFunction);
  currentValue = options.filter(item => {
    return storeValues.includes(item.value);
  });
};

defineExpose({
  handleClose,
  handleType,
  handleOpen
});
</script>
