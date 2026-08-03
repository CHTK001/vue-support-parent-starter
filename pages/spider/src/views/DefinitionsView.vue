<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <el-input v-model="keyword" placeholder="搜索爬虫编码/名称" clearable style="width: 280px" @keyup.enter="reload" />
        <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
        <el-button :icon="Plus" @click="openCreate">新建</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <ReTable
        ref="tableRef"
        v-model:page="pageNo"
        v-model:page-size="pageSize"
        :loader="loadDefinitions"
        :columns="columns"
        :row-key="'spiderCode'"
        :pagination="true"
        :table-id="'spider-definitions'"
      >
        <template #col-spiderStatus="{ row }">
          <el-tag :type="row.spiderStatus === 1 ? 'success' : 'info'">
            {{ row.spiderStatus === 1 ? "启用" : "禁用" }}
          </el-tag>
        </template>
        <template #col-actions="{ row }">
          <el-button link type="primary" @click="openDesigner(row)">编排</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="success" @click="toggleStatus(row)" v-if="row.spiderStatus === 0">启用</el-button>
          <el-button link type="warning" @click="toggleStatus(row)" v-else>禁用</el-button>
          <el-popconfirm :title="`确认删除 ${row.spiderCode} 吗？`" @confirm="deleteRow(row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </ReTable>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.spiderId ? '编辑爬虫定义' : '新建爬虫定义'" width="640">
      <el-form :model="form" label-width="100">
        <el-form-item label="编码" required>
          <el-input v-model="form.spiderCode" :disabled="!!form.spiderId" placeholder="建议英文,业务唯一" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.spiderName" />
        </el-form-item>
        <el-form-item label="入口 URL" required>
          <el-input v-model="form.spiderEntryUrl" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="站点主机">
          <el-input v-model="form.spiderSiteHost" placeholder="example.com" />
        </el-form-item>
        <el-form-item label="最大深度">
          <el-input-number v-model="form.spiderMaxDepth" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="最大页数">
          <el-input-number v-model="form.spiderMaxPages" :min="1" :max="100000" />
        </el-form-item>
        <el-form-item label="深度采集">
          <el-switch v-model="form.spiderCollectDeepUrl" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.spiderRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import ReTable from '@repo/ui/ReTable';
import type { ReTableColumn, RePageResult } from '@repo/ui/ReTable';
import { spiderApi } from '../api/spiderApi';
import type { SpiderDefinition } from '../api/types';

const keyword = ref('');
const pageNo = ref(1);
const pageSize = ref(20);
const definitions = ref<SpiderDefinition[]>([]);
const tableRef = ref<{ reload: () => Promise<void> } | null>(null);

/** 主表格列定义 */
const columns: ReTableColumn[] = [
  { prop: 'spiderCode', label: '编码', minWidth: 160 },
  { prop: 'spiderName', label: '名称', minWidth: 160 },
  { prop: 'spiderEntryUrl', label: '入口 URL', minWidth: 280 },
  { prop: 'spiderMaxDepth', label: '最大深度', width: 100 },
  { prop: 'spiderMaxPages', label: '最大页数', width: 100 },
  { prop: 'spiderStatus', label: '状态', width: 100, slot: 'spiderStatus' },
  { prop: 'createTime', label: '创建时间', width: 180 },
  { prop: 'actions', label: '操作', width: 280, fixed: 'right', slot: 'actions' },
];

/** ReTable loader：适配 spiderApi.pageDefinitions 分页 */
const loadDefinitions = async (p: { page: number; pageSize: number; params: Record<string, unknown> }): Promise<RePageResult> => {
  const res = await spiderApi.pageDefinitions(p.page, p.pageSize, keyword.value || undefined);
  definitions.value = (res?.records ?? []) as SpiderDefinition[];
  return { total: res?.total ?? 0, records: definitions.value };
};

const reload = async () => {
  pageNo.value = 1;
  await tableRef.value?.reload?.();
};

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<SpiderDefinition>>({
  spiderCode: '',
  spiderName: '',
  spiderEntryUrl: '',
  spiderSiteHost: '',
  spiderMaxDepth: 1,
  spiderMaxPages: 50,
  spiderCollectDeepUrl: 1,
  spiderStatus: 1,
  spiderRemark: '',
});

const resetForm = () => {
  Object.assign(form, {
    spiderId: undefined,
    spiderCode: '',
    spiderName: '',
    spiderEntryUrl: '',
    spiderSiteHost: '',
    spiderMaxDepth: 1,
    spiderMaxPages: 50,
    spiderCollectDeepUrl: 1,
    spiderStatus: 1,
    spiderRemark: '',
  });
};

const openCreate = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (row: SpiderDefinition) => {
  Object.assign(form, row);
  dialogVisible.value = true;
};

const openDesigner = (row: SpiderDefinition) => {
  window.location.hash = `#/spider/designer/${row.spiderCode}`;
};

const save = async () => {
  if (!form.spiderCode || !form.spiderName || !form.spiderEntryUrl) {
    ElMessage.warning('请填写编码、名称与入口 URL');
    return;
  }
  saving.value = true;
  try {
    await spiderApi.saveDefinition(form as any);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    saving.value = false;
  }
};

const deleteRow = async (row: SpiderDefinition) => {
  try {
    await spiderApi.deleteDefinition(row.spiderCode);
    ElMessage.success('已删除');
    reload();
  } catch (e) {
    ElMessage.error('删除失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const toggleStatus = async (row: SpiderDefinition) => {
  const next = row.spiderStatus === 1 ? 0 : 1;
  try {
    await spiderApi.toggleStatus(row.spiderCode, next);
    ElMessage.success('已' + (next === 1 ? '启用' : '禁用'));
    reload();
  } catch (e) {
    ElMessage.error('操作失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};
</script>

<style scoped>
.page-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.toolbar :deep(.el-card__body) {
  padding: 12px 16px;
}
</style>