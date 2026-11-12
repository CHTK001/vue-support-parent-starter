<!--
  协议还原能力（能力矩阵）

  用户来到抓包工作台，最常见的误解是「导进来就能看内容」。实际上能还原到什么程度
  取决于协议本身：HTTP/邮件/数据库能把正文解出来；HTTPS/SSH/微信/钉钉这类载荷加密的，
  只能看到协议头、命令或记录结构。

  所以这里做一张只读的清单：按「正文可读 / 结构可读 / 仅连接识别」三档分组，
  让用户先看清边界，再决定点开哪一帧——而不是点十几个报文才发现「全是密文」。

  数据来自后端 SPI 注册的还原器（/tshark/restore/capabilities），不在前端写死：
  新增一个 ProtocolRestorer 就会自动出现在这张表里。
-->
<template>
  <ReDialog
    :model-value="modelValue"
    title="协议还原能力"
    width="680px"
    footer-hidden
    @update:model-value="onOpenChange"
  >
    <p class="rm-note">
      能还原什么由后端注册的协议还原器决定，这里按深度分三档；载荷加密的协议只到结构层，
      不给假字段。
    </p>

    <p class="rm-tls" :class="{ 'rm-tls--on': tls?.enabled }">
      <template v-if="tls?.enabled">
        TLS 解密已启用：{{ tls.path }}（解析时会带 <code>tls.keylog_file</code>）
      </template>
      <template v-else-if="tls?.configured">
        TLS keylog 已配置但文件不可读：{{ tls.path }}
      </template>
      <template v-else>
        TLS 解密未配置：配置 <code>plugin.monitor.tshark.tls-keylog-file</code> 后，
        TLS 里的 HTTP/2、MSRP、SMPP 才能继续还原。
      </template>
    </p>

    <div v-if="loading" class="rm-empty">正在读取……</div>
    <p v-else-if="error" class="rm-error">{{ error }}</p>

    <template v-else>
      <section v-for="group in groups" :key="group.level" class="rm-group">
        <header class="rm-group__head">
          <span class="rm-dot" :class="`rm-dot--${group.level.toLowerCase()}`" />
          <span class="rm-group__title">{{ group.title }}</span>
          <span class="rm-group__count">{{ group.items.length }}</span>
        </header>
        <p class="rm-group__desc">{{ group.desc }}</p>
        <div class="rm-chips">
          <span
            v-for="item in group.items"
            :key="item.protocol"
            class="rm-chip tshark-mono"
            :title="`优先级 ${item.priority}（越小越先尝试）`"
          >{{ item.protocol }}</span>
        </div>
      </section>
      <p v-if="!groups.length" class="rm-empty">后端还没有注册任何协议还原器。</p>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReDialog from '@repo/ui/re-dialog'
import { getTsharkRestoreCapabilities, getTsharkTlsKeylog } from '../../api'

interface Capability {
  protocol: string
  priority: number
  level: string
}

interface KeylogState {
  configured: boolean
  enabled: boolean
  path: string
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

/** 三档口径与顺序：正文 → 结构 → 连接，从「能看内容」到「只能认出连接」 */
const LEVELS = [
  {
    level: 'FULL',
    title: '正文可读',
    desc: '协议解析完整，请求/响应或数据内容能直接看到（HTTP、邮件、数据库、DNS 等）。',
  },
  {
    level: 'STRUCTURE',
    title: '结构可读',
    desc: '协议头、命令或记录结构可读；业务载荷本身是密文（HTTPS/TLS、SSH、微信、QQ、钉钉类）。',
  },
  {
    level: 'CONNECTION',
    title: '仅连接识别',
    desc: '只能认出连接与对端，内容不可还原。',
  },
] as const

const items = ref<Capability[]>([])
const loading = ref(false)
const error = ref('')
const tls = ref<KeylogState | null>(null)
/** 打开过一次就不再重复请求：能力清单在运行期不会变 */
const loaded = ref(false)

/** 按档分组；组内按优先级升序（谁先抢到这一帧一目了然） */
const groups = computed(() => LEVELS.map((meta) => ({
  ...meta,
  items: items.value
    .filter((item) => (item.level || 'FULL').toUpperCase() === meta.level)
    .sort((a, b) => a.priority - b.priority || a.protocol.localeCompare(b.protocol)),
})).filter((group) => group.items.length > 0))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [capabilities, keylog] = await Promise.all([
      getTsharkRestoreCapabilities(),
      getTsharkTlsKeylog().catch(() => null),
    ])
    items.value = Array.isArray(capabilities) ? capabilities : []
    tls.value = keylog || null
    loaded.value = true
  } catch (e: any) {
    error.value = '读取协议能力失败：' + (e?.message || '未知错误')
  } finally {
    loading.value = false
  }
}

function onOpenChange(value: boolean) {
  emit('update:modelValue', value)
}

watch(() => props.modelValue, (visible) => {
  if (visible && !loaded.value && !loading.value) load()
}, { immediate: true })
</script>

<style scoped>
.rm-note {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.rm-tls {
  margin: 0 0 10px;
  padding: 6px 10px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-lighter);
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}
.rm-tls--on {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success-dark-2);
}
.rm-tls code {
  padding: 0 3px;
  border-radius: 3px;
  background: var(--el-fill-color);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
}
.rm-empty,
.rm-error {
  margin: 8px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rm-error {
  color: var(--el-color-danger);
}
.rm-group {
  padding: 8px 0 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.rm-group:first-of-type {
  border-top: 0;
}
.rm-group__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-success);
}
.rm-dot--structure {
  background: var(--el-color-warning);
}
.rm-dot--connection {
  background: var(--el-text-color-disabled);
}
.rm-group__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rm-group__count {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-fill-color);
  font-size: 11px;
  line-height: 16px;
  color: var(--el-text-color-secondary);
}
.rm-group__desc {
  margin: 4px 0 8px 16px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.rm-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 16px;
}
.rm-chip {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 11px;
  line-height: 18px;
  color: var(--el-text-color-regular);
}
</style>
