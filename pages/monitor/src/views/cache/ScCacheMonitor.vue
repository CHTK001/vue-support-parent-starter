<template>
  <div class="cache-monitor fade-in">
    <ReCard layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="header-bar">
        <div class="header-left">
          <div class="title-row">
            <span class="title-badge">Cache</span>
            <h1 class="page-title">缓存监控</h1>
          </div>
          <p class="page-desc">分级浏览 Redis 缓存前缀，支持单条 / 全量清理</p>
        </div>
        <div class="header-right">
          <span class="refresh-time">最后更新: {{ lastRefresh }}</span>
          <ReButton show-text icon="RefreshLeft" plain @click="refreshAll" class="refresh-btn">
            <ReIcon name="RefreshLeft" />
            刷新
          </ReButton>
        </div>
      </div>
    </ReCard>

    <div class="three-panel">
    <ReCard class="panel panel-left" :class="{ 'panel-active': selectedCache }" layout="simple" :radius="10" :padding="0" shadow="never">
      <template #header>
        <div class="panel-head">
          <div class="panel-head-left">
            <span class="panel-title">缓存列表</span>
            <span class="panel-count">共 {{ cachePrefixes.length }} 条</span>
          </div>
          <ReButton text icon="RefreshLeft" @click="refreshCacheList" class="panel-refresh">
            <ReIcon name="RefreshLeft" />
          </ReButton>
        </div>
      </template>

        <div class="panel-body">
          <ReEmpty v-if="cachePrefixes.length === 0" description="暂无缓存数据" layout="modern" :image-size="60" />
          <div v-else class="cache-list">
            <div
              v-for="(item, idx) in cachePrefixes"
              :key="item.prefix"
              :class="['cache-item', { active: selectedCache === item.prefix }]"
              @click="selectCache(item.prefix)"
            >
              <span class="cache-index">{{ idx + 1 }}</span>
              <div class="cache-info">
                <span class="cache-name">{{ item.prefix }}</span>
                <span class="cache-remark">{{ item.remark }}</span>
              </div>
              <div class="cache-actions">
                <span class="cache-count">{{ item.count }} 个</span>
                <ReButton
                  text

                  type="danger"
                  icon="Delete"
                  @click.stop="clearCachePrefix(item.prefix)"
                  class="cache-del-btn"
                >
                    <ReIcon name="Delete" />
                </ReButton>
              </div>
            </div>
          </div>
        </div>
    </ReCard>

    <ReCard class="panel panel-mid" :class="{ 'panel-active': selectedKey }" layout="simple" :radius="10" :padding="0" shadow="never">
      <template #header>
        <div class="panel-head">
          <div class="panel-head-left">
            <span class="panel-title">键名列表</span>
            <span class="panel-count">{{ selectedCache ? `共 ${keyList.length} 个` : '' }}</span>
          </div>
          <ReButton v-if="selectedCache" text icon="RefreshLeft" @click="refreshKeyList" class="panel-refresh">
            <ReIcon name="RefreshLeft" />
          </ReButton>
        </div>
      </template>

      <div class="panel-body">
          <ReEmpty
            v-if="!selectedCache"
            description="请先选择缓存名称，点击左侧缓存列表查看键名"
            layout="modern"
            :image-size="60"
          />
          <ReEmpty v-else-if="keyList.length === 0" description="该缓存下暂无键" layout="modern" :image-size="60" />
          <div v-else class="key-list">
            <div
              v-for="(key, idx) in keyList"
              :key="key"
              :class="['key-item', { active: selectedKey === key }]"
              @click="selectKey(key)"
            >
              <span class="key-index">{{ idx + 1 }}</span>
              <span class="key-name">{{ key }}</span>
              <ReButton
                text

                type="danger"
                icon="Close"
                @click.stop="deleteKey(key)"
                class="key-del-btn"
              >
                <ReIcon name="Close" />
              </ReButton>
            </div>
          </div>
        </div>
    </ReCard>

    <ReCard class="panel panel-right" layout="simple" :radius="10" :padding="0" shadow="never">
      <template #header>
        <div class="panel-head">
          <div class="panel-head-left">
            <span class="panel-title">缓存内容</span>
          </div>
          <ReButton
            v-if="selectedKey"
            type="danger"
            text

            icon="Close"
            show-text
            @click="clearSelectedKey"
            class="panel-clear-btn"
          >
            <ReIcon name="Close" />
            清空
          </ReButton>
        </div>
      </template>

      <div class="panel-body">
          <ReEmpty
            v-if="!selectedKey"
            description="选择键名后查看缓存内容，键值数据将以 JSON 格式展示"
            layout="modern"
            :image-size="72"
          />
          <div v-else class="content-detail">
            <div class="content-key-bar">
              <span class="content-key-label">Key</span>
              <span class="content-key-value">{{ selectedKey }}</span>
            </div>
            <div class="content-meta">
              <div class="meta-item">
                <span class="meta-label">类型</span>
                <span class="meta-value">{{ cacheType }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">大小</span>
                <span class="meta-value">{{ cacheSize }} bytes</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">TTL</span>
                <span :class="['meta-value', cacheTtl === -1 ? 'ttl-persistent' : 'ttl-temp']">{{ cacheTtlDisplay }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">过期时间</span>
                <span class="meta-value">{{ cacheExpireAt }}</span>
              </div>
            </div>
            <div class="content-value-wrap">
              <div class="value-head">
                <span class="value-label">Value</span>
                <div class="value-actions">
                  <ReButton icon="CopyDocument" show-text @click="copyValue" class="value-copy-btn">
                    <ReIcon name="CopyDocument" />
                    复制
                  </ReButton>
                  <ReButton type="danger" icon="Delete" @click="clearSelectedKey" class="value-del-btn">
              <ReIcon name="Delete" />
                  </ReButton>
                </div>
              </div>
              <pre class="value-content">{{ cacheValue }}</pre>
            </div>
          </div>
        </div>
      </ReCard>
    </div>
  </div>
</template>

<script setup lang="ts" name="ReCacheMonitor">
import { ref, computed } from 'vue'
import { message } from '@repo/core'
import { scanRedisKeys, getRedisKeyDetail, getCacheSummary, delRedisKeys, getTasks } from '../../api'

const lastRefresh = ref('—')

const cachePrefixes = ref<any[]>([])
const selectedCache = ref('')

const keyList = ref<string[]>([])
const selectedKey = ref('')

const cacheValue = ref('')
const cacheType = ref('STRING')
const cacheSize = ref(0)
const cacheTtl = ref(-1)
const cacheExpireAt = ref('—')

const cacheTtlDisplay = computed(() => {
  if (cacheTtl.value === -1) return '永久'
  if (cacheTtl.value >= 86400) return `${(cacheTtl.value / 86400).toFixed(1)} 天`
  if (cacheTtl.value >= 3600) return `${(cacheTtl.value / 3600).toFixed(1)} 小时`
  if (cacheTtl.value >= 60) return `${(cacheTtl.value / 60).toFixed(1)} 分钟`
  return `${cacheTtl.value} 秒`
})

const refreshAll = async () => {
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  await refreshCacheList()
}

const refreshCacheList = async () => {
  const cacheList = await resolveCacheSummary()
  if (cacheList) {
    cachePrefixes.value = cacheList
  }
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** 解析当前 Redis 采集任务并获取缓存前缀汇总；无任务或失败返回 null */
const resolveCacheSummary = async (): Promise<any[] | null> => {
  try {
    const tasks = await getTasks()
    const redisTask = tasks.find((t: any) => t.serviceType === 'REDIS')
    if (!redisTask) return null
    const summary = await getCacheSummary(redisTask.id)
    return summary && summary.length > 0
      ? summary
      : [{ prefix: '*', remark: '全部缓存（未按前缀分组）', count: 0 }]
  } catch (e: any) {
    message.warning(e?.message || '缓存汇总加载失败')
    return null
  }
}

const refreshKeyList = async () => {
  if (!selectedCache.value) return
  const keys = await resolveKeys(selectedCache.value)
  keyList.value = keys ?? []
}

/** 解析当前 Redis 采集任务并按前缀扫描键名；无任务或失败返回 null */
const resolveKeys = async (prefix: string): Promise<string[] | null> => {
  try {
    const tasks = await getTasks()
    const redisTask = tasks.find((t: any) => t.serviceType === 'REDIS')
    if (!redisTask) return null
    const result = await scanRedisKeys(redisTask.id, prefix)
    return result.keys || []
  } catch (e: any) {
    message.warning(e?.message || '键名加载失败')
    return null
  }
}

const selectCache = async (prefix: string) => {
  selectedCache.value = prefix
  selectedKey.value = ''
  keyList.value = []
  cacheValue.value = ''
  const keys = await resolveKeys(prefix)
  keyList.value = keys ?? []
}

const selectKey = async (key: string) => {
  selectedKey.value = key
  try {
    const tasks = await getTasks()
    const redisTask = tasks.find((t: any) => t.serviceType === 'REDIS')
    if (!redisTask) return
    const detail = await getRedisKeyDetail(redisTask.id, key)
    cacheType.value = detail.type || 'STRING'
    cacheValue.value = detail.value ?? ''
    cacheSize.value = Number(detail.size) || 0
    cacheTtl.value = Number(detail.ttl) ?? -1
    cacheExpireAt.value = cacheTtl.value === -1 ? '—' : new Date(Date.now() + cacheTtl.value * 1000).toLocaleString('zh-CN')
  } catch (e: any) {
    message.warning(e?.message || '键值加载失败')
  }
}

const deleteKey = async (key: string) => {
  try {
    await message.confirm(`确认删除键: ${key}`)
    const tasks = await getTasks()
    const redisTask = tasks.find((t: any) => t.serviceType === 'REDIS')
    if (redisTask) {
      await delRedisKeys(redisTask.id, [key])
    }
    keyList.value = keyList.value.filter(k => k !== key)
    if (selectedKey.value === key) {
      selectedKey.value = ''
      cacheValue.value = ''
    }
    message.success('删除成功')
  } catch (e: any) {
    if (!e) return; message.error(e.message || '删除失败')
  }
}

const clearCachePrefix = async (prefix: string) => {
  try {
    await message.confirm(`确认清空所有 ${prefix} 开头的缓存？此操作不可恢复！`)
    const tasks = await getTasks()
    const redisTask = tasks.find((t: any) => t.serviceType === 'REDIS')
    if (!redisTask) {
      message.warning('未找到 Redis 采集任务')
      return
    }
    const result = await scanRedisKeys(redisTask.id, prefix)
    const keys = result.keys || []
    if (keys.length === 0) {
      message.info('该前缀下没有键')
      return
    }
    // 分批删除，避免单请求过大
    const batchSize = 500
    let total = 0
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      const removed = await delRedisKeys(redisTask.id, batch)
      total += Number(removed) || 0
    }
    message.success(`已清理 ${total} 个键`)
    cachePrefixes.value = cachePrefixes.value.filter((c: any) => c.prefix !== prefix)
    if (selectedCache.value === prefix) {
      selectedCache.value = ''
      selectedKey.value = ''
      keyList.value = []
      cacheValue.value = ''
    } else {
      await refreshCacheList()
    }
  } catch (e: any) {
    if (!e || e === 'cancel') return
    message.error(e.message || '操作失败')
  }
}

const clearSelectedKey = async () => {
  if (!selectedKey.value) return
  try {
    await message.confirm(`确认删除键: ${selectedKey.value}`)
    await deleteKey(selectedKey.value)
  } catch (e: any) {
    // 用户取消确认框时 e 为 'cancel'，静默处理
    if (!e || e === 'cancel') return
    message.error(e.message || '删除失败')
  }
}

const copyValue = () => {
  if (!cacheValue.value) return
    navigator.clipboard.writeText(cacheValue.value).then(() => {
      message.success('已复制到剪贴板')
    }).catch(() => {
      message.warning('复制失败，请手动复制')
    })
}

refreshAll()
</script>

 .cache-monitor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 16px);
  height: 100%;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}
.title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.title-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--metric-net) 10%, transparent);
  color: var(--metric-net);
  letter-spacing: 0.5px;
}
.page-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}
.page-desc { font-size: 11.5px; color: var(--text-tertiary); margin: 0; }
.header-right { display: flex; align-items: center; gap: 12px; }
.refresh-time {
  font-size: 11.5px;
  color: var(--text-tertiary);
  font-family: 'SF Mono', monospace;
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--border-radius-sm);
  padding: 7px 14px;
  font-size: 12.5px;
  font-weight: 500;
  transition: var(--transition-base);
}
.refresh-btn:hover { transform: translateY(-1px); }

.three-panel {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}
.panel {
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: var(--transition-base);
}
.panel.panel-left { border-left: 3px solid var(--metric-net); }
.panel.panel-mid { border-left: 3px solid var(--status-success); }
.panel.panel-right { border-left: 3px solid var(--metric-cpu); }
.panel.panel-active {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}
.panel:focus-within { box-shadow: var(--shadow-card), var(--focus-ring); }
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-fill);
  flex-shrink: 0;
}
.panel-head-left { display: flex; align-items: center; gap: 10px; }
.panel-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.panel-count { font-size: 11.5px; color: var(--text-tertiary); }
.panel-refresh, .panel-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}
.panel-refresh:hover {
  background: color-mix(in srgb, var(--metric-net) 8%, transparent);
  color: var(--metric-net);
}
.panel-refresh svg { width: 14px; height: 14px; stroke-width: 2; }
.panel-body { flex: 1; overflow: auto; padding: 6px; }

.cache-list { display: flex; flex-direction: column; gap: 4px; }
.cache-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: var(--transition-base);
  border: 1px solid transparent;
}
.cache-item:hover {
  background: color-mix(in srgb, var(--metric-net) 4%, transparent);
  border-color: color-mix(in srgb, var(--metric-net) 20%, transparent);
}
.cache-item.active {
  background: color-mix(in srgb, var(--metric-net) 10%, transparent);
  border-color: var(--metric-net);
}
.cache-index {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--bg-fill);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.cache-item.active .cache-index {
  background: var(--metric-net);
  color: var(--text-inverse);
}
.cache-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cache-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: 'SF Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cache-remark { font-size: 11px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cache-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.cache-count { font-size: 11px; color: var(--text-secondary); font-weight: 500; }
.cache-del-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 4px;
  opacity: 0.4;
  transition: opacity 0.2s;
}
.cache-del-btn svg { width: 13px; height: 13px; }
.cache-del-btn:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--status-error) 8%, transparent);
}

.key-list { display: flex; flex-direction: column; gap: 4px; }
.key-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: var(--transition-base);
  border: 1px solid transparent;
}
.key-item:hover {
  background: color-mix(in srgb, var(--metric-net) 4%, transparent);
  border-color: color-mix(in srgb, var(--metric-net) 20%, transparent);
}
.key-item.active {
  background: color-mix(in srgb, var(--status-success) 8%, transparent);
  border-color: var(--status-success);
}
.key-index {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--bg-fill);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.key-item.active .key-index {
  background: var(--status-success);
  color: var(--text-inverse);
}
.key-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--text-primary);
  font-family: 'SF Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.key-del-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 4px;
  opacity: 0.4;
  transition: opacity 0.2s;
}
.key-del-btn svg { width: 13px; height: 13px; }
.key-del-btn:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--status-error) 8%, transparent);
}

.content-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px;
  height: 100%;
}
.content-key-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-fill);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-subtle);
}
.content-key-label {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.content-key-value {
  font-size: 12px;
  color: var(--text-primary);
  font-family: 'SF Mono', monospace;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-meta {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.meta-item {
  padding: 6px 8px;
  background: var(--bg-fill);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid var(--border-subtle);
}
.meta-label { font-size: 10.5px; color: var(--text-tertiary); font-weight: 500; }
.meta-value {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
  font-family: 'SF Mono', monospace;
}
.ttl-temp { color: var(--metric-disk) !important; }
.ttl-persistent { color: var(--status-success) !important; }

.content-value-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
}
.value-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--border-subtle);
}
.value-label { font-size: 11px; color: var(--text-tertiary); font-weight: 500; }
.value-actions { display: flex; gap: 6px; }
.value-copy-btn, .value-del-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11.5px;
  border-radius: 6px;
  background: var(--bg-fill);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  transition: all 0.2s;
}
.value-copy-btn:hover {
  background: color-mix(in srgb, var(--metric-net) 8%, transparent);
  color: var(--metric-net);
  border-color: color-mix(in srgb, var(--metric-net) 20%, transparent);
}
.value-del-btn:hover {
  background: color-mix(in srgb, var(--status-error) 8%, transparent);
  color: var(--status-error);
  border-color: color-mix(in srgb, var(--status-error) 20%, transparent);
}
.value-copy-btn svg, .value-del-btn svg { width: 12px; height: 12px; }

.value-content {
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-sm);
  font-family: 'SF Mono', 'Cascadia Code', 'Menlo', monospace;
  font-size: 11.5px;
  color: var(--text-primary);
  line-height: 1.6;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 12px;
  color: var(--text-tertiary);
}

/* 可访问性：键盘焦点可见 */
.refresh-btn:focus-visible,
.panel-refresh:focus-visible,
.panel-clear-btn:focus-visible,
.cache-del-btn:focus-visible,
.key-del-btn:focus-visible,
.value-copy-btn:focus-visible,
.value-del-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--border-radius-sm);
}
.cache-item:focus-visible,
.key-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* 交互过渡统一 200ms，带轻微位移 */
.cache-item,
.key-item {
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.cache-item:hover,
.key-item:hover {
  transform: translateX(2px);
}
.panel,
.panel-refresh,
.panel-clear-btn,
.cache-del-btn,
.key-del-btn,
.value-copy-btn,
.value-del-btn,
.refresh-btn,
.meta-item {
  transition: box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}
.meta-item:hover {
  background: color-mix(in srgb, var(--brand-500) 4%, var(--bg-fill));
}

/* 响应式：窄屏下三栏折叠为单栏 */
@media (max-width: 1100px) {
  .three-panel {
    grid-template-columns: 1fr;
    overflow: auto;
  }
  .panel-body {
    max-height: 320px;
  }
}
@media (max-width: 640px) {
  .header-bar {
    flex-direction: column;
    gap: 10px;
  }
  .content-meta {
    grid-template-columns: repeat(2, 1fr);
  }
}
.empty-icon { width: 24px; height: 24px; color: var(--border-default); }
.empty-text { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.empty-sub { font-size: 11px; color: var(--text-tertiary); }
.empty-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 12px;
  color: var(--text-tertiary);
  flex: 1;
  justify-content: center;
}
.empty-icon-large { width: 40px; height: 40px; color: var(--border-default); }
