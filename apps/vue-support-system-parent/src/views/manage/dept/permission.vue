<script setup lang="ts">
import { fetchUpdateDept } from "@/api/manage/dept";
import { transformI18n } from "@repo/config";
import { message } from "@repo/utils";
import type { FormRules } from "element-plus";
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { PermissionList } from "./hook";

type DeptPermissionForm = {
  sysDeptId?: string | number;
  sysDeptName?: string;
  sysDeptDataPermission: number | null;
  sysDeptDataPermissionDeptId?: string;
  sysDeptDataPermissionDeptIds: Array<string | number>;
  [key: string]: unknown;
};

const { t } = useI18n();

const env = reactive({
  visible: false,
  loading: false,
  title: "权限",
  deptList: [] as any[],
  defaultProps: {
    value: "sysDeptId",
    label: "sysDeptName",
    children: "children",
    emitPath: false,
    multiple: true,
    checkStrictly: true
  },
  form: {
    sysDeptDataPermission: null,
    sysDeptDataPermissionDeptId: "",
    sysDeptDataPermissionDeptIds: []
  } as DeptPermissionForm
});

const rules = reactive<FormRules<DeptPermissionForm>>({
  sysDeptDataPermission: [
    {
      required: true,
      message: "请选择数据权限",
      trigger: "change"
    }
  ]
});

const transformI18nValue = (value: string) => transformI18n(value);

const resetForm = () => {
  env.form = {
    sysDeptDataPermission: null,
    sysDeptDataPermissionDeptId: "",
    sysDeptDataPermissionDeptIds: []
  };
};

const normalizeDeptIds = (value?: string) => {
  if (!value) return [];

  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const numericValue = Number(item);
      return Number.isNaN(numericValue) ? item : numericValue;
    });
};

watch(
  () => env.form.sysDeptDataPermission,
  value => {
    if (value === 5) {
      rules.sysDeptDataPermissionDeptIds = [
        {
          required: true,
          message: "请选择数据权限部门",
          trigger: "change"
        }
      ];
      return;
    }

    delete rules.sysDeptDataPermissionDeptIds;
    env.form.sysDeptDataPermissionDeptIds = [];
    env.form.sysDeptDataPermissionDeptId = "";
  }
);

const handleOpen = async (row: Record<string, unknown>) => {
  env.visible = true;
  env.loading = false;
  env.form = {
    ...row,
    sysDeptDataPermission: (row.sysDeptDataPermission as number | null) ?? null,
    sysDeptDataPermissionDeptId: (row.sysDeptDataPermissionDeptId as string) || "",
    sysDeptDataPermissionDeptIds: normalizeDeptIds(row.sysDeptDataPermissionDeptId as string | undefined)
  };
};

const handleClose = () => {
  env.visible = false;
  env.loading = false;
  resetForm();
};

const handleUpdate = async () => {
  env.loading = true;
  env.form.sysDeptDataPermissionDeptId =
    env.form.sysDeptDataPermission === 5
      ? env.form.sysDeptDataPermissionDeptIds.join(",")
      : "";

  try {
    await fetchUpdateDept(env.form);
    message(t("message.updateSuccess"), { type: "success" });
    handleClose();
  } finally {
    env.loading = false;
  }
};

const setDeptList = (data: any[]) => {
  env.deptList = Array.isArray(data) ? data : [];
};

defineExpose({
  setDeptList,
  handleOpen,
  handleClose
});
</script>

<template>
  <div>
    <sc-dialog
      v-model="env.visible"
      :title="env.title"
      width="600px"
      draggable
      :close-on-click-modal="false"
      class="modern-dialog"
      @close="handleClose"
    >
      <template #header>
        <div class="dialog-header">
          <IconifyIconOnline icon="ri:shield-user-line" class="header-icon" />
          <span>{{ env.title }}</span>
        </div>
      </template>
      <ScForm :model="env.form" :rules="rules">
        <ScFormItem label="机构名称" prop="sysDeptName">
          <el-text>{{ env.form.sysDeptName || "-" }}</el-text>
        </ScFormItem>
        <ScFormItem label="数据权限" prop="sysDeptDataPermission">
          <ScSelect
            v-model="env.form.sysDeptDataPermission"
            placeholder="请选择数据权限"
            clearable
          >
            <ScOption
              v-for="item in PermissionList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ScSelect>
        </ScFormItem>
        <ScFormItem
          v-if="env.form.sysDeptDataPermission === 5"
          label="选择部门"
          prop="sysDeptDataPermissionDeptIds"
        >
          <ScCascader
            v-model="env.form.sysDeptDataPermissionDeptIds"
            class="w-full"
            :options="env.deptList"
            :props="env.defaultProps"
            clearable
            filterable
            placeholder="请选择数据权限部门"
          >
            <template #default="{ node, data }">
              <div>
                <span v-if="data.sysDeptI18n">
                  {{ transformI18nValue(data.sysDeptI18n) }}
                </span>
                <span v-else>{{ data.sysDeptName }}</span>
                <span v-if="!node.isLeaf">({{ data.children?.length || 0 }})</span>
              </div>
            </template>
          </ScCascader>
        </ScFormItem>
      </ScForm>
      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="handleClose">
            <IconifyIconOnline icon="ep:close" class="mr-1" />
            {{ t("buttons.cancel") }}
          </ScButton>
          <ScButton type="primary" :loading="env.loading" @click="handleUpdate">
            <IconifyIconOnline icon="ep:check" class="mr-1" />
            {{ t("buttons.confirm") }}
          </ScButton>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<style lang="scss" scoped>
.modern-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
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
  gap: 8px;
  align-items: center;
  font-size: 16px;
  font-weight: 600;

  .header-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
