<template>
  <div class="console">
    <div class="toolbar">
      <el-input v-model="subject" placeholder="主题" class="w-260" />
      <el-input v-model="to" placeholder="收件人(逗号分隔)" class="w-320 ml-2" />
      <el-button type="primary" @click="send">发送测试邮件</el-button>
    </div>
    <CodeEditor v-model:content="content" :height="'220px'" :options="{ mode: 'markdown' }" :showTool="false" />
    <el-alert v-if="status" :title="status" type="success" show-icon class="mt-2" />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import CodeEditor from "@/components/codeEditor/index.vue";
import { executeConsole } from "@/api/system-data";
const props = defineProps<{ id: number }>();
const to = ref("test@example.com");
const subject = ref("测试邮件");
const content = ref("# hello");
const status = ref("");
async function send() {
  const cmd = JSON.stringify({ to: to.value, subject: subject.value, content: content.value });
  const res = await executeConsole(props.id, cmd, "email");
  status.value = res?.data?.success ? "发送成功" : res?.data?.msg || "发送失败";
}
</script>
<style scoped>
.console {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
