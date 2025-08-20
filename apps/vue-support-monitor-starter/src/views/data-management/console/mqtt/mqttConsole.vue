<template>
  <div class="console">
    <div class="toolbar">
      <el-input v-model="topic" placeholder="主题" class="w-240" />
      <el-input v-model="payload" placeholder="消息体" class="w-360 ml-2" />
      <el-button type="primary" @click="publish">发布</el-button>
      <el-input v-model="subTopic" placeholder="订阅主题(支持通配)" class="w-240 ml-4" />
      <el-button @click="subscribe">订阅</el-button>
    </div>
    <el-table :data="messages" height="70vh" size="small" border>
      <el-table-column label="时间" prop="time" width="180" />
      <el-table-column label="主题" prop="topic" width="260" />
      <el-table-column label="消息" prop="payload" />
    </el-table>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { executeConsole } from '@/api/system-data'
const props = defineProps<{ id:number }>()
const topic = ref('test/topic')
const subTopic = ref('test/#')
const payload = ref('hello')
const messages = ref<Array<{time:string;topic:string;payload:string}>>([])
async function publish(){
  await executeConsole(props.id, `PUBLISH ${topic.value} ${payload.value}`, 'mqtt')
}
async function subscribe(){
  await executeConsole(props.id, `SUBSCRIBE ${subTopic.value}`, 'mqtt')
}
</script>
<style scoped>
.console{ display:flex; flex-direction:column; gap:8px; }
.toolbar{ display:flex; align-items:center; gap:8px; }
</style>

