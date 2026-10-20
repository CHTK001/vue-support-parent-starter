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
      <!-- 数据表格：裸 el-table → ReTable。列由 props.columns 动态生成；每列原有一个
           <template #default>（转发页面自己的 cell-<prop> 插槽），ReTable 的列插槽在这里用
           动态插槽名 #col-<prop> 一一承接，内层再透传给外部插槽，调用方签名不变。
           engine="element" 保持原 el-table DOM；原表带 border → ReTable 默认（省略 settings）；
           分页由下方 el-pagination 自管 → :pagination="false"；toolbar 关闭。 -->
      <ReTable
        :data="tableData"
        :columns="tableColumns"
        :loading="loading"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        stripe
        style="width: 100%"
        :empty-text="`暂无${title}数据`"
      >
        <template
          v-for="col in contentColumns"
          :key="col.prop"
          #[`col-${col.prop}`]="scope"
        >
          <slot :name="`cell-${col.prop}`" :row="scope.row" :value="scope.row[col.prop]">
            {{ scope.row[col.prop] }}
          </slot>
        </template>
        <template #col-actions="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          <slot name="row-actions" :row="scope.row"></slot>
        </template>
      </ReTable>

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
          <ReNumberInput
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
import { message } from "@repo/core";
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh } from '@element-plus/icons-vue';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import ReDialog from '@repo/ui/re-dialog';
import ReNumberInput from '@/components/re/ReNumberInput.vue'

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

/**
 * 列配置：把父组件传入的 {@link Props.columns} 映射成 ReTable 列数组。
 *
 * <p>用 computed 而不是常量 —— columns 是响应式 props，父组件换列要跟着刷新；
 * 每列都声明 {@code slot}，模板里用动态 {@code #col-<prop>} 插槽承接原来的
 * {@code <template #default>}（内部再转发页面自己的 {@code cell-<prop>} 插槽），
 * 所以 formatter 与 el-table 时代一样只作为导出/兜底取值，不参与单元格渲染。</p>
 */
const tableColumns = computed<ReTableColumn[]>(() =>
  props.columns.map((col) => ({
    prop: col.prop,
    label: col.label,
    width: col.width,
    minWidth: col.minWidth || 120,
    formatter: col.formatter,
    slot: `col-${col.prop}`,
  }))
);

const contentColumns = computed(() => props.columns.filter((col) => col.prop !== 'actions'));

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
    message.error(`加载失败: ${e.message}`);
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
    message.success('删除成功');
    emit('deleted', row);
    loadData();
  } catch (e: any) {
    if (e !== 'cancel') {
      message.error(`删除失败: ${e.message}`);
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
      message.success('更新成功');
      emit('updated', formData);
    } else {
      await props.api.create(formData);
      message.success('创建成功');
      emit('created', formData);
    }
    dialogVisible.value = false;
    loadData();
  } catch (e: any) {
    if (e !== false) {
      message.error(`保存失败: ${e.message || '验证未通过'}`);
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
  /* 原 var(--mp-radius-lg)：--mp-* 来自并不存在的 modern-polish.css，是空令牌，
     var() 无回退值时整条声明失效，圆角直接掉回 0（表格四角变直角）。 */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}
:deep(.el-table th) {
  background-color: var(--el-fill-color-light) !important;
  font-weight: 600;
}
</style>
