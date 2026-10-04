<template>
  <!--
    人脸底库管理（系统设置 → 底库 → 人脸底库）

    与「以图搜图 / 图像底库」同一分工：
      · 识别与检索在外侧菜单（人脸识别 / 以图搜图）
      · 底库的**管理**（查看 / 登记 / 删除）在设置中心
    这样两个同类功能的入口位置一致，也不会让「改底库」混在识别流程里。

    数据来源：
      · 服务端 `GET /v2/face/list` 是**权威**（跨浏览器、跨账号以它为准），
        每条形如 { id, metadata: {...登记时传入的档案字段} }
      · 本地登记簿（useFaceRegistry）只补服务端不存的**缩略图** thumb；
        两者按 id 合并，服务端有条目而本地无缩略图时给出明确提示，而不是显示空卡片。

    ★ 本组件只渲染内容区，导航与顶部栏由宿主提供。
    令牌口径：--el-*（Element Plus 运行时），不写死色值/圆角。
  -->
  <div class="fl-page">
    <!-- ── 页头 ───────────────────────────────────────────── -->
    <header class="fl-head">
      <div class="fl-head-text">
        <h2 class="fl-head-title">人脸底库</h2>
        <p class="fl-head-sub">当前账号的人脸库：登记、查看与删除。识别与检索在「人脸识别」页</p>
      </div>
      <div class="fl-head-actions">
        <el-button :disabled="loading" @click="refresh">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="primary" :disabled="loading" @click="openEnroll">
          <el-icon><Plus /></el-icon>人脸登记入库
        </el-button>
      </div>
    </header>

    <!-- ── 统计卡 ─────────────────────────────────────────── -->
    <section class="fl-stats">
      <div class="fl-stat">
        <el-icon class="fl-stat-icon is-primary"><UserFilled /></el-icon>
        <span class="fl-stat-label">已登记</span>
        <strong class="fl-stat-value">{{ rows.length }}</strong>
      </div>
      <div class="fl-stat">
        <el-icon class="fl-stat-icon is-success"><Picture /></el-icon>
        <span class="fl-stat-label">有缩略图</span>
        <strong class="fl-stat-value">{{ withThumb }}</strong>
      </div>
      <div class="fl-stat">
        <el-icon class="fl-stat-icon is-warning"><Warning /></el-icon>
        <span class="fl-stat-label">缺缩略图</span>
        <strong class="fl-stat-value">{{ rows.length - withThumb }}</strong>
      </div>
    </section>

    <!-- 服务端有条目、本地没有缩略图：说清原因，不要让人以为底库丢了 -->
    <el-alert
      v-if="rows.length - withThumb > 0"
      class="fl-alert"
      type="info"
      :closable="false"
      show-icon
      :title="`有 ${rows.length - withThumb} 条在本浏览器没有缩略图`"
      description="缩略图只存在登记它的那个浏览器里（后端不存）。底库条目本身以服务端为准，1:N 识别不受影响。"
    />

    <!-- ── 列表 ───────────────────────────────────────────── -->
    <el-skeleton v-if="loading && !rows.length" :rows="4" animated />

    <el-empty v-else-if="!rows.length" description="人脸库为空">
      <el-button type="primary" @click="openEnroll">
        <el-icon><Plus /></el-icon>人脸登记入库
      </el-button>
    </el-empty>

    <section v-else class="fl-grid">
      <article v-for="it in rows" :key="it.id" class="fl-card">
        <div class="fl-card-face">
          <img v-if="it.thumb" :src="it.thumb" :alt="it.name" class="fl-card-img" />
          <div v-else class="fl-card-fallback">
            <el-icon :size="26"><UserFilled /></el-icon>
          </div>
        </div>

        <div class="fl-card-body">
          <div class="fl-card-name" :title="it.name">{{ it.name || '（未命名）' }}</div>
          <div class="fl-card-tags">
            <span class="fl-tag">{{ ageBucket(it.age) }}</span>
            <span class="fl-tag">{{ it.gender || '未知' }}</span>
            <span v-if="it.hair" class="fl-tag">{{ it.hair }}</span>
          </div>
          <div class="fl-card-id" :title="it.idCard">身份证：{{ maskIdCard(it.idCard) || '—' }}</div>
          <div v-if="it.note" class="fl-card-note" :title="it.note">{{ it.note }}</div>
        </div>

        <div class="fl-card-ops">
          <el-button text type="danger" size="small" :disabled="deleting === it.id" @click="onDelete(it)">
            <el-icon><Delete /></el-icon>删除
          </el-button>
        </div>
      </article>
    </section>

    <FaceEnrollDialog v-model="enrollVisible" @enrolled="refresh" />
  </div>
</template>

<script setup lang="ts">
/**
 * 人脸底库管理面板。
 *
 * <p>与 {@link ImageLibraryPanel} 同构：列表 + 删除 + 新增入口。
 * 区别在于人脸底库的条目来自服务端 `GET /v2/face/list`（权威），
 * 而缩略图来自本地登记簿 —— 二者按 id 合并。</p>
 */
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Picture, Plus, Refresh, UserFilled, Warning } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { useFaceRegistry, ageBucket, maskIdCard } from '@/composables/useFaceRegistry'
import FaceEnrollDialog from '../management/FaceEnrollDialog.vue'

/** 合并后的展示行 */
interface Row {
  id: string
  name: string
  age: number | null
  gender: string
  hair: string
  idCard: string
  note: string
  thumb: string
}

const loading = ref(false)
const enrollVisible = ref(false)
const deleting = ref('')
const serverItems = ref<Array<Record<string, unknown>>>([])
const registry = useFaceRegistry()

/**
 * 服务端条目 + 本地缩略图 合并成展示行。
 *
 * <p>服务端每条是 {@code { id, metadata }}；metadata 里是登记时传入的档案字段。
 * 本地登记簿用同一 id 提供 thumb（后端不存缩略图）。
 * 字段一律做「服务端优先、本地兜底」，避免本地残留旧档案时盖掉服务端的真值。</p>
 */
const rows = computed<Row[]>(() =>
  serverItems.value.map((s) => {
    const id = String(s.id ?? '')
    const meta = (s.metadata && typeof s.metadata === 'object' ? s.metadata : {}) as Record<string, unknown>
    const local = registry.byId(id)
    const pick = (k: string): unknown => (meta[k] != null && meta[k] !== '' ? meta[k] : (local as any)?.[k])
    const ageRaw = pick('age')
    return {
      id,
      name: String(pick('name') ?? pick('label') ?? ''),
      age: typeof ageRaw === 'number' ? ageRaw : ageRaw == null || ageRaw === '' ? null : Number(ageRaw),
      gender: String(pick('gender') ?? ''),
      hair: String(pick('hair') ?? ''),
      idCard: String(pick('idCard') ?? ''),
      note: String(pick('note') ?? ''),
      thumb: local?.thumb ?? '',
    }
  }),
)

const withThumb = computed(() => rows.value.filter((r) => !!r.thumb).length)

async function refresh() {
  loading.value = true
  try {
    const { items } = await apiService.listFaces()
    serverItems.value = items as Array<Record<string, unknown>>
  } catch (e: any) {
    ElMessage.error('加载人脸底库失败：' + (e?.message ?? e))
  } finally {
    loading.value = false
  }
}

function openEnroll() {
  enrollVisible.value = true
}

/**
 * 删除一条：先删服务端（向量索引 + 快照），成功后再清本地缩略图。
 *
 * <p>顺序不能反 —— 先清本地再删服务端，一旦服务端失败，
 * 本地缩略图没了而底库里那条还在，表现为「列表里有、但永远没有头像」。</p>
 *
 * @param row 展示行
 */
async function onDelete(row: Row) {
  const label = row.name || row.id
  try {
    await ElMessageBox.confirm(
      `确定把「${label}」从人脸底库删除？删除后该条不再参与 1:N 识别，且无法恢复。`,
      '删除人脸',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  deleting.value = row.id
  try {
    const ok = await apiService.deleteFace(row.id)
    if (!ok) {
      ElMessage.error('删除失败：底库未确认删除')
      return
    }
    registry.remove(row.id)
    ElMessage.success(`已删除：${label}`)
    await refresh()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  } finally {
    deleting.value = ''
  }
}

onMounted(refresh)
</script>

<style scoped>
.fl-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fl-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.fl-head-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fl-head-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.fl-head-actions {
  display: flex;
  gap: 8px;
}

.fl-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.fl-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-bg-color);
}

.fl-stat-icon {
  font-size: 18px;
}

.fl-stat-icon.is-primary { color: var(--el-color-primary); }
.fl-stat-icon.is-success { color: var(--el-color-success); }
.fl-stat-icon.is-warning { color: var(--el-color-warning); }

.fl-stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.fl-stat-value {
  margin-left: auto;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fl-alert {
  margin: 0;
}

.fl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.fl-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-bg-color);
  transition: border-color var(--el-transition-duration);
}

.fl-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.fl-card-face {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: var(--el-border-radius-base, 6px);
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.fl-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fl-card-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
}

.fl-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fl-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fl-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.fl-tag {
  padding: 1px 6px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base, 6px);
}

.fl-card-id,
.fl-card-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fl-card-ops {
  flex: none;
  display: flex;
  align-items: flex-start;
}
</style>
