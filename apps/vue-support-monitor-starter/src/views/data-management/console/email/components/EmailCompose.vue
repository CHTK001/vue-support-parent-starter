<template>
  <div class="compose-area">
    <div class="compose-header">
      <h3>撰写邮件</h3>
      <div class="compose-actions">
        <el-button size="small" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" size="small" @click="handleSend">发�?/el-button>
        <el-button size="small" @click="handleClose">关闭</el-button>
      </div>
    </div>
    <div class="compose-form">
      <div class="form-row">
        <label>收件人：</label>
        <el-input v-model="form.to" placeholder="输入收件人邮箱地址，多个用逗号分隔" />
      </div>
      <div class="form-row">
        <label>抄送：</label>
        <el-input v-model="form.cc" placeholder="抄送邮箱地址" />
      </div>
      <div class="form-row">
        <label>主题�?/label>
        <el-input v-model="form.subject" placeholder="邮件主题" />
      </div>
      <div class="form-row full">
        <label>内容�?/label>
        <CodeEditor 
          v-model:content="form.content" 
          :height="'300px'" 
          :options="{ mode: 'markdown' }" 
          :showTool="true" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import CodeEditor from "@/components/codeEditor/index.vue";
import { ElMessage } from "element-plus";

// 定义接口
interface ComposeForm {
  to: string;
  cc: string;
  subject: string;
  content: string;
}

// 定义props
const props = defineProps<{
  initialForm?: Partial<ComposeForm>;
}>();

// 定义事件
const emit = defineEmits<{
  send: [form: ComposeForm];
  'save-draft': [form: ComposeForm];
  close: [];
}>();

// 响应式数�?
const form = ref<ComposeForm>({
  to: '',
  cc: '',
  subject: '',
  content: ''
});

// 监听初始表单数据
watch(() => props.initialForm, (newForm) => {
  if (newForm) {
    form.value = {
      to: newForm.to || '',
      cc: newForm.cc || '',
      subject: newForm.subject || '',
      content: newForm.content || ''
    };
  }
}, { immediate: true });

// 方法
function handleSend() {
  if (!form.value.to || !form.value.subject) {
    ElMessage.warning("请填写收件人和主�?);
    return;
  }
  emit('send', { ...form.value });
}

function handleSaveDraft() {
  emit('save-draft', { ...form.value });
}

function handleClose() {
  emit('close');
}

// 重置表单
function resetForm() {
  form.value = {
    to: '',
    cc: '',
    subject: '',
    content: ''
  };
}

// 暴露方法给父组件
defineExpose({
  resetForm
});
</script>

<style scoped>
.compose-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.compose-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.compose-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.compose-actions {
  display: flex;
  gap: 8px;
}

.compose-form {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.form-row.full {
  flex-direction: column;
  align-items: stretch;
}

.form-row label {
  width: 80px;
  font-size: 14px;
  color: #606266;
  margin-right: 12px;
  flex-shrink: 0;
}

.form-row.full label {
  width: auto;
  margin-bottom: 8px;
  margin-right: 0;
}

.form-row :deep(.el-input) {
  flex: 1;
}

/* 滚动条样�?*/
.compose-form::-webkit-scrollbar {
  width: 6px;
}

.compose-form::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.compose-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.compose-form::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>