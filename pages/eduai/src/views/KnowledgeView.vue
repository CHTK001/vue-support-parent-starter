<template>
  <div class="page-container">
    <el-row :gutter="12">
      <el-col :span="10">
        <el-card shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center gap-3">
              <span class="font-semibold">知识点树</span>
              <el-input v-model="filter.subject" placeholder="学科" clearable style="width: 120px" />
              <el-input v-model="filter.grade" placeholder="年级" clearable style="width: 120px" />
              <el-button :icon="Search" @click="reload">查询</el-button>
              <el-button type="primary" :icon="Plus" @click="openCreate(undefined)">新增</el-button>
            </div>
          </template>
          <el-tree
            v-if="tree.length"
            :data="tree"
            node-key="knowledgePointId"
            default-expand-all
            :expand-on-click-node="false"
            class="kp-tree"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span class="flex-1">{{ data.knowledgePointName }}</span>
                <el-button link type="primary" size="small" @click="openCreate(data.knowledgePointId)">新增子项</el-button>
                <el-button link type="warning" size="small" @click="openEdit(data)">编辑</el-button>
                <el-popconfirm :title="`确认删除 ${data.knowledgePointName}?`" @confirm="remove(data)">
                  <template #reference>
                    <el-button link type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-tree>
          <el-empty v-else description="暂无知识点" />
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card shadow="never" class="h-full">
          <template #header>
            <div class="flex items-center gap-3">
              <span class="font-semibold">知识库文档</span>
              <el-button type="primary" :icon="Upload" @click="openUpload">上传文档</el-button>
              <el-input v-model="docSearch" placeholder="按名称检索" clearable style="width: 200px" />
              <el-button :icon="Search" @click="reloadDocs">搜索</el-button>
            </div>
          </template>
          <el-table v-loading="loadingDocs" :data="docs" border stripe>
            <el-table-column prop="knowledgeDocId" label="ID" width="80" />
            <el-table-column prop="knowledgeDocName" label="名称" min-width="200" />
            <el-table-column prop="knowledgeDocType" label="类型" width="100" />
            <el-table-column prop="knowledgeDocSubject" label="学科" width="100" />
            <el-table-column prop="knowledgeDocStatus" label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.knowledgeDocStatus === 1 ? 'success' : row.knowledgeDocStatus === 2 ? 'danger' : 'warning'">
                  {{ docStatusLabel(row.knowledgeDocStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="knowledgeDocFileSize" label="大小(B)" width="120" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-popconfirm :title="`确认删除 ${row.knowledgeDocName}?`" @confirm="removeDoc(row)">
                  <template #reference>
                    <el-button link type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 知识点编辑对话框 -->
    <el-dialog v-model="kpDialogVisible" :title="kpForm.knowledgePointId ? '编辑知识点' : '新增知识点'" width="560">
      <el-form :model="kpForm" label-width="100">
        <el-form-item label="名称" required>
          <el-input v-model="kpForm.knowledgePointName" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="kpForm.knowledgePointCode" />
        </el-form-item>
        <el-form-item label="父节点">
          <el-input-number v-model="kpForm.knowledgePointParentId" :min="0" placeholder="0 表示根" />
        </el-form-item>
        <el-form-item label="学科">
          <el-input v-model="kpForm.knowledgePointSubject" />
        </el-form-item>
        <el-form-item label="学段">
          <el-select v-model="kpForm.knowledgePointGradeLevel" style="width: 100%" clearable>
            <el-option label="小学" value="PRIMARY" />
            <el-option label="初中" value="JUNIOR" />
            <el-option label="高中" value="SENIOR" />
            <el-option label="大学" value="UNIVERSITY" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
          <el-input v-model="kpForm.knowledgePointGrade" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="kpForm.knowledgePointDescription" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="kpForm.knowledgePointSortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="kpDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="kpSaving" @click="saveKp">保存</el-button>
      </template>
    </el-dialog>

    <!-- 上传文档对话框 -->
    <el-dialog v-model="uploadVisible" title="上传文档（占位）" width="560">
      <el-form label-width="100">
        <el-form-item label="名称"><el-input v-model="uploadName" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="uploadType" style="width: 100%">
            <el-option label="PDF" value="PDF" />
            <el-option label="WORD" value="WORD" />
            <el-option label="TXT" value="TXT" />
            <el-option label="MARKDOWN" value="MARKDOWN" />
          </el-select>
        </el-form-item>
        <el-form-item label="学科"><el-input v-model="uploadSubject" /></el-form-item>
        <el-form-item label="路径"><el-input v-model="uploadPath" placeholder="OSS / 本地路径" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search, Upload } from '@element-plus/icons-vue';
import { eduaiApi } from '../api/eduaiApi';
import type { KnowledgePoint } from '../api/types';

const filter = reactive({ subject: '', grade: '' });
const tree = ref<KnowledgePoint[]>([]);
const kpDialogVisible = ref(false);
const kpSaving = ref(false);
const kpForm = reactive<Partial<KnowledgePoint>>({});

const docs = ref<any[]>([]);
const loadingDocs = ref(false);
const docSearch = ref('');

const uploadVisible = ref(false);
const uploadName = ref('');
const uploadType = ref('PDF');
const uploadSubject = ref('');
const uploadPath = ref('');

const reload = async () => {
  try {
    const res: any = await eduaiApi.treeKnowledge(filter);
    tree.value = Array.isArray(res) ? res : [];
  } catch (e) {
    ElMessage.error('加载知识点失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const openCreate = (parentId?: number) => {
  Object.assign(kpForm, {
    knowledgePointId: undefined,
    knowledgePointName: '',
    knowledgePointCode: '',
    knowledgePointParentId: parentId ?? 0,
    knowledgePointSubject: filter.subject || '',
    knowledgePointGradeLevel: '',
    knowledgePointGrade: filter.grade || '',
    knowledgePointDescription: '',
    knowledgePointSortOrder: 0,
    knowledgePointStatus: 1,
  });
  kpDialogVisible.value = true;
};

const openEdit = (row: KnowledgePoint) => {
  Object.assign(kpForm, row);
  kpDialogVisible.value = true;
};

const saveKp = async () => {
  if (!kpForm.knowledgePointName) {
    ElMessage.warning('请填写名称');
    return;
  }
  kpSaving.value = true;
  try {
    await eduaiApi.saveKnowledgePoint(kpForm);
    ElMessage.success('已保存');
    kpDialogVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    kpSaving.value = false;
  }
};

const remove = async (row: KnowledgePoint) => {
  try {
    await eduaiApi.deleteKnowledgePoint(row.knowledgePointId as number);
    ElMessage.success('已删除');
    reload();
  } catch (e) {
    ElMessage.error('删除失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const reloadDocs = async () => {
  loadingDocs.value = true;
  try {
    const res: any = await eduaiApi.pageExams({ pageNum: 1, pageSize: 100 });
    docs.value = (res?.records as any[]) || [];
  } catch {
    docs.value = [];
  } finally {
    loadingDocs.value = false;
  }
};

const openUpload = () => {
  uploadName.value = '';
  uploadType.value = 'PDF';
  uploadSubject.value = '';
  uploadPath.value = '';
  uploadVisible.value = true;
};

const confirmUpload = async () => {
  if (!uploadName.value) {
    ElMessage.warning('请填写名称');
    return;
  }
  ElMessage.success('已上传（占位）');
  uploadVisible.value = false;
};

const removeDoc = async (row: any) => {
  ElMessage.success('已删除');
};

const docStatusLabel = (n?: number) =>
  ({ 1: '已索引', 2: '失败', 0: '处理中' } as Record<number, string>)[n ?? 0] || '-';

onMounted(() => {
  reload();
});
</script>

<style scoped>
.page-container { padding: 16px; height: 100%; }
.h-full { height: 100%; }
.kp-tree { padding: 6px; }
.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
</style>