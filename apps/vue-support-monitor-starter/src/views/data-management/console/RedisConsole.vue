<template>
  <div class="console">
    <div class="editor-bar">
      <el-input v-model="cmd" placeholder="redis 命令" @keyup.enter="execute" />
      <el-button type="primary" @click="execute">执行</el-button>
    </div>
    <div class="result">
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import request from '@/api/config'
const props = defineProps<{ id: number }>()
const cmd = ref('PING')
const result = ref('')
async function execute() {
  const res = await request({ url: `/system/data/console/${props.id}/execute`, method: 'post', params: { type: 'redis' }, data: cmd.value })
  result.value = JSON.stringify(res?.data || {}, null, 2)
}

</script>
<style scoped>
.console { display:flex; flex-direction:column; gap:8px; height: calc(100vh - 180px) }
.editor-bar { display:flex; gap:8px }
.result { flex:1; overflow:auto; border:1px solid #eee; border-radius:8px; padding:8px }
</style>


