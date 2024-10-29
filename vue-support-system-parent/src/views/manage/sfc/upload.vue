<template>
  <div>
    <el-dialog v-model="visible" :title="title" draggable @close="onClose">
      <el-upload class="upload-demo" drag action="#" accept=".vue" :auto-upload="false" @change="handleChange">
        <el-icon class="el-icon--upload">
          <component :is="useRenderIcon('ep:upload')" />
        </el-icon>
        <div class="el-upload__text">
          Drop file here or
          <em>click to upload</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">vue file with a size less than 500kb</div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchUploadSfc } from "@/api/manage/sfc";
import { ref, defineEmits, defineExpose, reactive } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks.ts";
import { message } from "@/utils/message";
const emit = defineEmits(["close"]);
const title = ref("");
const uploadRef = ref();
const visible = ref(false);
const dataReact = reactive({
  data: {}
});
const remote = ref();

const handleChange = async raw => {
  fetchUploadSfc(raw.raw, dataReact.data).then(res => {
    message(res?.code === "00000" ? "上传成功" : res?.message, { type: res?.code === "00000" ? "success" : "error" });
    if (res?.code === "00000") {
      onClose();
    }
  });
};
/**
 * 关闭弹窗
 */
const onClose = async () => {
  emit("close");
  visible.value = false;
};
const setData = async data => {
  Object.assign(dataReact.data, data);
  title.value = dataReact.data.sysSfcChineseName + "[上传组件]";
};

const open = async () => {
  visible.value = true;
};

defineExpose({
  setData,
  open
});
</script>
