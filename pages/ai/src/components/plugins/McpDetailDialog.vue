<template>
  <ReDialog :close-on-click-modal="true" :model-value="visible" @update:model-value="(v: boolean) => emit('update:visible', v)"
    :title="target?.name || 'MCP 详情'" width="620px" align-center destroy-on-close>
    <div class="mcp-detail" v-if="target">
      <div class="mcp-detail__head">
        <PluginIcon :icon="target.icon" :name="target.name" size="md" />
        <div class="mcp-detail__headinfo">
          <div class="mcp-detail__name">{{ target.name }}</div>
          <div class="mcp-detail__badges">
            <el-tag v-if="target.official" type="primary" effect="light">官方</el-tag>
            <el-tag v-if="target.requiresKey" type="warning" effect="light">需 API Key</el-tag>
            <el-tag v-if="target.requiresConfig" type="warning" effect="light">需补充配置</el-tag>
            <el-tag v-if="!target.installable" type="info" effect="light">第三方仓库</el-tag>
            <el-tag v-if="installed" type="success" effect="light">已安装</el-tag>
          </div>
        </div>
      </div>

      <p class="mcp-detail__desc">{{ target.description }}</p>

      <div class="mcp-detail__transport">
        <div class="mcp-detail__transportlabel">传输配置</div>
        <template v-if="transport">
          <div class="mcp-detail__row">
            <span class="mcp-detail__k">类型</span>
            <span class="mcp-detail__v">{{ typeLabel(transport.type) }}</span>
          </div>
          <div class="mcp-detail__row" v-if="transport.url">
            <span class="mcp-detail__k">地址</span>
            <span class="mcp-detail__v mcp-detail__v--mono">{{ transport.url }}</span>
          </div>
          <div class="mcp-detail__row" v-if="transport.command">
            <span class="mcp-detail__k">命令</span>
            <span class="mcp-detail__v mcp-detail__v--mono">{{ commandLine }}</span>
          </div>
        </template>
        <div v-else class="mcp-detail__hint">
          该条目来自第三方仓库，源侧未提供可直连配置，请参考仓库说明手动填写传输。
        </div>
      </div>

      <div class="mcp-detail__docs" v-if="docsUrl">
        <el-button link type="primary" @click="openDocs">
          <el-icon class="mr-1"><LinkOutlined /></el-icon>查看文档 / 仓库
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button v-if="target && !target.installable && !installed" type="primary"
        @click="emit('configure', target)">手动配置</el-button>
      <el-button v-if="target && target.installable && !installed" type="primary"
        :loading="installing" @click="emit('install', target)">安装</el-button>
      <el-button v-if="installed" type="success" disabled>已安装</el-button>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PluginIcon from '@/components/ui/PluginIcon.vue'
import ReDialog from '@repo/ui/re-dialog'
import { LinkOutlined } from '@vicons/material'
import { openInExternalBrowser } from '@/utils/browserUtils'

const props = defineProps<{
  visible: boolean
  target: any
  installed: boolean
  installing?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  'install': [any]
  'configure': [any]
}>()

const transport = computed(() =>
  props.target && typeof props.target.transport === 'object' ? props.target.transport : null)

const commandLine = computed(() => {
  const t = transport.value
  if (!t || !t.command) return ''
  const args = Array.isArray(t.args) ? t.args.join(' ') : ''
  return `${t.command}${args ? ' ' + args : ''}`
})

const docsUrl = computed(() => props.target?.docs || props.target?.docsUrl || '')

function typeLabel(type: string) {
  const map: Record<string, string> = {
    streamable_http: 'Streamable HTTP',
    sse: 'SSE',
    stdio: '本机进程 (stdio)',
    http: 'Streamable HTTP',
  }
  return map[type] || type
}

function openDocs() {
  if (docsUrl.value) openInExternalBrowser(docsUrl.value)
}
</script>

<style scoped>
.mcp-detail__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mcp-detail__headinfo {
  min-width: 0;
}
.mcp-detail__name {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.mcp-detail__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.mcp-detail__desc {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.mcp-detail__transport {
  margin-top: 16px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  padding: 12px 14px;
  background: var(--el-fill-color-blank);
}
.mcp-detail__transportlabel {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.mcp-detail__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12.5px;
  padding: 3px 0;
}
.mcp-detail__k {
  width: 42px;
  flex: none;
  color: var(--el-text-color-secondary);
}
.mcp-detail__v {
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.mcp-detail__v--mono {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
}
.mcp-detail__hint {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.mcp-detail__docs {
  margin-top: 10px;
}
</style>
