<script setup>
import { fetchUpdateDept } from "@/api/manage/dept";
import { message } from "@repo/utils";
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { PermissionList } from "./hook";
const { t } = useI18n();
const env = reactive({
  visible: false,
  title: "权限",
  defaultProps: {
    value: "sysDeptId",
    label: "sysDeptName",
    children: "children",
    emitPath: false,
    multiple: true,
    checkStrictly: true,
  },
  form: {
    sysDeptDataPermission: null,
  },
});

let rules = {};
const handleOpen = async (row) => {
  env.visible = true;
  env.form = row;
  env.form.sysDeptDataPermissionDeptIds = env.form.sysDeptDataPermissionDeptId
    ?.split(",")
    ?.map((it) => ~~it);
  rules = {
    sysDeptDataPermission: [
      {
        required: true,
        message: "请选择数据权限",
        trigger: "change",
      },
    ],
  };
};

watch(env.form.sysDeptDataPermission, (_val) => {
  if (_val === 5) {
    rules["sysDeptDataPermissionDeptIds"] = [
      {
        required: true,
        message: "请选择数据权限",
        trigger: "change",
      },
    ];
    return;
  }
  delete rules["sysDeptDataPermissionDeptIds"];
});
const handleClose = () => {
  env.visible = false;
  env.loading = false;
};

const handleUpdate = async () => {
  env.loading = true;
  env.form.sysDeptDataPermissionDeptId =
    env.form.sysDeptDataPermissionDeptIds?.join(",");
  fetchUpdateDept(env.form)
    .then((res) => {
      message(t("message.updateSuccess"), { type: "success" });
      handleClose();
    })
    .finally(() => {
      env.loading = false;
    });
};
const setDeptList = (data) => {
  env.deptList = data;
};

defineExpose({
  setDeptList,
  handleOpen,
  handleClose,
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
          <el-text> {{ env.form.sysDeptName }}</el-text>
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
          prop="sysDeptDataPermissionDeptId"
        >
          <ScCascader
            v-model="env.form.sysDeptDataPermissionDeptIds"
            class="w-full"
            :options="env.deptList"
            :props="env.defaultProps"
            clearable
            filterable
            placeholder="请选择上级菜单"
          >
            <template #default="{ node, data }">
              <div>
                <span v-if="data.sysDeptI18n">
                  {{ transformI18nValue(data.sysDeptI18n) }}
                </span>
                <span v-else>{{ data.sysDeptName }}</span>
                <span v-if="!node.isLeaf">({{ data.children.length }})</span>
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
