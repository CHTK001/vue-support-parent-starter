<template>
  <LDialog :model-value="visible" @update:model-value="(v: boolean) => emit('update:visible', v)"
    :title="isEdit ? '编辑 MCP 服务器' : '添加 MCP 服务器'" width="600px" align-center destroy-on-close
    append-to-body>
    <el-form label-position="top" class="mf-form" @submit.prevent>
      <!-- 基本信息 -->
      <section class="mf-section">
        <div class="mf-section-head">
          <span class="mf-section-ico"><el-icon :size="14"><Info24Regular /></el-icon></span>
          <span class="mf-section-title">基本信息</span>
        </div>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="例如 DeepWiki" clearable maxlength="40" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder="该 MCP 的用途说明" />
        </el-form-item>
        <el-form-item label="图标（图片 URL 或图标名，可留空）">
          <el-input v-model="form.icon" placeholder="https://example.com/icon.png 或 BookSearch20Regular" clearable />
        </el-form-item>
      </section>

      <!-- 连接方式 -->
      <section class="mf-section">
        <div class="mf-section-head">
          <span class="mf-section-ico"><el-icon :size="14"><PlugConnected24Regular /></el-icon></span>
          <span class="mf-section-title">连接方式</span>
        </div>

        <div class="mf-transport">
          <div
            v-for="opt in transportOptions"
            :key="opt.value"
            class="mf-transport-item"
            :class="{ active: form.transportType === opt.value }"
            @click="form.transportType = opt.value"
          >
            <el-icon class="mf-transport-ico" :size="17"><component :is="opt.icon" /></el-icon>
            <span class="mf-transport-label">{{ opt.label }}</span>
            <el-icon v-if="form.transportType === opt.value" class="mf-transport-check" :size="13">
              <Checkmark24Regular />
            </el-icon>
          </div>
        </div>

        <!-- HTTP / SSE -->
        <template v-if="form.transportType !== 'stdio'">
          <el-form-item label="服务地址" required class="mf-mt">
            <el-input v-model="form.url" placeholder="https://example.com/mcp" clearable>
              <template #prefix><el-icon><Globe24Regular /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="请求头（JSON 对象，可留空）">
            <el-input v-model="form.headersText" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
              :placeholder='headersPlaceholder' class="mf-mono" />
          </el-form-item>
        </template>

        <!-- stdio -->
        <template v-else>
          <el-form-item label="启动命令" required class="mf-mt">
            <el-input v-model="form.command" :placeholder="isWindows ? 'npx.cmd' : 'npx'" clearable>
              <template #prefix><el-icon><WindowConsole20Regular /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="参数（每行一个；也可用空格分隔）">
            <el-input v-model="form.argsText" type="textarea" :autosize="{ minRows: 3, maxRows: 8 }"
              :placeholder="argsPlaceholder" class="mf-mono" />
          </el-form-item>
          <el-form-item label="环境变量（JSON 对象，可留空）">
            <el-input v-model="form.envText" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
              :placeholder='envPlaceholder' class="mf-mono" />
          </el-form-item>
        </template>
      </section>
    </el-form>

    <template #footer>
      <div class="mf-footer">
        <el-button class="mf-btn" @click="emit('update:visible', false)">取消</el-button>
        <el-button class="mf-btn" type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </div>
    </template>
  </LDialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import LDialog from '@/components/ui/LDialog.vue'
import {
  Info24Regular, PlugConnected24Regular, Checkmark24Regular,
  Globe24Regular, WindowConsole20Regular,
} from '@vicons/fluent'
import { Desktop24Regular } from '@vicons/fluent'

const props = defineProps<{
  visible: boolean
  initial: any
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  'save': [payload: { id?: string; data: any }]
}>()

const isWindows = navigator.platform.toLowerCase().includes('win')
const isEdit = !!props.initial?.mcp_server_id

const transportOptions = [
  { label: 'Streamable HTTP', value: 'streamable_http', icon: Globe24Regular },
  { label: 'SSE', value: 'sse', icon: PlugConnected24Regular },
  { label: 'stdio 进程', value: 'stdio', icon: Desktop24Regular },
]

const headersPlaceholder = '{ "Authorization": "Bearer xxx" }'
const envPlaceholder = '{ "API_KEY": "xxx" }'
const argsPlaceholder = '-y\n@modelcontextprotocol/server-fetch'

interface FormState {
  name: string
  description: string
  icon: string
  transportType: string
  url: string
  headersText: string
  command: string
  argsText: string
  envText: string
}

const form = reactive<FormState>({
  name: '',
  description: '',
  icon: '',
  transportType: 'streamable_http',
  url: '',
  headersText: '',
  command: '',
  argsText: '',
  envText: '',
})

function reset() {
  form.name = ''
  form.description = ''
  form.icon = ''
  form.transportType = 'streamable_http'
  form.url = ''
  form.headersText = ''
  form.command = ''
  form.argsText = ''
  form.envText = ''

  const src = props.initial
  if (!src) return
  form.name = src.name || ''
  form.description = src.description || ''
  form.icon = src.icon || ''
  const t = src.transport
  if (t && typeof t === 'object') {
    const type = String(t.type || 'streamable_http')
    form.transportType = type === 'http' ? 'streamable_http' : type
    if (form.transportType !== 'stdio') {
      form.url = t.url || ''
      form.headersText = t.headers && Object.keys(t.headers).length
        ? JSON.stringify(t.headers, null, 2) : ''
    } else {
      form.command = t.command || ''
      form.argsText = Array.isArray(t.args) ? t.args.join('\n') : ''
      form.envText = t.env && Object.keys(t.env).length
        ? JSON.stringify(t.env, null, 2) : ''
    }
  }
}

watch(() => props.visible, (v) => {
  if (v) reset()
})

function parseJsonObject(text: string, label: string): Record<string, string> | null {
  const v = text.trim()
  if (!v) return null
  try {
    const obj = JSON.parse(v)
    if (typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('not object')
    }
    return obj
  } catch {
    ElMessage.error(`${label} 不是合法的 JSON 对象`)
    throw new Error(`invalid ${label}`)
  }
}

function splitArgs(text: string): string[] {
  const v = text.trim()
  if (!v) return []
  if (v.includes('\n')) {
    return v.split('\n').map((s) => s.trim()).filter(Boolean)
  }
  return v.split(/\s+/).filter(Boolean)
}

function handleSave() {
  if (!form.name.trim()) {
    ElMessage.error('请填写名称')
    return
  }

  let transport: Record<string, unknown>
  try {
    if (form.transportType === 'stdio') {
      if (!form.command.trim()) {
        ElMessage.error('请填写启动命令')
        return
      }
      transport = { type: 'stdio', command: form.command.trim(), args: splitArgs(form.argsText) }
      const env = parseJsonObject(form.envText, '环境变量')
      if (env) transport.env = env
    } else {
      if (!form.url.trim()) {
        ElMessage.error('请填写服务地址')
        return
      }
      transport = { type: form.transportType, url: form.url.trim() }
      const headers = parseJsonObject(form.headersText, '请求头')
      if (headers) transport.headers = headers
    }
  } catch {
    return
  }

  const src = props.initial
  emit('save', {
    id: src?.mcp_server_id,
    data: {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon.trim(),
      transport,
    },
  })
}
</script>

<style scoped>
.mf-form { display: flex; flex-direction: column; }

.mf-section + .mf-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.mf-section-head { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
.mf-section-ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 29px; height: 29px;
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.mf-section-title { font-size: 13.5px; font-weight: 700; color: var(--el-text-color-primary); }

/* 传输类型卡片 */
.mf-transport {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.mf-transport-item {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 8px;
  /* 原值 11px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}
.mf-transport-item:hover { border-color: var(--el-color-primary-light-5); }
.mf-transport-ico { color: var(--el-text-color-secondary); }
.mf-transport-label { font-size: 12px; font-weight: 600; }
.mf-transport-check { position: absolute; top: 6px; right: 7px; color: var(--el-color-primary); }
.mf-transport-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.mf-transport-item.active .mf-transport-ico { color: var(--el-color-primary); }

.mf-mt { margin-top: 4px; }
.mf-mono { font-size: 12.5px; }
.mf-mono :deep(.el-textarea__inner) {
  font-family: var(--el-font-family-monospace, monospace);
}

.mf-form :deep(.el-form-item) { margin-bottom: 15px; }
.mf-form :deep(.el-form-item__label) {
  font-size: 12.5px; font-weight: 600; color: var(--el-text-color-regular);
  padding-bottom: 6px; line-height: 1.4;
}
.mf-form :deep(.el-input__wrapper),
.mf-form :deep(.el-textarea__inner) {
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
}
.mf-form :deep(.el-input__wrapper.is-focus),
.mf-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px var(--el-color-primary-light-9);
}

.mf-footer { display: flex; justify-content: flex-end; gap: 10px; }
/* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
.mf-btn { border-radius: var(--el-radius-lg, 12px); }
.mf-btn:not(.el-button--primary) {
  background: var(--el-bg-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-regular);
}
.mf-btn:not(.el-button--primary):hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 动效降级：系统开启「减少动态效果」时，传输方式选项的描边与底色直接到位。
   只关 .mf-transport-item 自己的 transition，不写 `*` / .mf-transport-item * 通配，
   避免把内部 el-icon 组件的合法过渡一起掐掉。
   .active 选中态是静态声明，停掉过渡后照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .mf-transport-item {
    transition: none;
  }
}

/* 键盘焦点可见性：传输方式选项是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 弹层底色是令牌化的表面色，一档主色描边足够可见。 */
.mf-transport-item {
  outline: none;
}

.mf-transport-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
