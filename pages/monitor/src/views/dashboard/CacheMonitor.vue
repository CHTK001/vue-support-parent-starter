<template>
  <div class="cache-monitor fade-in">
    <!-- ===== 1. 顶部通栏标题区 ===== -->
    <header class="header-bar">
      <div class="header-left">
        <div class="title-row">
          <span class="title-badge">Cache</span>
          <h1 class="page-title">缓存监控</h1>
        </div>
        <p class="page-desc">分级浏览 Redis 缓存前缀，支持单条 / 全量清理</p>
      </div>
      <div class="header-right">
        <span class="refresh-time">最后更新: {{ lastRefresh }}</span>
        <el-button @click="refreshAll" class="refresh-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon">
            <path d="M21 12a9 9 0 11-3-6.7L13 8" />
            <path d="M3 7v6h6" />
          </svg>
          刷新
        </el-button>
      </div>
    </header>

    <!-- ===== 2. 三等分联动面板 ===== -->
    <div class="three-panel">
      <!-- 左：缓存列表（一级分类） -->
      <div class="panel panel-left" :class="{ 'panel-active': selectedCache }">
        <div class="panel-head">
          <div class="panel-head-left">
            <span class="panel-title">缓存列表</span>
            <span class="panel-count">共 {{ cachePrefixes.length }} 条</span>
          </div>
          <el-button text size="small" @click="refreshCacheList" class="panel-refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 11-3-6.7L13 8"/><path d="M3 7v6h6"/></svg>
          </el-button>
        </div>

        <div class="panel-body">
          <div v-if="cachePrefixes.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
            </svg>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"/><path d="M9 6V4h6v2"/><path d="M5 6l1 14h12l1-14"/>
                  </svg>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中：键名列表（二级明细） -->
      <div class="panel panel-mid" :class="{ 'panel-active': selectedKey }">
        <div class="panel-head">
          <div class="panel-head-left">
            <span class="panel-title">键名列表</span>
            <span class="panel-count">{{ selectedCache ? `共 ${keyList.length} 个` : '' }}</span>
          </div>
          <el-button v-if="selectedCache" text size="small" @click="refreshKeyList" class="panel-refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 11-3-6.7L13 8"/><path d="M3 7v6h6"/></svg>
          </el-button>
        </div>

        <div class="panel-body">
          <div v-if="!selectedCache" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <span class="empty-text">请先选择缓存名称</span>
            <span class="empty-sub">点击左侧缓存列表查看键名</span>
          </div>
          <div v-else-if="keyList.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>
            </svg>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：缓存内容（详情） -->
      <div class="panel panel-right">
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            清空
          </el-button>
        </div>

        <div class="panel-body">
          <div v-if="!selectedKey" class="empty-state empty-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon-large">
              <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8" stroke-linecap="round"/>
            </svg>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>
                    </svg>
                    复制
                  </el-button>
                  <el-button size="small" type="danger" @click="clearSelectedKey" class="value-del-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </el-button>
                </div>
              </div>
              <pre class="value-content">{{ cacheValue }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scanRedisKeys, getRedisValue, setRedisValue, delRedisKeys, getMonitors, getTasks } from '../../api'

const lastRefresh = ref('—')

// ===== 左面板：缓存前缀列表 =====
const cachePrefixes = ref<any[]>([])
const selectedCache = ref('')

// ===== 中面板：键名列表 =====
const keyList = ref<string[]>([])
const selectedKey = ref('')

// ===== 右面板：缓存内容 =====
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

// 模拟缓存前缀数据（后续对接后端 SCAN 接口）
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

// 模拟键名数据
const mockKeyNames = (prefix: string): string[] => {
  const names: string[] = []
  const n = Math.floor(Math.random() * 8) + 3
  for (let i = 0; i < n; i++) {
    names.push(`${prefix.replace('*', '')}${['0001', '0042', '1001', '2048', '3001', '4056', '5120', '6088'][i]}`)
  }
  return names
}

// 模拟值数据
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

// ===== 操作 =====

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
  // 通过 Redis 操作扫描键
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

  // 尝试从后端获取真实值
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
    // 使用 mock 数据
  }
}

const deleteKey = async (key: string) => {
  try {
    await ElMessageBox.confirm(`确认删除键: ${key}`, '提示', { type: 'warning' })
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
    ElMessage.success('删除成功')
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败')
  }
}

const clearCachePrefix = async (prefix: string) => {
  try {
    await ElMessageBox.confirm(`确认清空所有 ${prefix} 开头的缓存？此操作不可恢复！`, '警告', { type: 'error' })
    ElMessage.warning('请通过任务管理创建删除任务或使用 Redis CLI 操作')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

const clearSelectedKey = async () => {
  if (!selectedKey.value) return
  try {
    await ElMessageBox.confirm(`确认删除键: ${selectedKey.value}`, '提示', { type: 'warning' })
    await deleteKey(selectedKey.value)
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

const copyValue = () => {
  if (!cacheValue.value) return
  navigator.clipboard.writeText(cacheValue.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制')
  })
}

refreshAll()
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.cache-monitor { display: flex; flex-direction: column; gap: 16px; height: 100%; }

/* ===== 顶部标题栏 ===== */
.header-bar {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 18px 22px;
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
}
.title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.title-badge {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 999px; background: #e0e7ff; color: #3b82f6; letter-spacing: 0.5px;
}
.page-title { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0; letter-spacing: -0.3px; }
.page-desc { font-size: 12px; color: #9ca3af; margin: 0; }
.header-right { display: flex; align-items: center; gap: 14px; }
.refresh-time { font-size: 12px; color: #9ca3af; }
.refresh-btn {
  display: flex; align-items: center; gap: 6px;
  background: #f1f5f9; color: #4b5563; border: 1px solid #e5e7eb;
  border-radius: 10px; padding: 8px 16px; font-size: 13px;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.refresh-btn:hover { background: #e2e8f0; transform: translateY(-1px); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

/* ===== 三等分面板 ===== */
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
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel.panel-left { border-left: 3px solid #3b82f6; }
.panel.panel-mid { border-left: 3px solid #10b981; }
.panel.panel-right { border-left: 3px solid #8b5cf6; }
.panel.panel-active { box-shadow: 0 6px 20px rgba(0,0,0,0.06); }

.panel-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
  background: #f8fafc;
  flex-shrink: 0;
}
.panel-head-left { display: flex; align-items: center; gap: 10px; }
.panel-title { font-size: 13px; font-weight: 600; color: #1f2937; }
.panel-count { font-size: 11.5px; color: #9ca3af; }
.panel-refresh, .panel-clear-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 4px; border-radius: 6px;
  transition: all 0.2s;
}
.panel-refresh:hover { background: #e0e7ff; color: #3b82f6; }
.panel-refresh svg { width: 14px; height: 14px; stroke-width: 2; }

.panel-body { flex: 1; overflow: auto; padding: 6px; }

/* ===== 缓存列表 ===== */
.cache-list { display: flex; flex-direction: column; gap: 4px; }
.cache-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.cache-item:hover { background: #f0f7ff; border-color: #bfdbfe; }
.cache-item.active { background: #e0e7ff; border-color: #3b82f6; }
.cache-index {
  width: 22px; height: 22px; border-radius: 6px;
  background: #f1f5f9; color: #9ca3af;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; flex-shrink: 0;
}
.cache-item.active .cache-index { background: #3b82f6; color: #fff; }
.cache-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cache-name { font-size: 12px; font-weight: 500; color: #1f2937; font-family: 'SF Mono', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cache-remark { font-size: 11px; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cache-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.cache-count { font-size: 11px; color: #4b5563; font-weight: 500; }
.cache-del-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 2px; border-radius: 4px; opacity: 0.4;
  transition: opacity 0.2s;
}
.cache-del-btn svg { width: 13px; height: 13px; }
.cache-del-btn:hover { opacity: 1; background: #fef2f2; }

/* ===== 键名列表 ===== */
.key-list { display: flex; flex-direction: column; gap: 4px; }
.key-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent;
}
.key-item:hover { background: #f0fdf4; border-color: #a7f3d0; }
.key-item.active { background: #ecfdf5; border-color: #10b981; }
.key-index {
  width: 22px; height: 22px; border-radius: 6px;
  background: #f1f5f9; color: #9ca3af;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; flex-shrink: 0;
}
.key-item.active .key-index { background: #10b981; color: #fff; }
.key-name { flex: 1; min-width: 0; font-size: 12px; color: #1f2937; font-family: 'SF Mono', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.key-del-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 2px; border-radius: 4px; opacity: 0.4;
  transition: opacity 0.2s;
}
.key-del-btn svg { width: 13px; height: 13px; }
.key-del-btn:hover { opacity: 1; background: #fef2f2; }

/* ===== 缓存内容 ===== */
.content-detail { display: flex; flex-direction: column; gap: 10px; padding: 4px; height: 100%; }
.content-key-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: #f8fafc; border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.content-key-label { font-size: 11px; color: #9ca3af; font-weight: 500; }
.content-key-value { font-size: 12px; color: #1f2937; font-family: 'SF Mono', monospace; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.content-meta {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
}
.meta-item {
  padding: 6px 8px; background: #f8fafc; border-radius: 6px;
  display: flex; flex-direction: column; gap: 2px;
  border: 1px solid #f0f0f0;
}
.meta-label { font-size: 10.5px; color: #9ca3af; font-weight: 500; }
.meta-value { font-size: 12px; color: #1f2937; font-weight: 500; font-family: 'SF Mono', monospace; }
.ttl-temp { color: #f97316 !important; }
.ttl-persistent { color: #10b981 !important; }

.content-value-wrap {
  display: flex; flex-direction: column; gap: 6px;
  flex: 1; min-height: 0;
}
.value-head {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--el-border-color-lighter, #e5e7eb);
}
.value-label { font-size: 11px; color: #9ca3af; font-weight: 500; }
.value-actions { display: flex; gap: 6px; }
.value-copy-btn, .value-del-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; font-size: 11.5px; border-radius: 6px;
  background: #f1f5f9; color: #4b5563;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}
.value-copy-btn:hover { background: #e0e7ff; color: #3b82f6; border-color: #bfdbfe; }
.value-del-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
.value-copy-btn svg, .value-del-btn svg { width: 12px; height: 12px; }

.value-content {
  flex: 1; min-height: 0;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: 'SF Mono', 'Cascadia Code', 'Menlo', monospace;
  font-size: 11.5px;
  color: #1f2937;
  line-height: 1.6;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 24px 12px;
  color: #9ca3af;
}
.empty-icon { width: 24px; height: 24px; color: #d1d5db; }
.empty-text { font-size: 12px; font-weight: 500; color: #6b7280; }
.empty-sub { font-size: 11px; color: #9ca3af; }
.empty-large {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 24px 12px; color: #9ca3af;
  flex: 1; justify-content: center;
}
.empty-icon-large { width: 40px; height: 40px; color: #d1d5db; }
</style>
