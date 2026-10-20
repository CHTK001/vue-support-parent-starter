<template>
  <div class="manufacturer-keys-page">
    <div class="page-header">
      <h2>厂商Key管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索厂商名称或编码"
          clearable
          style="width: 240px; margin-right: 12px"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button v-if="admin" type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 新增厂商Key
        </el-button>
        <el-button @click="loadData"><el-icon><Refresh /></el-icon> 刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="!admin"
      title="厂商 Key 管理仅对管理员开放"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <div v-if="admin" class="panel-card">
    <!-- 表格统一 ReTable（替换裸 el-table）：engine="element"；pagination/toolbar 关闭
         （分页由下方 el-pagination 自管）；原表没有 border → :settings="{ border: false }"；
         v-loading → :loading。 -->
    <ReTable
      :data="pagedData"
      :columns="manufacturerKeyColumns"
      :loading="loading"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :layout-table="{ minHeight: 0 }"
      :settings="{ border: false }"
      stripe
      class="flat-table"
      style="width: 100%"
    >
      <template #col-value="{ row }">
        <span class="key-text">{{ row.value || '-' }}</span>
      </template>
      <template #col-secret="{ row }">
        <span class="key-text">{{ row.secret || '-' }}</span>
      </template>
      <template #col-status="{ row }">
        <el-tag :type="statusTag(row.status)" >{{ statusText(row.status) }}</el-tag>
      </template>
      <template #col-actions="{ row }">
        <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
        <el-button

          :type="row.status === 1 ? 'warning' : 'success'"
          link
          @click="toggleItem(row)"
        >{{ row.status === 1 ? '停用' : '启用' }}</el-button>
        <el-button type="danger" link @click="deleteItem(row)">删除</el-button>
      </template>
    </ReTable>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="filteredData.length"
        layout="total, sizes, prev, pager, next"
      />
    </div>
    </div>

    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑厂商Key' : '新增厂商Key'" width="520px" append-to-body>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="厂商" prop="sysAiManufacturerCode">
          <el-select
            v-model="form.sysAiManufacturerCode"
            filterable
            placeholder="请选择厂商"
            style="width: 100%"
            @change="onManufacturerChange"
          >
            <el-option
              v-for="item in manufacturers"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商名称" prop="sysAiManufacturerName">
          <el-input v-model="form.sysAiManufacturerName" placeholder="请输入厂商名称" />
        </el-form-item>
        <el-form-item label="API Key" prop="value">
          <el-input
            v-model="form.value"
            :placeholder="isEdit ? '留空或保留脱敏值表示不修改' : '请输入API Key'"
          />
        </el-form-item>
        <el-form-item label="Secret" prop="secret">
          <el-input
            v-model="form.secret"
            :placeholder="isEdit ? '留空或保留脱敏值表示不修改' : '请输入 Secret（可选）'"
          />
        </el-form-item>
        <el-form-item label="权重">
          <ReNumberSelect v-model="form.weight" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import ReNumberSelect from '@/components/ui/ReNumberSelect.vue'
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh } from '@element-plus/icons-vue';
import { isAdmin, message } from '@repo/core';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { manufacturerApi, manufacturerKeyApi } from '@/services/javaApi';
import ReDialog from '@repo/ui/re-dialog';

/**
 * 列配置：原模板里的 9 个 el-table-column 收敛为数组。
 *
 * <p>value / secret / status 带 {@code <template #default>} → {@code slot}；「操作」原本无 prop
 * → 合成 prop {@code actions}。remark / createTime 原样只取值。</p>
 */
const manufacturerKeyColumns: ReTableColumn[] = [
  { prop: 'sysAiManufacturerName', label: '厂商名称', minWidth: 140 },
  { prop: 'sysAiManufacturerCode', label: '厂商编码', minWidth: 130 },
  { prop: 'value', label: 'API Key', minWidth: 180, slot: 'value' },
  { prop: 'secret', label: 'Secret', minWidth: 150, slot: 'secret' },
  { prop: 'weight', label: '权重', width: 80, align: 'center' },
  { prop: 'status', label: '状态', width: 90, align: 'center', slot: 'status' },
  { prop: 'remark', label: '备注', minWidth: 140, showOverflowTooltip: true },
  { prop: 'createTime', label: '创建时间', minWidth: 160 },
  { prop: 'actions', label: '操作', width: 210, fixed: 'right', align: 'center', slot: 'actions' },
];

/** 厂商 Key 出口全部 @Permission("admin")，非管理员不发请求、不显示写操作 */
const admin = ref(isAdmin());
const loading = ref(false);
const dataList = ref<any[]>([]);
const manufacturers = ref<any[]>([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();

const defaultForm = () => ({
  id: undefined as number | string | undefined,
  sysAiManufacturerCode: '',
  sysAiManufacturerName: '',
  value: '',
  secret: '',
  weight: 0,
  enabled: true,
  remark: '',
});
const form = ref(defaultForm());
const rules = {
  sysAiManufacturerCode: [{ required: true, message: '请选择厂商', trigger: 'change' }],
  sysAiManufacturerName: [{ required: true, message: '请输入厂商名称', trigger: 'blur' }],
};

const filteredData = computed(() => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) return dataList.value;
  return dataList.value.filter(
    (item) => item.sysAiManufacturerName?.includes(keyword) || item.sysAiManufacturerCode?.includes(keyword)
  );
});

watch(searchKeyword, () => {
  currentPage.value = 1;
});

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData.value.slice(start, start + pageSize.value);
});

const statusText = (status: number) => (status === 1 ? '启用' : status === -1 ? '禁用' : '停用');
const statusTag = (status: number) => (status === 1 ? 'success' : status === -1 ? 'danger' : 'info');

/** 后端 list 返回 {code,data,msg} 信封，解包成数组 */
const unwrapList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.records)) return res.data.records;
  return [];
};

const loadData = async () => {
  if (!admin.value) {
    dataList.value = [];
    return;
  }
  loading.value = true;
  try {
    const res: any = await manufacturerKeyApi.list();
    dataList.value = unwrapList(res);
  } catch (e: any) {
    message.error('加载失败: ' + (e?.msg || e?.message || ''));
    dataList.value = [];
  } finally {
    loading.value = false;
  }
};

const loadManufacturers = async () => {
  if (!admin.value) {
    manufacturers.value = [];
    return;
  }
  try {
    const res: any = await manufacturerApi.list();
    manufacturers.value = unwrapList(res);
  } catch {
    manufacturers.value = [];
  }
};

const onManufacturerChange = (code: string) => {
  const hit = manufacturers.value.find((item) => item.code === code);
  if (hit?.name) form.value.sysAiManufacturerName = hit.name;
};

const openCreateDialog = () => {
  isEdit.value = false;
  form.value = defaultForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: any) => {
  isEdit.value = true;
  form.value = {
    ...defaultForm(),
    id: row.id,
    sysAiManufacturerCode: row.sysAiManufacturerCode || '',
    sysAiManufacturerName: row.sysAiManufacturerName || '',
    value: row.value || '',
    secret: row.secret || '',
    weight: row.weight ?? 0,
    enabled: row.status === 1,
    remark: row.remark || '',
  };
  dialogVisible.value = true;
};

const toPayload = () => ({
  id: form.value.id,
  sysAiManufacturerCode: form.value.sysAiManufacturerCode,
  sysAiManufacturerName: form.value.sysAiManufacturerName,
  value: form.value.value,
  secret: form.value.secret,
  weight: form.value.weight,
  status: form.value.enabled ? 1 : 0,
  remark: form.value.remark,
});

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload = toPayload();
      if (isEdit.value) {
        await manufacturerKeyApi.update(payload);
        message.success('更新成功');
      } else {
        await manufacturerKeyApi.create(payload);
        message.success('创建成功');
      }
      dialogVisible.value = false;
      loadData();
    } catch (e: any) {
      message.error('保存失败: ' + (e?.msg || e?.message || ''));
    } finally {
      submitting.value = false;
    }
  });
};

const toggleItem = async (row: any) => {
  try {
    await manufacturerKeyApi.toggle(row.id, row.status !== 1);
    message.success(row.status === 1 ? '已停用' : '已启用');
    loadData();
  } catch (e: any) {
    message.error('操作失败: ' + (e?.msg || e?.message || ''));
  }
};

const deleteItem = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.sysAiManufacturerName || row.sysAiManufacturerCode}」的这条 Key 吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await manufacturerKeyApi.delete(row.id);
    message.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') message.error('删除失败');
  }
};

onMounted(() => {
  loadData();
  loadManufacturers();
});
</script>

<style scoped>
.manufacturer-keys-page { padding: 22px 24px; height: 100%; overflow: auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
.page-header h2 {
  position: relative; margin: 0; font-size: 21px; font-weight: 700;
  color: var(--el-text-color-primary); padding-left: 12px;
}
.page-header h2::before {
  content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 4px; height: 19px;
  /* 原值 4px，恰为 19px 高的半径即胶囊；用 full 令牌表达同一种形状 */
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
}
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.panel-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 18px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  padding: 16px 18px 14px;
  /* 表格容器是页面区块，不加投影 */
}
.flat-table { --el-table-border-color: var(--el-border-color-lighter); }
.flat-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}
.key-text { font-family: ui-monospace, monospace; font-size: 13px; color: var(--el-text-color-secondary); }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
