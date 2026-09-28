<template>
  <CustomPopover :show="visible" @update:show="(v) => emit('update:visible', v)"
    :width="300" :max-height="420" :anchor-el="anchorEl">
    <div class="mcp-sel">
      <div class="mcp-sel__header">
        <span class="mcp-sel__title">MCP 工具</span>
        <el-button link @click="clearAll">全部不选</el-button>
      </div>
      <div class="mcp-sel__hint">勾选后，本次会话将真实连接并调用所选 MCP 工具</div>

      <div v-if="loading" class="mcp-sel__loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中…</span>
      </div>

      <div v-else-if="!servers.length" class="mcp-sel__empty">
        暂无可用 MCP，请先在「插件 - MCP」中添加
      </div>

      <div v-else class="mcp-sel__list">
        <div v-for="s in servers" :key="s.mcp_server_id" class="mcp-sel__item"
          :class="{ 'is-active': chosen.has(s.mcp_server_id) }"
          @click="toggle(s.mcp_server_id)">
          <CardAvatar :name="s.name" />
          <div class="mcp-sel__itembody">
            <div class="mcp-sel__itemname">{{ s.name }}</div>
            <div class="mcp-sel__itemmeta">{{ transportLabel(s.transport) }}</div>
          </div>
          <el-icon v-if="chosen.has(s.mcp_server_id)" size="16" class="mcp-sel__check">
            <Checkmark16Filled />
          </el-icon>
        </div>
      </div>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { Checkmark16Filled } from '@vicons/fluent'
import CustomPopover from '@/components/ui/CustomPopover.vue'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import { mcpApi } from '@/services/javaApi'

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  selectedIds: string[]
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  'change': [ids: string[]]
}>()

const servers = ref<any[]>([])
const loading = ref(false)
const chosen = ref<Set<string>>(new Set())

function transportLabel(t: any) {
  if (!t) return '未配置'
  if (t.type === 'stdio') return `stdio · ${t.command || ''}`
  return `${(t.type || '').toUpperCase()} · ${t.url || ''}`
}

async function loadServers() {
  loading.value = true
  try {
    const res = await mcpApi.list()
    servers.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    console.error('加载 MCP 列表失败:', e)
    servers.value = []
  } finally {
    loading.value = false
  }
}

function syncChosen() {
  chosen.value = new Set((props.selectedIds || []).filter(Boolean))
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      syncChosen()
      loadServers()
    }
  },
)

function toggle(id: string) {
  const next = new Set(chosen.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  chosen.value = next
  emit('change', Array.from(next))
}

function clearAll() {
  chosen.value = new Set()
  emit('change', [])
}
</script>

<style scoped>
.mcp-sel {
  padding: 4px 4px 6px;
}
.mcp-sel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mcp-sel__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.mcp-sel__hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin: 2px 0 8px;
  line-height: 1.5;
}
.mcp-sel__loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  justify-content: center;
}
.mcp-sel__empty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 18px 6px;
  text-align: center;
  line-height: 1.6;
}
.mcp-sel__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mcp-sel__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}
.mcp-sel__item:hover { background: var(--el-fill-color-light); }
.mcp-sel__item.is-active { background: var(--el-color-primary-light-9); }
.mcp-sel__itembody { flex: 1; min-width: 0; }
.mcp-sel__itemname {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}
.mcp-sel__itemmeta {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}
.mcp-sel__check {
  flex: none;
  color: var(--el-color-primary);
}

/* 键盘焦点可见性：MCP 条目是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 弹层底色是浅色浮层表面（选中态也只是 primary-light-9），
   一档主色描边足够可见。 */
.mcp-sel__item {
  outline: none;
}

.mcp-sel__item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
