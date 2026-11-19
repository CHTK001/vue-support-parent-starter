<template>
  <div class="dps">
    <header class="dps-head">
      <div>
        <h2 class="dps-title">人员管理</h2>
        <p class="dps-sub">人员台账与人脸录入；人员属于跨设备管理数据，不放在单台设备详情里。</p>
      </div>
      <el-button :loading="loading" @click="refresh">刷新</el-button>
    </header>

    <div class="dps-bar">
      <el-input
        v-model="keyword"
        placeholder="姓名 / 手机 / 人员ID"
        clearable
        style="width: 240px"
        @keyup.enter="query"
      />
      <el-button type="primary" @click="query">查询</el-button>
      <el-button @click="openPerson()">新增人员</el-button>
    </div>

    <!-- 服务端分页：loader 供数，不再一次性拉 500 条硬截断 -->
    <ReTable
      ref="tableRef"
      :columns="columns"
      :loader="loadPersons"
      :params="tableParams"
      engine="element"
      row-key="devicePersonId"
      :pagination="true"
      :page-size="20"
      :page-sizes="[10, 20, 50, 100, 200]"
      :toolbar="false"
    >
      <template #col-actions="{ row }">
        <el-button link type="primary" @click="openPerson(row)">编辑</el-button>
        <el-button link type="success" @click="pickFace(row)">人脸</el-button>
        <el-button link type="warning" @click="removeFace(row)">删人脸</el-button>
        <el-button link type="danger" @click="removePerson(row)">删除</el-button>
      </template>
    </ReTable>

    <el-dialog v-model="personDialog.visible" :title="personDialog.id ? '编辑人员' : '新增人员'" width="520px">
      <el-form :model="personDialog.form" label-width="90px">
        <el-form-item label="姓名" required>
          <el-input v-model="personDialog.form.devicePersonName" />
        </el-form-item>
        <el-form-item label="外部 ID">
          <el-input v-model="personDialog.form.devicePersonExternalId" />
        </el-form-item>
        <el-form-item label="手机">
          <el-input v-model="personDialog.form.devicePersonPhone" />
        </el-form-item>
        <el-form-item label="职称">
          <el-input v-model="personDialog.form.devicePersonTitle" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="personDialog.form.devicePersonEmail" />
        </el-form-item>
        <el-form-item label="厂商">
          <el-input v-model="personDialog.form.devicePersonVendor" />
        </el-form-item>
        <el-form-item label="组织 ID">
          <el-input v-model="personDialog.form.devicePersonOrgId" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="personDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePerson">保存</el-button>
      </template>
    </el-dialog>

    <input ref="faceInput" type="file" accept="image/*" style="display: none" @change="onFaceSelected" />
  </div>
</template>

<script setup lang="ts">
/**
 * 人员管理页：人员 CRUD 与人脸录入。
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed, reactive, ref } from 'vue'
import { message } from '@repo/core'
import { ElMessage } from 'element-plus'
import ReTable from '@repo/ui/re-table'
import type { RePageResult, ReTableColumn, ReTableLoadParams } from '@repo/ui/re-table'
import { deviceApi } from '../api/deviceApi'

const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const faceInput = ref<HTMLInputElement>()
let faceTarget: Record<string, any> | null = null

/** ReTable 暴露的方法里只用 reload */
const tableRef = ref<InstanceType<typeof ReTable> | null>(null)

/** 交给 ReTable 的查询参数（page/pageSize 由组件自己注入，这里不能带） */
const tableParams = computed<Record<string, unknown>>(() =>
  keyword.value ? { keyword: keyword.value } : {}
)

const personDialog = reactive<{ visible: boolean; id: string; form: Record<string, any> }>({
  visible: false,
  id: '',
  form: {}
})

/** 列定义：与人员表字段一一对应，操作列走插槽 */
const columns: ReTableColumn[] = [
  { prop: 'devicePersonName', label: '姓名', minWidth: 120 },
  { prop: 'devicePersonExternalId', label: '外部ID', width: 120 },
  { prop: 'devicePersonPhone', label: '手机', width: 140 },
  { prop: 'devicePersonTitle', label: '职称', width: 120 },
  { prop: 'devicePersonVendor', label: '厂商', width: 110 },
  { prop: 'devicePersonOrgId', label: '组织', minWidth: 140 },
  { prop: 'actions', label: '操作', slot: 'actions', width: 260, fixed: 'right' },
]

/** ReTable 远程 loader：page/pageSize 由组件给，其余条件来自查询框 */
async function loadPersons({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true
  try {
    // 后端用的是 page/size，把组件注入的 page/pageSize 重命名过去，避免同名冲突
    const filters = { ...params }
    delete filters.page
    delete filters.pageSize
    const res: any = await deviceApi.pagePersons({ ...filters, page, size: pageSize })
    const list = (res?.records ?? res?.data ?? []) as Record<string, any>[]
    return { total: (res?.total ?? list.length) as number, records: list as unknown as Array<Record<string, unknown>> }
  } catch (e: any) {
    ElMessage.error(e?.message ?? '加载人员失败')
    return { total: 0, records: [] }
  } finally {
    loading.value = false
  }
}

/** 查询 / 刷新：reload 重拉当前页（参数变化时 ReTable 自己会重置回第 1 页） */
function query(): void {
  void tableRef.value?.reload()
}
const refresh = query

function openPerson(row?: Record<string, any>) {
  personDialog.id = row?.devicePersonId ?? ''
  personDialog.form = row ? { ...row } : {}
  personDialog.visible = true
}

async function savePerson() {
  if (!personDialog.form.devicePersonName) {
    ElMessage.warning('请填写姓名')
    return
  }
  saving.value = true
  try {
    if (personDialog.id) {
      await deviceApi.updatePerson(personDialog.id, personDialog.form)
    } else {
      await deviceApi.addPerson(personDialog.form)
    }
    ElMessage.success('已保存')
    personDialog.visible = false
    await tableRef.value?.reload()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

function pickFace(row: Record<string, any>) {
  faceTarget = row
  faceInput.value?.click()
}

async function onFaceSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !faceTarget) return
  try {
    const base64 = await readBase64(file)
    await deviceApi.updatePersonFace(faceTarget.devicePersonId, base64)
    ElMessage.success('人脸已提交')
  } catch (e: any) {
    ElMessage.error(e?.message ?? '人脸提交失败')
  } finally {
    input.value = ''
    faceTarget = null
  }
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? '').split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error ?? new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
}

async function removeFace(row: Record<string, any>) {
  await message.confirm(`删除人员「${row.devicePersonName}」的人脸？`, '确认')
  try {
    await deviceApi.deletePersonFace(row.devicePersonId)
    ElMessage.success('人脸已删除')
  } catch (e: any) {
    ElMessage.error(e?.message ?? '删除人脸失败')
  }
}

async function removePerson(row: Record<string, any>) {
  await message.confirm(`删除人员「${row.devicePersonName}」？`, '确认')
  await deviceApi.deletePerson(row.devicePersonId)
  ElMessage.success('已删除')
  await tableRef.value?.reload()
}

// ReTable 挂载时自己会调 loader 取第一页，无需在 onMounted 再触一次
</script>

<style scoped>
.dps {
  padding: 16px;
}
.dps-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.dps-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.dps-sub {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.dps-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
</style>
