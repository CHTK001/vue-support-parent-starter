<template>
  <div class="reid-lib">
    <div class="reid-lib-head">
      <div>
        <h3 class="reid-lib-title">重识别库</h3>
        <p class="reid-lib-desc">
          每次观测一行记录，跨帧轨迹由这些记录按轨迹 ID 汇聚而来。删掉一行等于把那次观测从轨迹中移除。
        </p>
      </div>
      <div class="reid-lib-actions">
        <!--
          分组筛选：分组是第一层隔离（每组一套轨迹库），本面板只在当前分组内查看/删除。
          allow-create 与识别页一致：允许直接敲一个还没数据的分组名。
        -->
        <el-select
          v-model="group"
          class="reid-lib-group"
          filterable
          allow-create
          default-first-option
          placeholder="选择或输入分组"
          title="分组是第一层隔离：不同分组各有一套轨迹库"
          @change="load"
        >
          <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
        </el-select>
        <el-button :disabled="loading" @click="load">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button :disabled="loading || !items.length" type="danger" plain @click="clearAll">
          <el-icon><Delete /></el-icon>清空
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!items.length && !loading"
      type="info"
      show-icon
      :closable="false"
      title="重识别库为空"
      description="到「人脸重识别」页上传一帧监控画面，观测记录会自动落库。"
    />

    <el-table v-else v-loading="loading" :data="items" size="small" stripe empty-text="暂无观测记录">
      <el-table-column prop="trackId" label="轨迹 ID" width="150" />
      <el-table-column prop="group" label="分组" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.group || 'default' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="cameraId" label="摄像头" width="140" />
      <el-table-column prop="name" label="记录名" min-width="160" show-overflow-tooltip />
      <el-table-column prop="faceName" label="关联人脸" width="120">
        <template #default="{ row }">
          <span v-if="row.faceName">{{ row.faceName }}</span>
          <span v-else class="reid-lib-muted">未关联</span>
        </template>
      </el-table-column>
      <el-table-column label="经纬度" width="190">
        <template #default="{ row }">
          <span v-if="row.lat != null && row.lng != null">{{ row.lat }}, {{ row.lng }}</span>
          <span v-else class="reid-lib-muted">未填写</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="观测时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from '@repo/core'
import { Delete, Refresh } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { useLibraryGroups } from '@/composables/useLibraryGroups'

/**
 * 重识别库管理面板（设置中心「底库」分组）。
 *
 * <p>职责边界与「人脸底库」一致：<b>这里只管库，不负责观测</b>。
 * 观测与轨迹展示在外侧「人脸重识别」页；本面板负责查看已落库的观测记录、
 * 删除单条或清空。</p>
 *
 * <p>为什么观测要落库而不是只放内存：内存里的轨迹一重启就没了，
 * 而「这个人几小时前从哪个摄像头走过」属于需要留痕的事实。</p>
 */

/**
 * 观测记录。
 *
 * <p>刻意在本文件内声明、不复用 `reid.api` 的同名类型：本面板只读「库」这一侧
 * （谁在何时被哪个摄像头看到），api 那个类型还带着检索侧字段（similarity /
 * matchType / lastSeen 等），两者同名但不该互相牵制 —— 之前两处都声明，
 * TS 直接报「import 与本地声明冲突」，这里保留本地这份窄定义。</p>
 */
interface ReidLibraryItem {
  id: string
  trackId?: string | null
  /** 所属分组（历史数据缺失时按 default 展示） */
  group?: string | null
  cameraId?: string | null
  name?: string | null
  faceName?: string | null
  lat?: number | string | null
  lng?: number | string | null
  createTime?: string | null
}

/** 记录列表。 */
const items = ref<ReidLibraryItem[]>([])

/** 加载中。 */
const loading = ref(false)

/**
 * 当前分组。
 *
 * <p>与识别页同源：分组是第一层隔离，列表/删除/清空都只作用于当前分组 ——
 * 「清空」尤其不能越界，别把别的分组的观测一起抹掉。</p>
 */
const { group, groupOptions, loadGroups, rememberGroups } = useLibraryGroups('reid')

/** 加载列表。 */
async function load() {
  loading.value = true
  try {
    // 底部观测记录全部由底库接口供给：不用再拆信封
    items.value = await apiService.listReidLibrary({ group: group.value })
    // 记录里带回的分组名一并并进下拉：后端 groups 接口没列到的历史分组也不该缺席
    rememberGroups(items.value.map((it) => it.group))
  } catch (e) {
    message.error(`加载重识别库失败：${(e as Error)?.message ?? e}`)
    items.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 删除一条观测。
 *
 * <p>参数用 {@code any} 而不是 {@link ReidLibraryItem}：el-table 的 slot 传出的是
 * Element Plus 的 {@code DefaultRow}（本质 {@code Record<string, any>}），
 * 与业务接口类型不构成结构兼容，强行声明会报「不可赋值」。这里只取 {@code id}，
 * 用宽松类型即可，不必为了通过检查做无意义的结构体操。</p>
 *
 * @param row 表格行
 */
async function remove(row: any) {
  const id = row?.id
  if (!id) {
    message.warning('该记录缺少 ID，无法删除')
    return
  }
  try {
    await (apiService as any)._request(`/reid/library/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      params: { group: group.value },
    })
    message.success('已删除')
    await load()
  } catch (e) {
    message.error(`删除失败：${(e as Error)?.message ?? e}`)
  }
}

/** 清空当前分组的全部观测。 */
async function clearAll() {
  try {
    const res: any = await (apiService as any)._request('/reid/tracks', {
      method: 'DELETE',
      params: { group: group.value },
    })
    const data = res && typeof res === 'object' && 'data' in res ? res.data : res
    message.success(`已清空分组「${group.value}」的 ${data?.cleared ?? 0} 条记录`)
    await load()
  } catch (e) {
    message.error(`清空失败：${(e as Error)?.message ?? e}`)
  }
}

/**
 * 时间格式化。
 *
 * @param value 后端返回的 LocalDateTime 字符串
 * @returns 本地可读时间
 */
function formatTime(value?: string | null) {
  if (!value) return '-'
  // 后端 LocalDateTime.toString() 形如 2026-10-24T15:30:00，直接展示即可读
  return String(value).replace('T', ' ')
}

onMounted(async () => {
  // 先拉分组选项再拉列表：否则下拉里只有 default，用户看不到自己已有的分组
  await loadGroups()
  void load()
})
</script>

<style scoped>
.reid-lib {
  padding: 4px 2px;
}

.reid-lib-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.reid-lib-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.reid-lib-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 720px;
  line-height: 1.6;
}

.reid-lib-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.reid-lib-muted {
  color: var(--el-text-color-secondary);
}
</style>
