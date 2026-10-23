<template>
  <RePage data-page="app-keys" title="AppKey管理">
    <template #actions>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索AppKey名称"
        clearable
        @keyup.enter="loadData"
        @clear="loadData"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新增AppKey
      </el-button>
      <el-button @click="loadData"><el-icon><Refresh /></el-icon> 刷新</el-button>
    </template>

    <div class="panel-card">
    <!-- 表格统一 ReTable：默认引擎已是 vxe（不再显式写）。
         分页改用 ReTable 自带的 RePagination —— 此前是 :pagination="false" + 页面自写
         el-pagination；现在受控传 page/page-size/total，组件发 update:page 后本页去取数。
         原表没有 border → :settings="{ border: false }"；v-loading → :loading。 -->
    <ReTable
      :data="filteredData"
      :columns="appKeyColumns"
      :loading="loading"
      :pagination="true"
      :total="filteredData.length"
      :page="currentPage"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50]"
      :toolbar="false"
      :layout-table="{ minHeight: 0 }"
      :settings="{ border: false }"
      stripe
      class="flat-table"
      style="width: 100%"
      @update:page="onPageChange"
    >
      <template #col-appKey="{ row }">
        <span class="key-text">{{ row.appKey }}</span>
        <el-button link type="primary" @click="copyKey(row.appKey)">复制</el-button>
      </template>
      <template #col-status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'info'" >
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
      <!-- 操作列统一 ReButton square（纯图标 + tooltip），与知识库等页面一致 -->
      <template #col-actions="{ row }">
        <div class="row-actions">
          <ReButton layout="square" type="primary" :icon="Edit" tip="编辑" @click="openEditDialog(row)" />
          <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click="deleteItem(row)" />
        </div>
      </template>
    </ReTable>
    </div>

    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑AppKey' : '新增AppKey'" width="500px" append-to-body>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="AppKey" prop="appKey">
          <el-input v-model="form.appKey" placeholder="请输入AppKey" show-password />
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-select v-model="form.provider" placeholder="请选择提供商" style="width: 100%">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="Qwen" value="qwen" />
            <el-option label="Ollama" value="ollama" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
  </RePage>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { appKeyApi } from '@/services/javaApi';
import ReDialog from '@repo/ui/re-dialog';
import RePage from '@/components/re/RePage.vue';
import ReButton from '@repo/ui/re-button';

/**
 * 列配置：原模板里的 6 个 el-table-column 收敛为数组。
 * appKey / status 带 {@code <template #default>} → slot；「操作」原本无 prop → 合成 prop actions。
 */
const appKeyColumns: ReTableColumn[] = [
  { prop: 'appName', label: '应用名称', minWidth: 150 },
  { prop: 'appKey', label: 'AppKey', minWidth: 200, slot: 'appKey' },
  { prop: 'provider', label: '提供商', minWidth: 120 },
  { prop: 'status', label: '状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 160 },
  { prop: 'actions', label: '操作', width: 180, fixed: 'right', align: 'center', slot: 'actions' },
];

const loading = ref(false);
const dataList = ref<any[]>([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();

const defaultForm = () => ({ id: '', appName: '', appKey: '', provider: '', status: 1, remark: '' });
const form = ref(defaultForm());
const rules = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  appKey: [{ required: true, message: '请输入AppKey', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
};

/**
 * 过滤后的全量数据（**不再自己切片**）。
 *
 * <p>分页已交给 ReTable 内部完成：页面此前自己 slice + 配一页 el-pagination，
 * 两处都要维护页码/页长/总数，现已收口到组件内。</p>
 */
const filteredData = computed(() => {
  let result = dataList.value;
  if (searchKeyword.value) {
    result = result.filter((item) => item.appName?.includes(searchKeyword.value));
  }
  return result;
});

/** ReTable 分页页码变化（前端分页：组件自己切片，这里只需同步页码态） */
function onPageChange(page: number) {
  currentPage.value = page;
}

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await appKeyApi.list();
    dataList.value = res?.data || res?.records || res || [];
  } catch (e: any) {
    message.error('加载失败: ' + (e.message || ''));
    dataList.value = [];
  } finally {
    loading.value = false;
  }
};

const copyKey = (key: string) => {
  navigator.clipboard.writeText(key);
  message.success('已复制到剪贴板');
};

const openCreateDialog = () => {
  isEdit.value = false;
  form.value = defaultForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: any) => {
  isEdit.value = true;
  form.value = { ...defaultForm(), ...row };
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEdit.value) {
        await appKeyApi.update(form.value.id, form.value);
        message.success('更新成功');
      } else {
        await appKeyApi.create(form.value);
        message.success('创建成功');
      }
      dialogVisible.value = false;
      loadData();
    } catch (e: any) {
      message.error('保存失败: ' + (e.message || ''));
    } finally {
      submitting.value = false;
    }
  });
};

const deleteItem = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.appName}」吗？`, '删除确认', { type: 'warning' });
    await appKeyApi.delete(row.id);
    message.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') message.error('删除失败');
  }
};

onMounted(() => loadData());
</script>

<style scoped>
/* 页面外壳（留白 / 标题 / 操作区）已收口到 RePage：
   原来这里的 .app-keys-page 自带 padding + overflow，与 RePage 叠加会出现
   「双层留白 + 双滚动条」，所以整段删掉，只留内容区样式。 */

.panel-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 与用量页看板统一：8px 圆角（原来这里是 16px，一页一个圆角标准） */
  border-radius: var(--u-radius, 8px);
  padding: 16px 18px 14px;
  /* 表格容器是页面区块，不加投影 */
}
.flat-table { --el-table-border-color: var(--el-border-color-lighter); }
.flat-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}
.key-text { font-family: ui-monospace, monospace; font-size: 13px; color: var(--el-text-color-secondary); margin-right: 8px; }
/* 注：原 .pagination-wrapper（页面自写 el-pagination 的容器）已随分页收口到 ReTable 内部而移除。 */
</style>
