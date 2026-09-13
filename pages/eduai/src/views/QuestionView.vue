<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <el-input v-model="filter.subject" placeholder="学科" clearable style="width: 140px" @keyup.enter="reload" />
        <el-input v-model="filter.type" placeholder="题型" clearable style="width: 140px" />
        <el-input v-model="filter.gradeLevel" placeholder="学段" clearable style="width: 120px" />
        <el-input v-model="filter.grade" placeholder="年级" clearable style="width: 120px" />
        <el-input-number v-model="filter.difficulty" :min="1" :max="5" placeholder="难度" controls-position="right" />
        <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
        <el-button :icon="Plus" @click="openCreate">新增</el-button>
        <el-button :icon="Upload" @click="openImport">批量导入</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3 flex-1">
      <el-table v-loading="loading" :data="questions" border stripe>
        <el-table-column prop="questionId" label="ID" width="80" />
        <el-table-column prop="questionType" label="题型" width="120" />
        <el-table-column prop="questionSubject" label="学科" width="100" />
        <el-table-column prop="questionGradeLevel" label="学段" width="100" />
        <el-table-column prop="questionGrade" label="年级" width="80" />
        <el-table-column prop="questionDifficulty" label="难度" width="80" />
        <el-table-column prop="questionStem" label="题干" min-width="320" show-overflow-tooltip />
        <el-table-column prop="questionUseCount" label="使用" width="80" />
        <el-table-column label="审核" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="auditType(row.questionAuditStatus)">{{ auditLabel(row.questionAuditStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm :title="`确认删除题目 ${row.questionId} 吗？`" @confirm="remove(row)">
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

    <!-- 编辑/新增对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.questionId ? '编辑题目' : '新增题目'" width="720">
      <el-form :model="form" label-width="100">
        <el-form-item label="题型" required>
          <el-select v-model="form.questionType" style="width: 100%">
            <el-option label="单选题" value="SINGLE_CHOICE" />
            <el-option label="多选题" value="MULTIPLE_CHOICE" />
            <el-option label="判断题" value="JUDGE" />
            <el-option label="填空题" value="FILL" />
            <el-option label="简答题" value="SHORT_ANSWER" />
            <el-option label="作文" value="ESSAY" />
          </el-select>
        </el-form-item>
        <el-form-item label="学科" required>
          <el-input v-model="form.questionSubject" />
        </el-form-item>
        <el-form-item label="学段">
          <el-select v-model="form.questionGradeLevel" style="width: 100%">
            <el-option label="小学" value="PRIMARY" />
            <el-option label="初中" value="JUNIOR" />
            <el-option label="高中" value="SENIOR" />
            <el-option label="大学" value="UNIVERSITY" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" required>
          <el-input v-model="form.questionGrade" />
        </el-form-item>
        <el-form-item label="难度">
          <el-rate v-model="form.questionDifficulty" :max="5" />
        </el-form-item>
        <el-form-item label="题干" required>
          <el-input v-model="form.questionStem" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="选项 JSON">
          <el-input v-model="form.questionOptions" type="textarea" :rows="2" placeholder='["A....","B...."]' />
        </el-form-item>
        <el-form-item label="标准答案" required>
          <el-input v-model="form.questionAnswer" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="解析">
          <el-input v-model="form.questionAnalysis" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="知识点ID">
          <el-input v-model="form.questionKnowledgePointIds" placeholder="逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入题目（JSON 数组）" width="720">
      <el-input v-model="importJson" type="textarea" :rows="12" placeholder='[{"questionType":"JUDGE","questionSubject":"数学",...}]' />
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="doImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search, Upload } from '@element-plus/icons-vue';
import { eduaiApi } from '../api/eduaiApi';
import type { Question } from '../api/types';

const filter = reactive({ subject: '', type: '', gradeLevel: '', grade: '', difficulty: undefined as number | undefined });
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const questions = ref<Question[]>([]);

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<Question>>({});

const importDialogVisible = ref(false);
const importJson = ref('');
const importing = ref(false);

const reload = async () => {
  loading.value = true;
  try {
    const res = await eduaiApi.pageQuestions({
      pageNum: pageNo.value,
      pageSize: pageSize.value,
      subject: filter.subject || undefined,
      type: filter.type || undefined,
      gradeLevel: filter.gradeLevel || undefined,
      grade: filter.grade || undefined,
      difficulty: filter.difficulty,
    });
    questions.value = (res?.data ?? []) as Question[];
    total.value = res?.total ?? 0;
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  Object.assign(form, {
    questionId: undefined,
    questionType: 'SINGLE_CHOICE',
    questionSubject: '',
    questionGradeLevel: 'PRIMARY',
    questionGrade: '',
    questionDifficulty: 3,
    questionStem: '',
    questionOptions: '',
    questionAnswer: '',
    questionAnalysis: '',
    questionKnowledgePointIds: '',
  });
};

const openCreate = () => {
  reset();
  dialogVisible.value = true;
};
const openEdit = (row: Question) => {
  Object.assign(form, row);
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.questionType || !form.questionSubject || !form.questionStem || !form.questionAnswer) {
    ElMessage.warning('请填写题型/学科/题干/答案');
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.saveQuestion(form);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    saving.value = false;
  }
};

const remove = async (row: Question) => {
  try {
    await eduaiApi.deleteQuestion(row.questionId);
    ElMessage.success('已删除');
    reload();
  } catch (e) {
    ElMessage.error('删除失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const openImport = () => {
  importJson.value = '';
  importDialogVisible.value = true;
};

const doImport = async () => {
  if (!importJson.value.trim()) {
    ElMessage.warning('请粘贴 JSON');
    return;
  }
  try {
    const parsed = JSON.parse(importJson.value);
    if (!Array.isArray(parsed)) throw new Error('必须是 JSON 数组');
    importing.value = true;
    const count = await eduaiApi.importQuestions(parsed);
    ElMessage.success(`导入成功 ${count} 条`);
    importDialogVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('导入失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    importing.value = false;
  }
};

const auditType = (n?: number) =>
  ({ 1: 'success', 2: 'danger', 0: 'info' } as Record<number, string>)[n ?? 0] || 'info';
const auditLabel = (n?: number) =>
  ({ 1: '已通过', 2: '驳回', 0: '待审核' } as Record<number, string>)[n ?? 0] || '-';

onMounted(reload);
</script>

<style scoped>
.page-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
</style>