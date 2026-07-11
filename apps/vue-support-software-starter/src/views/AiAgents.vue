<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">AI 客户端</h1>
        <p class="page-desc">扫描和管理本机已安装的 AI Agent 客户端</p>
      </div>
      <el-button :icon="Refresh" @click="scanAll" :loading="scanning">扫描客户端</el-button>
    </div>

    <div class="agent-grid">
      <div v-for="c in clients" :key="c.id" class="agent-card" :class="{ installed: c.installed }">
        <div class="ac-top">
          <div class="ac-avatar">{{ c.name.slice(0, 2).toUpperCase() }}</div>
          <div class="ac-info">
            <div class="ac-name">{{ c.name }}</div>
            <div class="ac-path" :title="c.path">{{ c.path }}</div>
          </div>
          <el-tag v-if="c.installed" type="success" size="small" effect="dark">已安装</el-tag>
          <el-tag v-else type="info" size="small">未检测</el-tag>
        </div>
        <div v-if="c.installed" class="ac-stats">
          <span>MCP: {{ c.mcpCount || 0 }}</span>
        </div>
      </div>
      <el-empty v-if="!clients.length && !scanning" description="未检测到 AI 客户端" :image-size="50" class="mt-8" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { scanAiAgents, type AgentClient } from '@/api/software'

const clients = ref<AgentClient[]>([])
const scanning = ref(false)

async function scanAll() {
  scanning.value = true
  try {
    const result = await scanAiAgents()
    clients.value = result
    const count = result.filter(c => c.installed).length
    ElMessage.success(`检测完成，已发现 ${count} 个 AI 客户端`)
  } catch {
    ElMessage.error('扫描失败')
    clients.value = []
  } finally {
    scanning.value = false
  }
}

onMounted(() => { scanAll() })
</script>

<style scoped>
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.agent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }

.agent-card { background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 12px; padding: 16px; position: relative; overflow: hidden; }
.agent-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--el-border-color-light); border-radius: 0 2px 2px 0; }
.agent-card.installed { border-color: var(--el-color-success-light-7); }
.agent-card.installed::before { background: var(--el-color-success); }

.ac-top { display: flex; align-items: center; gap: 12px; }
.ac-avatar { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: var(--el-color-primary-light-9); color: rgb(var(--el-color-primary)); flex-shrink: 0; }
.ac-info { flex: 1; min-width: 0; }
.ac-name { font-size: 14px; font-weight: 600; }
.ac-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ac-stats { display: flex; gap: 20px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--el-border-color-light); font-size: 12px; color: var(--el-text-color-secondary); }

.mt-8 { margin-top: 32px; }
</style>
