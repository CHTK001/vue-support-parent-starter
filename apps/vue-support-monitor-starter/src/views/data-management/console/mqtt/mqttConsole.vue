<template>
  <div class="console">
    <div class="toolbar">
      <el-input v-model="topic" placeholder="主题" class="w-240" />
      <el-input v-model="payload" placeholder="消息�? class="w-360 ml-2" />
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
import { ref, onMounted, onBeforeUnmount, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { executeConsole } from '@/api/system-data'
import { socket } from '@repo/core'
import { getConfig } from '@repo/config'
import { splitToArray } from '@repo/utils'

const props = defineProps<{ id:number }>()

// 使用全局Socket.IO或创建独立连�?
const globalSocket = inject<any>('globalSocket')
let socketConnection: any = null
let unsubscribeHandlers: any[] = []

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

onMounted(async () => {
  // 建立Socket.IO连接
  if (globalSocket?.value) {
    // 使用全局Socket.IO连接
    socketConnection = globalSocket.value
  } else {
    // 创建独立的Socket.IO连接
    const config = getConfig()
    socketConnection = socket(splitToArray(config.SocketUrl), undefined, {})
  }
  
  if (socketConnection) {
    // 监听系统数据监听事件
    const listenHandler = (data: any) => {
      if (data.settingId === props.id && data.type === 'mqtt') {
        try {
          console.log('MQTT Console received message:', data)
          if (data.messageType === 'mqtt_message') {
            // 处理 MQTT 消息，添加到消息列表
            messages.value.unshift({
              time: new Date().toLocaleString(),
              topic: data.topic || '',
              payload: data.content || data.payload || ''
            })
          } else if (data.messageType === 'log') {
            ElMessage.info(data.content || '')
          } else if (data.messageType === 'error') {
            ElMessage.error(data.content || '操作出现错误')
          }
        } catch (error) {
          console.error('Error processing console message:', error)
        }
      }
    }
    
    const logHandler = (data: any) => {
      if (data.settingId === props.id && data.type === 'mqtt') {
        try {
          console.log('MQTT Console log:', data)
          ElMessage.info(data.content || '')
        } catch (error) {
          console.error('Error processing log message:', error)
        }
      }
    }
    
    socketConnection.on('system/data/listen', listenHandler)
    socketConnection.on('system/data/log', logHandler)
    
    unsubscribeHandlers.push(
      () => socketConnection.off('system/data/listen', listenHandler),
      () => socketConnection.off('system/data/log', logHandler)
    )
  }
})

onBeforeUnmount(() => {
  // 清理Socket.IO事件监听
  unsubscribeHandlers.forEach(handler => handler())
  unsubscribeHandlers = []
  
  // 如果是独立连接，断开连接
  if (socketConnection && !globalSocket?.value) {
    socketConnection.disconnect()
  }
  
  socketConnection = null
})

</script>
<style scoped>
.console{ display:flex; flex-direction:column; gap:8px; }
.toolbar{ display:flex; align-items:center; gap:8px; }
</style>

