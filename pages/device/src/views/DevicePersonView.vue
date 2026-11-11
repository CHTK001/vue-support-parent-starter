<template>
  <div class="dps">
    <header class="dps-head">
      <div>
        <h2 class="dps-title">人员管理</h2>
        <p class="dps-sub">人员台账与人脸录入；人员属于跨设备管理数据，不放在单台设备详情里。</p>
      </div>
      <el-button :loading="loading" @click="loadPersons">刷新</el-button>
    </header>

    <div class="dps-bar">
      <el-input
        v-model="keyword"
        placeholder="姓名 / 手机 / 人员ID"
        clearable
        style="width: 240px"
        @keyup.enter="loadPersons"
      />
      <el-button type="primary" @click="loadPersons">查询</el-button>
      <el-button @click="openPerson()">新增人员</el-button>
    </div>

    <el-table v-loading="loading" :data="persons" border>
      <el-table-column prop="devicePersonName" label="姓名" min-width="120" />
      <el-table-column prop="devicePersonExternalId" label="外部ID" width="120" />
      <el-table-column prop="devicePersonPhone" label="手机" width="140" />
      <el-table-column prop="devicePersonTitle" label="职称" width="120" />
      <el-table-column prop="devicePersonVendor" label="厂商" width="110" />
      <el-table-column prop="devicePersonOrgId" label="组织" min-width="140" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openPerson(row)">编辑</el-button>
          <el-button link type="success" @click="pickFace(row)">人脸</el-button>
          <el-button link type="warning" @click="removeFace(row)">删人脸</el-button>
          <el-button link type="danger" @click="removePerson(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deviceApi } from '../api/deviceApi'

const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const persons = ref<Record<string, any>[]>([])
const faceInput = ref<HTMLInputElement>()
let faceTarget: Record<string, any> | null = null

const personDialog = reactive<{ visible: boolean; id: string; form: Record<string, any> }>({
  visible: false,
  id: '',
  form: {}
})

const rowsOf = (page: any): Record<string, any>[] => page?.records ?? page?.data ?? []

async function loadPersons() {
  loading.value = true
  try {
    persons.value = rowsOf(await deviceApi.pagePersons({ page: 1, size: 500, keyword: keyword.value }))
  } finally {
    loading.value = false
  }
}

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
    await loadPersons()
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
  await ElMessageBox.confirm(`删除人员「${row.devicePersonName}」的人脸？`, '确认', { type: 'warning' })
  try {
    await deviceApi.deletePersonFace(row.devicePersonId)
    ElMessage.success('人脸已删除')
  } catch (e: any) {
    ElMessage.error(e?.message ?? '删除人脸失败')
  }
}

async function removePerson(row: Record<string, any>) {
  await ElMessageBox.confirm(`删除人员「${row.devicePersonName}」？`, '确认', { type: 'warning' })
  await deviceApi.deletePerson(row.devicePersonId)
  ElMessage.success('已删除')
  await loadPersons()
}

onMounted(() => {
  void loadPersons()
})
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
