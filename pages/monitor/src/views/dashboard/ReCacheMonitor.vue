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
          <el-button plain @click="refreshAll" class="refresh-btn">
            <ReIcon name="RefreshLeft" />
            刷新
          </el-button>
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
          <el-button text size="small" @click="refreshCacheList" class="panel-refresh">
            <ReIcon name="RefreshLeft" />
          </el-button>
        </div>
      </template>

        <div class="panel-body">
          <div v-if="cachePrefixes.length === 0" class="empty-state">
            <ReIcon class="empty-icon" name="Search" />
            <span class="empty-text">暂无缓存数据</span>
          </div>
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
                <el-button
                  text
                  size="small"
                  type="danger"
                  @click.stop="clearCachePrefix(item.prefix)"
                  class="cache-del-btn"
                >
                    <ReIcon name="Delete" />
                </el-button>
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
          <el-button v-if="selectedCache" text size="small" @click="refreshKeyList" class="panel-refresh">
            <ReIcon name="RefreshLeft" />
          </el-button>
        </div>
      </template>

      <div class="panel-body">
          <div v-if="!selectedCache" class="empty-state">
            <ReIcon class="empty-icon" name="Search" />
            <span class="empty-text">请先选择缓存名称</span>
            <span class="empty-sub">点击左侧缓存列表查看键名</span>
          </div>
          <div v-else-if="keyList.length === 0" class="empty-state">
            <ReIcon class="empty-icon" name="QuestionFilled" />
            <span class="empty-text">该缓存下暂无键</span>
          </div>
          <div v-else class="key-list">
            <div
              v-for="(key, idx) in keyList"
              :key="key"
              :class="['key-item', { active: selectedKey === key }]"
              @click="selectKey(key)"
            >
              <span class="key-index">{{ idx + 1 }}</span>
              <span class="key-name">{{ key }}</span>
              <el-button
                text
                size="small"
                type="danger"
                @click.stop="deleteKey(key)"
                class="key-del-btn"
              >
                <ReIcon name="Close" />
              </el-button>
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
          <el-button
            v-if="selectedKey"
            type="danger"
            text
            size="small"
            @click="clearSelectedKey"
            class="panel-clear-btn"
          >
            <ReIcon name="Close" />
            清空
          </el-button>
        </div>
      </template>

      <div class="panel-body">
          <div v-if="!selectedKey" class="empty-state empty-large">
            <ReIcon class="empty-icon-large" name="CirclePlus" />
            <span class="empty-text">选择键名后查看缓存内容</span>
            <span class="empty-sub">键值数据将以 JSON 格式展示</span>
          </div>
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
                  <el-button size="small" @click="copyValue" class="value-copy-btn">
                    <ReIcon name="CopyDocument" />
                    复制
                  </el-button>
                  <el-button size="small" type="danger" @click="clearSelectedKey" class="value-del-btn">
              <ReIcon name="Delete" />
                  </el-button>
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
import { scanRedisKeys, getRedisValue, setRedisValue, delRedisKeys, getMonitors, getTasks } from '../../api'

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

const mockCachePrefixes = [
  { prefix: 'user:*', remark: '用户会话与基本信息', count: 28456 },
  { prefix: 'session:*', remark: 'Web 会话 Token', count: 12480 },
  { prefix: 'product:*', remark: '商品缓存', count: 8920 },
  { prefix: 'order:*', remark: '订单临时数据', count: 6540 },
  { prefix: 'cart:*', remark: '购物车信息', count: 3210 },
  { prefix: 'coupon:*', remark: '优惠券数据', count: 1850 },
  { prefix: 'sys:*', remark: '系统配置与字典', count: 420 },
  { prefix: 'lock:*', remark: '分布式锁', count: 12 },
]

const mockKeyNames = (prefix: string): string[] => {
  const names: string[] = []
  const n = Math.floor(Math.random() * 8) + 3
  for (let i = 0; i < n; i++) {
    names.push(`${prefix.replace('*', '')}${['0001', '0042', '1001', '2048', '3001', '4056', '5120', '6088'][i]}`)
  }
  return names
}

const mockValue = (key: string): { type: string; value: string; size: number; ttl: number } => {
  const idx = parseInt(key.slice(-4))
  if (idx % 3 === 0) {
    return {
      type: 'HASH',
      value: JSON.stringify({ id: idx, name: `item_${idx}`, status: 'active', created: '2026-08-05' }, null, 2),
      size: 128 + idx % 200,
      ttl: idx % 2 === 0 ? 86400 : -1,
    }
  }
  if (idx % 3 === 1) {
    return {
      type: 'STRING',
      value: `value_for_key_${idx}`,
      size: 32 + idx % 100,
      ttl: 3600 * (1 + idx % 4),
    }
  }
  return {
    type: 'LIST',
    value: JSON.stringify(['element_a', 'element_b', 'element_c'], null, 2),
    size: 96 + idx % 150,
    ttl: idx % 2 === 0 ? 3600 : -1,
  }
}

const refreshAll = () => {
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  cachePrefixes.value = mockCachePrefixes.map(c => ({ ...c, count: c.count + Math.floor(Math.random() * 50) }))
}

const refreshCacheList = () => {
  cachePrefixes.value = mockCachePrefixes.map(c => ({ ...c, count: c.count + Math.floor(Math.random() * 50) }))
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const refreshKeyList = () => {
  keyList.value = mockKeyNames(selectedCache.value)
}

const selectCache = async (prefix: string) => {
  selectedCache.value = prefix
  selectedKey.value = ''
  keyList.value = []
  cacheValue.value = ''
  try {
    const tasks = await getTasks()
    const redisTask = tasks.find((t: any) => t.serviceType === 'REDIS')
    if (redisTask) {
      const result = await scanRedisKeys(redisTask.id, prefix)
      keyList.value = result.keys || []
    }
  } catch {
    keyList.value = mockKeyNames(prefix)
  }
}

const selectKey = async (key: string) => {
  selectedKey.value = key
  const info = mockValue(key)
  cacheType.value = info.type
  cacheValue.value = info.value
  cacheSize.value = info.size
  cacheTtl.value = info.ttl
  cacheExpireAt.value = info.ttl === -1 ? '—' : new Date(Date.now() + info.ttl * 1000).toLocaleString('zh-CN')

  try {
    const tasks = await getTasks()
    const redisTask = tasks.find((t: any) => t.serviceType === 'REDIS')
    if (redisTask) {
      const realValue = await getRedisValue(redisTask.id, key)
      if (realValue) {
        cacheValue.value = realValue
      }
    }
  } catch {
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
    message.warning('请通过任务管理创建删除任务或使用 Redis CLI 操作')
  } catch (e: any) {
    if (!e) return; message.error(e.message || '操作失败')
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

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.cache-monitor { display: flex; flex-direction: column; gap: 16px; height: 100%; }

.header-bar {
  display: flex; justify-content: space-between; align-items: flex-start;
}
.title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.title-badge {
  font-size: 10.5px; font-weight: 700; padding: 2px 8px;
  border-radius: 4px; background: color-mix(in srgb, var(--el-color-primary) 10%, transparent); color: var(--el-color-primary); letter-spacing: 0.5px;
}
.page-title { font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); margin: 0; letter-spacing: -0.3px; }
.page-desc { font-size: 11.5px; color: var(--el-text-color-secondary); margin: 0; }
.header-right { display: flex; align-items: center; gap: 12px; }
.refresh-time { font-size: 11.5px; color: var(--el-text-color-secondary); font-family: 'SF Mono', monospace; }
.refresh-btn {
  display: flex; align-items: center; gap: 6px;
  border-radius: 8px; padding: 7px 14px; font-size: 12.5px; font-weight: 500;
}

.three-panel {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.panel {
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter);
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel.panel-left { border-left: 3px solid var(--el-color-primary); }
.panel.panel-mid { border-left: 3px solid var(--el-color-success); }
.panel.panel-right { border-left: 3px solid var(--el-color-primary); }
.panel.panel-active { box-shadow: 0 6px 20px rgba(0,0,0,0.06); }

.panel-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.panel-head-left { display: flex; align-items: center; gap: 10px; }
.panel-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.panel-count { font-size: 11.5px; color: var(--el-text-color-secondary); }
.panel-refresh, .panel-clear-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 4px; border-radius: 6px;
  transition: all 0.2s;
}
.panel-refresh:hover { background: color-mix(in srgb, var(--el-color-primary) 8%, transparent); color: var(--el-color-primary); }
.panel-refresh svg { width: 14px; height: 14px; stroke-width: 2; }

.panel-body { flex: 1; overflow: auto; padding: 6px; }

.cache-list { display: flex; flex-direction: column; gap: 4px; }
.cache-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.cache-item:hover { background: color-mix(in srgb, var(--el-color-primary) 4%, transparent); border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent); }
.cache-item.active { background: color-mix(in srgb, var(--el-color-primary) 10%, transparent); border-color: var(--el-color-primary); }
.cache-index {
  width: 22px; height: 22px; border-radius: 6px;
  background: var(--el-fill-color-light); color: var(--el-text-color-secondary);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; flex-shrink: 0;
}
.cache-item.active .cache-index { background: var(--el-color-primary); color: var(--el-bg-color); }
.cache-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cache-name { font-size: 12px; font-weight: 500; color: var(--el-text-color-primary); font-family: 'SF Mono', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cache-remark { font-size: 11px; color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cache-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.cache-count { font-size: 11px; color: var(--el-text-color-regular); font-weight: 500; }
.cache-del-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 2px; border-radius: 4px; opacity: 0.4;
  transition: opacity 0.2s;
}
.cache-del-btn svg { width: 13px; height: 13px; }
.cache-del-btn:hover { opacity: 1; background: color-mix(in srgb, var(--el-color-danger) 8%, transparent); }

.key-list { display: flex; flex-direction: column; gap: 4px; }
.key-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent;
}
.key-item:hover { background: color-mix(in srgb, var(--el-color-success) 4%, transparent); border-color: color-mix(in srgb, var(--el-color-success) 20%, transparent); }
.key-item.active { background: color-mix(in srgb, var(--el-color-success) 8%, transparent); border-color: var(--el-color-success); }
.key-index {
  width: 22px; height: 22px; border-radius: 6px;
  background: var(--el-fill-color-light); color: var(--el-text-color-secondary);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; flex-shrink: 0;
}
.key-item.active .key-index { background: var(--el-color-success); color: var(--el-bg-color); }
.key-name { flex: 1; min-width: 0; font-size: 12px; color: var(--el-text-color-primary); font-family: 'SF Mono', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.key-del-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 2px; border-radius: 4px; opacity: 0.4;
  transition: opacity 0.2s;
}
.key-del-btn svg { width: 13px; height: 13px; }
.key-del-btn:hover { opacity: 1; background: color-mix(in srgb, var(--el-color-danger) 8%, transparent); }

.content-detail { display: flex; flex-direction: column; gap: 10px; padding: 4px; height: 100%; }
.content-key-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--el-fill-color-light); border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}
.content-key-label { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 500; }
.content-key-value { font-size: 12px; color: var(--el-text-color-primary); font-family: 'SF Mono', monospace; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.content-meta {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
}
.meta-item {
  padding: 6px 8px; background: var(--el-fill-color-light); border-radius: 6px;
  display: flex; flex-direction: column; gap: 2px;
  border: 1px solid var(--el-border-color-lighter);
}
.meta-label { font-size: 10.5px; color: var(--el-text-color-secondary); font-weight: 500; }
.meta-value { font-size: 12px; color: var(--el-text-color-primary); font-weight: 500; font-family: 'SF Mono', monospace; }
.ttl-temp { color: var(--el-color-warning) !important; }
.ttl-persistent { color: var(--el-color-success) !important; }

.content-value-wrap {
  display: flex; flex-direction: column; gap: 6px;
  flex: 1; min-height: 0;
}
.value-head {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.value-label { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 500; }
.value-actions { display: flex; gap: 6px; }
.value-copy-btn, .value-del-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; font-size: 11.5px; border-radius: 6px;
  background: var(--el-fill-color-light); color: var(--el-text-color-regular);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;
}
.value-copy-btn:hover { background: color-mix(in srgb, var(--el-color-primary) 8%, transparent); color: var(--el-color-primary); border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent); }
.value-del-btn:hover { background: color-mix(in srgb, var(--el-color-danger) 8%, transparent); color: var(--el-color-danger); border-color: color-mix(in srgb, var(--el-color-danger) 20%, transparent); }
.value-copy-btn svg, .value-del-btn svg { width: 12px; height: 12px; }

.value-content {
  flex: 1; min-height: 0;
  padding: 12px 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  font-family: 'SF Mono', 'Cascadia Code', 'Menlo', monospace;
  font-size: 11.5px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 24px 12px;
  color: var(--el-text-color-secondary);
}
.empty-icon { width: 24px; height: 24px; color: var(--el-border-color); }
.empty-text { font-size: 12px; font-weight: 500; color: var(--el-text-color-regular); }
.empty-sub { font-size: 11px; color: var(--el-text-color-secondary); }
.empty-large {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 24px 12px; color: var(--el-text-color-secondary);
  flex: 1; justify-content: center;
}
.empty-icon-large { width: 40px; height: 40px; color: var(--el-border-color); }
</style>
