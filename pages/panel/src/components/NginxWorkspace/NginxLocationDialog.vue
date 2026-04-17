<template>
  <ElDialog
    :model-value="modelValue"
    title="添加 Location 映射"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="loc-dialog-form">
      <!-- 路径 -->
      <div class="form-row">
        <label class="form-label">路径</label>
        <input v-model="form.path" class="form-input" placeholder="/" />
      </div>

      <!-- 模式选择 -->
      <div class="form-row loc-mode-row">
        <label class="form-label">模式</label>
        <ElRadioGroup v-model="form.mode" class="loc-mode-group">
          <ElRadio value="proxy">反向代理</ElRadio>
          <ElRadio value="static">静态文件</ElRadio>
          <ElRadio value="redirect">重定向</ElRadio>
          <ElRadio value="custom">自定义</ElRadio>
        </ElRadioGroup>
      </div>

      <!-- 反向代理 -->
      <template v-if="form.mode === 'proxy'">
        <div class="form-row">
          <label class="form-label">代理地址</label>
          <input v-model="form.proxyPass" class="form-input" placeholder="http://127.0.0.1:8080" />
        </div>
        <div class="form-row">
          <label class="form-label">代理超时 (s)</label>
          <input v-model="form.proxyReadTimeout" class="form-input" type="number" placeholder="60" />
        </div>
        <div class="form-row">
          <label class="form-label">连接超时 (s)</label>
          <input v-model="form.proxyConnectTimeout" class="form-input" type="number" placeholder="60" />
        </div>
        <div class="form-row">
          <label class="form-label">缓冲</label>
          <ElSwitch v-model="form.proxyBuffering" active-text="on" inactive-text="off" />
        </div>
        <div class="loc-header-section">
          <div class="loc-header-section__title">
            请求头 (proxy_set_header)
            <div class="loc-preset-btns">
              <ElButton size="small" plain @click="addProxyHeader('Host $host')">Host</ElButton>
              <ElButton size="small" plain @click="addProxyHeader('X-Real-IP $remote_addr')">X-Real-IP</ElButton>
              <ElButton size="small" plain @click="addProxyHeader('X-Forwarded-For $proxy_add_x_forwarded_for')">X-Forwarded-For</ElButton>
              <ElButton size="small" plain @click="addProxyHeader('X-Forwarded-Proto $scheme')">X-Forwarded-Proto</ElButton>
            </div>
          </div>
          <div v-for="(h, i) in form.proxySetHeaderList" :key="i" class="loc-header-row">
            <input v-model="form.proxySetHeaderList[i]" class="form-input" placeholder="Header value" />
            <ElButton :icon="Delete" circle plain size="small" type="danger" @click="form.proxySetHeaderList.splice(i, 1)" />
          </div>
          <div class="loc-add-header" @click="form.proxySetHeaderList.push('')">
            <ElIcon><Plus /></ElIcon> 添加请求头
          </div>
        </div>
      </template>

      <!-- 静态文件 -->
      <template v-else-if="form.mode === 'static'">
        <div class="form-row">
          <label class="form-label">根目录 (root)</label>
          <input v-model="form.root" class="form-input" placeholder="/var/www/html" />
        </div>
        <div class="form-row">
          <label class="form-label">别名 (alias)</label>
          <input v-model="form.alias" class="form-input" placeholder="/var/www/static/" />
        </div>
        <div class="form-row">
          <label class="form-label">try_files</label>
          <input v-model="form.tryFiles" class="form-input" placeholder="$uri $uri/ =404" />
        </div>
        <div class="form-row">
          <label class="form-label">过期时间</label>
          <input v-model="form.expires" class="form-input" placeholder="7d / 1h / off" />
        </div>
        <div class="form-row">
          <label class="form-label">默认文件 (index)</label>
          <input v-model="form.index" class="form-input" placeholder="index.html" />
        </div>
        <div class="form-row">
          <label class="form-label">目录浏览</label>
          <ElSwitch v-model="form.autoindex" active-text="on" inactive-text="off" />
        </div>
      </template>

      <!-- 重定向 -->
      <template v-else-if="form.mode === 'redirect'">
        <div class="form-row">
          <label class="form-label">状态码</label>
          <ElSelect v-model="form.returnCode" class="form-select">
            <ElOption label="301 永久重定向" value="301" />
            <ElOption label="302 临时重定向" value="302" />
            <ElOption label="307 临时重定向(保留方法)" value="307" />
            <ElOption label="308 永久重定向(保留方法)" value="308" />
          </ElSelect>
        </div>
        <div class="form-row">
          <label class="form-label">目标 URL</label>
          <input v-model="form.returnUrl" class="form-input" placeholder="https://example.com$request_uri" />
        </div>
      </template>

      <!-- 自定义 -->
      <template v-else-if="form.mode === 'custom'">
        <div class="form-row form-row--textarea">
          <label class="form-label">自定义指令</label>
          <textarea
            v-model="form.rawDirectives"
            class="form-input form-textarea"
            placeholder="直接写 nginx 指令，如：&#10;add_header X-Frame-Options SAMEORIGIN;&#10;limit_req zone=one burst=5;"
          />
        </div>
      </template>

      <!-- 通用：响应头 -->
      <div class="loc-header-section">
        <div class="loc-header-section__title">响应头 (add_header)</div>
        <div v-for="(h, i) in form.addHeaderList" :key="i" class="loc-header-row">
          <input v-model="form.addHeaderList[i]" class="form-input" placeholder="X-Frame-Options SAMEORIGIN" />
          <ElButton :icon="Delete" circle plain size="small" type="danger" @click="form.addHeaderList.splice(i, 1)" />
        </div>
        <div class="loc-add-header" @click="form.addHeaderList.push('')">
          <ElIcon><Plus /></ElIcon> 添加响应头
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSubmit">添加</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'
import {
  ElButton,
  ElDialog,
  ElIcon,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
} from 'element-plus'
import { reactive, watch } from 'vue'
import type { NginxLocationBlock } from '../../api/nginx'

const props = defineProps<{
  modelValue: boolean
  targetServerIndex: number
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', loc: NginxLocationBlock): void
}>()

// ─── 表单状态 ─────────────────────────────────────────────────────────────────
const form = reactive({
  path: '/',
  mode: 'proxy' as 'proxy' | 'static' | 'redirect' | 'custom',
  proxyPass: '',
  proxyReadTimeout: '60',
  proxyConnectTimeout: '60',
  proxyBuffering: true,
  proxySetHeaderList: [] as string[],
  root: '',
  alias: '',
  tryFiles: '',
  expires: '',
  autoindex: false,
  index: 'index.html',
  returnCode: '301',
  returnUrl: '',
  addHeaderList: [] as string[],
  rawDirectives: '',
})

const resetForm = () => {
  Object.assign(form, {
    path: '/',
    mode: 'proxy',
    proxyPass: '',
    proxyReadTimeout: '60',
    proxyConnectTimeout: '60',
    proxyBuffering: true,
    proxySetHeaderList: [],
    root: '',
    alias: '',
    tryFiles: '',
    expires: '',
    autoindex: false,
    index: 'index.html',
    returnCode: '301',
    returnUrl: '',
    addHeaderList: [],
    rawDirectives: '',
  })
}

watch(() => props.modelValue, (v) => { if (v) resetForm() })

const addProxyHeader = (header: string) => {
  if (!form.proxySetHeaderList.includes(header)) form.proxySetHeaderList.push(header)
}

const handleSubmit = () => {
  if (!form.path.trim()) {
    ElMessage.warning('请填写路径')
    return
  }
  const loc: NginxLocationBlock = { path: form.path, mode: form.mode }
  if (form.mode === 'proxy') {
    loc.proxyPass = form.proxyPass
    loc.proxyReadTimeout = form.proxyReadTimeout
    loc.proxyConnectTimeout = form.proxyConnectTimeout
    loc.proxySetHeader = [...form.proxySetHeaderList]
    loc.proxyBuffering = form.proxyBuffering
  } else if (form.mode === 'static') {
    loc.root = form.root
    loc.alias = form.alias
    loc.tryFiles = form.tryFiles
    loc.expires = form.expires
    loc.autoindex = form.autoindex
    loc.index = form.index
  } else if (form.mode === 'redirect') {
    loc.returnCode = form.returnCode
    loc.returnUrl = form.returnUrl
  } else {
    loc.rawDirectives = form.rawDirectives
  }
  loc.addHeader = [...form.addHeaderList]
  emit('submit', loc)
}
</script>

<style scoped lang="scss">
.loc-dialog-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-row {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 4px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  gap: 12px;

  &:last-child { border-bottom: none; }

  &--textarea {
    height: auto;
    align-items: flex-start;
    padding: 12px 4px;
  }
}

.loc-mode-row {
  height: auto;
  padding: 10px 4px;
  align-items: flex-start;
}

.form-label {
  flex-shrink: 0;
  width: 140px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.form-input {
  flex: 1;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.14s, box-shadow 0.14s;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: #fff;
  }
}

.form-textarea {
  height: 120px;
  resize: vertical;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 8px 10px;
}

.form-select { flex: 1; }

.loc-mode-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loc-header-section {
  padding: 10px 4px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loc-header-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.loc-preset-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.loc-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loc-add-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  border-radius: 7px;
  cursor: pointer;
  font-size: 12px;
  color: #94a3b8;
  transition: all 0.12s;

  &:hover {
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.04);
  }
}
</style>
