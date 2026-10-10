<template>
  <div class="asset-list">
    <el-card class="shadow-sm rounded-xl p-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-el-text">资产列表</h3>
          <el-button type="primary" @click="handleAdd">新增资产</el-button>
        </div>
      </template>

      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM；
           pagination/toolbar 关闭，不新增页码控件与工具栏按钮；
           style="width: 100%" 原样保留；原表未写 border → settings.border=false 抑制默认边框；
           原表无 height/maxHeight → layout-table.minHeight=0：抑制 ReTable 缺省开启的
           fill（表头固定内滚）与空态 440px min-height，保持「内容多高表多高 + 整页滚动」。 -->
      <ReTable
        :data="assets"
        :columns="assetColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
        style="width: 100%"
      >
        <template #col-monitorEnabled="{ row }">
          <el-tag :type="assetOf(row).monitorEnabled === 1 ? 'success' : 'danger'">
            {{ assetOf(row).monitorEnabled === 1 ? '运行中' : '已停用' }}
          </el-tag>
        </template>
        <template #col-actions="{ row }">
          <el-button text type="primary" @click="handleEdit(assetOf(row))">编辑</el-button>
          <el-button text type="danger" @click="handleDelete(assetOf(row).id)">删除</el-button>
        </template>
      </ReTable>
    </el-card>

    <ReDialog v-model="showDialog" :title="editId ? '编辑资产' : '新增资产'" width="520px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产名称">
              <el-input v-model="form.monitorName" placeholder="例如：prod-web-01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主机地址">
              <el-input v-model="form.monitorHost" placeholder="192.168.1.100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="端口">
              <el-input-number v-model="form.monitorPort" :min="1" :max="65535" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务类型">
              <el-select v-model="form.serviceType" style="width:100%">
                <el-option label="服务器" value="SERVER" />
                <el-option label="Redis" value="REDIS" />
                <el-option label="MySQL" value="MYSQL" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="form.serviceType === 'SERVER'">
          <el-col :span="12">
            <el-form-item label="系统类型">
              <el-select v-model="form.serverType" style="width:100%" @change="onServerTypeChange">
                <el-option label="Linux" value="LINUX" />
                <el-option label="Windows" value="WINDOWS" />
                <el-option label="macOS" value="MACOS" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="启用状态">
          <el-switch v-model="form.monitorEnabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMonitors, saveMonitor, delMonitor } from '../../api'


import ReDialog from "@repo/ui/re-dialog";
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'

interface Asset {
  id: number
  monitorName: string
  monitorHost: string
  monitorPort: number
  serviceType: string
  serverType: string
  monitorEnabled: number
}

/**
 * 列配置：原模板 7 个 el-table-column 收敛到数组。
 * 标题是静态文案（无 t()），普通常量即可。
 * 「状态」列原本就有 prop="monitorEnabled"，按规格以该 prop 作插槽名；
 * 「操作」列原本没有 prop，造合成 prop actions。
 */
const assetColumns: ReTableColumn[] = [
  { prop: 'monitorName', label: '资产名称', width: 150 },
  { prop: 'monitorHost', label: '主机地址', width: 150 },
  { prop: 'monitorPort', label: '端口', width: 80 },
  { prop: 'serviceType', label: '服务类型', width: 100 },
  { prop: 'serverType', label: '系统类型', width: 100 },
  { prop: 'monitorEnabled', label: '状态', width: 80, slot: 'monitorEnabled' },
  { prop: 'actions', label: '操作', width: 150, slot: 'actions' },
]

/**
 * ReTable 列插槽的 row 是宽类型（字段为 unknown），直接传给
 * {@link handleEdit}（参数 Asset）或读 {@code row.id}（喂给 {@link handleDelete} 的 number 参数）、
 * {@code row.monitorEnabled === 1} 比较都不成立，会在模板里堆断言。
 * 这里统一收窄回 {@link Asset}，模板里不再散落断言。
 */
function assetOf(row: Record<string, unknown>): Asset {
  return row as unknown as Asset
}

const assets = ref<Asset[]>([])
const showDialog = ref(false)
const editId = ref<number | null>(null)
const form = ref<Partial<Asset>>({
  monitorPort: 22,
  serviceType: 'SERVER',
  serverType: 'LINUX',
  monitorEnabled: 1
})

const loadAssets = async () => {
  try {
    const res = await getMonitors()
    assets.value = res.filter((a: any) => a.serviceType === 'SERVER')
  } catch (e) {
    console.error('加载资产失败', e)
  }
}

const handleAdd = () => {
  editId.value = null
  form.value = { monitorPort: 22, serviceType: 'SERVER', serverType: 'LINUX', monitorEnabled: 1 }
  showDialog.value = true
}

const handleEdit = (row: Asset) => {
  editId.value = row.id
  form.value = { ...row }
  showDialog.value = true
}

const handleDelete = async (id: number) => {
  try {
    await delMonitor(id)
    await loadAssets()
  } catch (e) {
    console.error('删除失败', e)
  }
}

const handleSubmit = async () => {
  try {
    await saveMonitor(editId.value || 0, form.value)
    showDialog.value = false
    await loadAssets()
  } catch (e) {
    console.error('保存失败', e)
  }
}

const onServerTypeChange = (type: string) => {
  form.value.serverType = type
  if (type === 'LINUX' || type === 'MACOS') {
    form.value.monitorPort = 22
  } else if (type === 'WINDOWS') {
    form.value.monitorPort = 5985
  }
}

onMounted(loadAssets)
</script>

<style scoped>
.asset-list {
  padding: 20px;
}
</style>
