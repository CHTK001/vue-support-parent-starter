<template>
  <div class="h-full overflow-hidden flex flex-col bg-white dark:bg-[#1a1a1a]">
    <!-- 页面头部 -->
    <div class="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#2f2f2f]">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ title }}</h1>
          <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">{{ description }}</p>
        </div>
        <div class="flex items-center gap-2">
          <el-input
            v-model="searchKeyword"
            :placeholder="`搜索${title}...`"
            clearable
            class="w-64"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增{{ title }}
          </el-button>
          <el-button @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="flex-1 overflow-auto p-6">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :empty-text="`暂无${title}数据`"
      >
        <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth || 120"
          :formatter="col.formatter"
        >
          <template #default="scope">
            <slot :name="`cell-${col.prop}`" :row="scope.row" :value="scope.row[col.prop]">
              {{ scope.row[col.prop] }}
            </slot>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
            <slot name="row-actions" :row="scope.row"></slot>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item
          v-for="field in formFields"
          :key="field.prop"
          :label="field.label"
          :prop="field.prop"
        >
          <el-input
            v-if="field.type === 'input'"
            v-model="formData[field.prop]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :type="field.inputType || 'text'"
            show-password
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="formData[field.prop]"
            :min="field.min"
            :max="field.max"
            :step="field.step || 1"
            style="width: 100%"
          />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formData[field.prop]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-switch
            v-else-if="field.type === 'switch'"
            v-model="formData[field.prop]"
          />
          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="formData[field.prop]"
            type="textarea"
            :rows="field.rows || 3"
            :placeholder="field.placeholder || `请输入${field.label}`"
          />
        </el-form-item>
        <slot name="form-extra"></slot>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh } from '@element-plus/icons-vue';
import ReDialog from '@repo/ui/re-dialog';

interface Column {
  prop: string;
  label: string;
  width?: number;
  minWidth?: number;
  formatter?: (row: any) => string;
}

interface FormField {
  prop: string;
  label: string;
  type: 'input' | 'number' | 'select' | 'switch' | 'textarea';
  placeholder?: string;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  inputType?: string;
}

interface Props {
  title: string;
  description?: string;
  columns: Column[];
  formFields: FormField[];
  formRules?: Record<string, any>;
  api: {
    list: (params: any) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
  };
  idField?: string;
  nameField?: string;
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  formRules: () => ({}),
  idField: 'id',
  nameField: 'name',
});

const emit = defineEmits(['created', 'updated', 'deleted', 'row-action']);

const loading = ref(false);
const saving = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const searchKeyword = ref('');
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();
const formData = reactive<Record<string, any>>({});

const dialogTitle = computed(() => isEdit.value ? `编辑${props.title}` : `新增${props.title}`);

function resetForm() {
  props.formFields.forEach((f) => {
    if (f.type === 'switch') {
      formData[f.prop] = false;
    } else if (f.type === 'number') {
      formData[f.prop] = f.min ?? 0;
    } else {
      formData[f.prop] = '';
    }
  });
}

async function loadData() {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
    };
    const res: any = await props.api.list(params);
    const data = res?.data || res?.records || res?.list || res || [];
    tableData.value = Array.isArray(data) ? data : (data.records || data.list || []);
    total.value = res?.total || res?.count || tableData.value.length;
  } catch (e: any) {
    ElMessage.error(`加载失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  loadData();
}

function handleCreate() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isEdit.value = true;
  resetForm();
  Object.assign(formData, row);
  dialogVisible.value = true;
}

async function handleDelete(row: any) {
  const name = row[props.nameField] || row[props.idField];
  try {
    await ElMessageBox.confirm(`确定要删除「${name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await props.api.delete(row[props.idField]);
    ElMessage.success('删除成功');
    emit('deleted', row);
    loadData();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(`删除失败: ${e.message}`);
    }
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    saving.value = true;
    if (isEdit.value) {
      await props.api.update(formData[props.idField], formData);
      ElMessage.success('更新成功');
      emit('updated', formData);
    } else {
      await props.api.create(formData);
      ElMessage.success('创建成功');
      emit('created', formData);
    }
    dialogVisible.value = false;
    loadData();
  } catch (e: any) {
    if (e !== false) {
      ElMessage.error(`保存失败: ${e.message || '验证未通过'}`);
    }
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadData();
});

defineExpose({ loadData, formData });
</script>

<style scoped>
:deep(.el-table) {
  border-radius: var(--mp-radius-lg);
  overflow: hidden;
}
:deep(.el-table th) {
  background-color: var(--el-fill-color-light) !important;
  font-weight: 600;
}
</style>
