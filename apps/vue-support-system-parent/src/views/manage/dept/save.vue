<script setup lang="ts">
import { reactive, ref } from "vue";
import { fetchSaveDept, fetchUpdateDept } from "@/api/manage/dept";
import { message } from "@repo/utils";
import { IconSelect, IconifyIconOnline } from "@repo/components/ReIcon";
import { transformI18n } from "@repo/config";

// Emits
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// Refs
const dialogFormRef = ref();

// 状态
const visible = ref(false);
const loading = ref(false);
const title = ref('');
const mode = ref<'save' | 'edit'>('save');
const treeData = ref<any[]>([]);
const checked = ref<any[]>([]);

// 表单数据
const form = reactive({
  sysDeptId: '',
  sysDeptName: '',
  sysDeptPid: '',
  sysDeptTreeId: '',
  sysDeptIcon: '',
  sysDeptCode: '',
  sysDeptPrincipal: '',
  sysDeptContact: '',
  sysDeptSort: 0,
  sysDeptStatus: 0,
  sysDeptRemark: ''
});

// 验证规则
const rules = {
  sysDeptName: [
    { required: true, message: '请输入机构名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  sysDeptCode: [
    { required: true, message: '请输入机构编码', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  sysDeptStatus: [{ required: true, message: '请选择是否禁用', trigger: 'blur' }]
};

// 级联选择器配置
const defaultProps = {
  value: 'sysDeptId',
  label: 'sysDeptName',
  children: 'children',
  emitPath: false,
  checkStrictly: true
};

// i18n
const transformI18nValue = (value: string) => transformI18n(value);

// 关闭对话框
const close = () => {
  visible.value = false;
  loading.value = false;
  // 重置表单
  Object.assign(form, {
    sysDeptId: '',
    sysDeptName: '',
    sysDeptPid: '',
    sysDeptTreeId: '',
    sysDeptIcon: '',
    sysDeptCode: '',
    sysDeptPrincipal: '',
    sysDeptContact: '',
    sysDeptSort: 0,
    sysDeptStatus: 0,
    sysDeptRemark: ''
  });
};

// 设置数据
const setData = (data: any) => {
  Object.assign(form, data);
  if (data.sysDeptPid) {
    checked.value = [data.sysDeptPid];
  }
  return { setTableData, open };
};

// 设置树数据
const setTableData = (data: any[]) => {
  treeData.value = data || [];
  return { setData, open };
};

// 打开对话框
const open = (m: 'save' | 'edit' = 'save') => {
  visible.value = true;
  mode.value = m;
  title.value = m === 'save' ? '新增' : '编辑';
  if (m === 'save') {
    form.sysDeptSort = 0;
  }
};

// 提交表单
const submit = () => {
  dialogFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        let res: any = {};
        if (mode.value === 'save') {
          res = await fetchSaveDept(form);
        } else {
          res = await fetchUpdateDept(form);
        }

        if (res.code === '00000') {
          emit('success');
          visible.value = false;
        } else {
          message(res.msg, { type: 'error' });
        }
      } catch (error) {
        console.error('保存失败', error);
      } finally {
        loading.value = false;
      }
    }
  });
};

// 暴露给父组件
defineExpose({
  setData,
  setTableData,
  open
});
</script>
<template>
  <div>
    <sc-dialog 
      v-model="visible" 
      :close-on-click-modal="false" 
      :close-on-press-escape="false" 
      :destroy-on-close="true" 
      draggable 
      width="700px"
      class="modern-dialog"
      @close="close"
    >
      <template #header>
        <div class="dialog-header">
          <IconifyIconOnline :icon="mode === 'save' ? 'ri:add-circle-line' : 'ri:edit-line'" class="header-icon" />
          <span>{{ title }}部门</span>
        </div>
      </template>
      <el-form ref="dialogFormRef" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px" class="modern-form dept-form">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="父级机构" prop="sysDeptPid">
              <el-cascader v-model="form.sysDeptPid" class="w-full" :options="treeData" :props="defaultProps" clearable filterable placeholder="请选择上级部门">
                <template #default="{ node, data }">
                  <div class="cascader-item">
                    <IconifyIconOnline :icon="data.sysDeptIcon || 'ri:building-line'" class="cascader-icon" />
                    <span v-if="data.sysDeptI18n">{{ transformI18nValue(data.sysDeptI18n) }}</span>
                    <span v-else>{{ data.sysDeptName }}</span>
                    <span v-if="!node.isLeaf" class="cascader-count">({{ data.children.length }})</span>
                  </div>
                </template>
              </el-cascader>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机构名称" prop="sysDeptName">
              <el-input v-model="form.sysDeptName" placeholder="请输入机构名称" :maxlength="20" show-word-limit>
                <template #prefix>
                  <IconifyIconOnline icon="ri:building-line" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="机构编码" prop="sysDeptCode">
              <el-input v-model="form.sysDeptCode" placeholder="请输入机构编码" :maxlength="20" show-word-limit>
                <template #prefix>
                  <IconifyIconOnline icon="ri:barcode-line" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="机构图标" prop="sysDeptIcon">
              <IconSelect v-model="form.sysDeptIcon" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="负责人" prop="sysDeptPrincipal">
              <el-input v-model="form.sysDeptPrincipal" placeholder="请输入负责人" :maxlength="20" show-word-limit>
                <template #prefix>
                  <IconifyIconOnline icon="ri:user-line" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="联系方式" prop="sysDeptContact">
              <el-input v-model="form.sysDeptContact" placeholder="请输入联系方式" :maxlength="20" show-word-limit>
                <template #prefix>
                  <IconifyIconOnline icon="ri:phone-line" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="排序" prop="sysDeptSort">
              <el-input-number v-model="form.sysDeptSort" placeholder="排序" :min="0" :max="9999" class="w-full" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="状态" prop="sysDeptStatus">
              <el-segmented
                v-model="form.sysDeptStatus"
                :options="[
                  { label: '启用', value: 0 },
                  { label: '禁用', value: 1 },
                ]"
                class="status-segmented"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="sysDeptRemark">
              <el-input 
                v-model="form.sysDeptRemark" 
                placeholder="请输入备注信息" 
                :maxlength="240" 
                show-word-limit 
                type="textarea"
                :rows="3"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">
            <IconifyIconOnline icon="ep:close" class="mr-1" />
            取消
          </el-button>
          <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()">
            <IconifyIconOnline icon="ep:check" class="mr-1" />
            保存
          </el-button>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<style lang="scss" scoped>
.modern-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;

  .header-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dept-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 8px;
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      border-radius: 8px;
    }
  }
}

.cascader-item {
  display: flex;
  align-items: center;
  gap: 6px;

  .cascader-icon {
    color: var(--el-color-primary);
  }

  .cascader-count {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.status-segmented {
  :deep(.el-segmented__item) {
    min-width: 80px;
  }
}
</style>
