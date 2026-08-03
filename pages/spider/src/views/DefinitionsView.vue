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
      <el-table v-loading="loading" :data="definitions" border stripe>
        <el-table-column prop="spiderCode" label="编码" min-width="160" />
        <el-table-column prop="spiderName" label="名称" min-width="160" />
        <el-table-column prop="spiderEntryUrl" label="入口 URL" min-width="280" show-overflow-tooltip />
        <el-table-column prop="spiderMaxDepth" label="最大深度" width="100" />
        <el-table-column prop="spiderMaxPages" label="最大页数" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.spiderStatus === 1 ? 'success' : 'info'">
              {{ row.spiderStatus === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
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
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="reload"
          @size-change="reload"
        />
      </div>
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
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { spiderApi } from '../api/spiderApi';
import type { SpiderDefinition } from '../api/types';

const keyword = ref('');
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const definitions = ref<SpiderDefinition[]>([]);

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

const reload = async () => {
  loading.value = true;
  try {
    const res = await spiderApi.pageDefinitions(pageNo.value, pageSize.value, keyword.value || undefined);
    definitions.value = (res?.records ?? []) as SpiderDefinition[];
    total.value = res?.total ?? 0;
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

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

onMounted(reload);
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