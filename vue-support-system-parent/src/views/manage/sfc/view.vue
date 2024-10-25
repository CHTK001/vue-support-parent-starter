<template>
  <div>
    <el-dialog v-model="visible" :title="$t('buttons.view')" draggable width="600px" @close="onClose">
      <span>这事一个消息</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button size="small" @click="onClose">取 消</el-button>
          <el-button size="small" type="primary" :loading="confirmLoading" @click="handleSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, defineEmits, defineExpose, reactive } from "vue";
const emit = defineEmits(["close"]);

const visible = ref(false);
const dataReact = reactive({});

const handleSubmit = async () => {
  debugger;
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
};

const open = async () => {
  visible.value = true;
};

defineExpose({
  setData,
  open
});
</script>
