<template>
  <div>
    <sc-dialog
      v-model="env.visible"
      draggable
      :title="env.title"
      width="600px"
      :close-on-click-modal="false"
      class="role-dialog"
      @close="handleClose"
    >
      <template #header="{ titleId, titleClass }">
        <div class="dialog-header">
          <ScIcon class="header-icon" :size="22">
            <component :is="useRenderIcon('ri:shield-user-line')" />
          </ScIcon>
          <span :id="titleId" :class="titleClass">{{ env.title }}</span>
        </div>
      </template>
      <ScTabs v-model="env.tab" class="role-tabs">
        <ScTabPane name="role" :label="$t('buttons.role-perm')">
          <div class="tab-content">
            <ScSkeleton :loading="loading.menu" animated>
              <template #default>
                <el-tree-v2
                  ref="treeRef"
                  :default-checked-keys="currentRoleMenuIds"
                  show-checkbox
                  :data="treeData"
                  :props="treeProps"
                  :height="treeHeight"
                  :check-strictly="isLinkage"
                  :filter-method="filterMethod"
                  class="role-tree"
                >
                  <template #default="{ node }">
                    <span>{{ transformI18n(node.label) }}</span>
                  </template>
                </el-tree-v2>
              </template>
            </ScSkeleton>
          </div>
        </ScTabPane>
        <ScTabPane name="boardCard" :label="$t('buttons.board-card')">
          <div class="tab-content">
            <ScForm class="modern-form">
              <ScFormItem
                :label="$t('message.board-card-type')"
                prop="sysRoleBoardCard"
              >
                <ScSelect v-model="env.data.sysRoleBoardCard">
                  <ScOption
                    v-for="item in BoardCardList"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ScSelect>
              </ScFormItem>
            </ScForm>
          </div>
        </ScTabPane>
        <ScTabPane name="permission" :label="$t('buttons.permission')">
          <div class="tab-content">
            <ScForm label-width="120px" class="modern-form">
              <ScFormItem
                :label="$t('message.readable')"
                prop="sysRoleReadable"
              >
                <el-segmented
                  v-model="env.data.sysRoleReadable"
                  :options="readableOptions"
                />
              </ScFormItem>
              <ScFormItem
                :label="$t('message.writeable')"
                prop="sysRoleWriteable"
              >
                <el-segmented
                  v-model="env.data.sysRoleWriteable"
                  :options="writeableOptions"
                />
              </ScFormItem>
              <ScFormItem
                :label="$t('message.executable')"
                prop="sysRoleExecutable"
              >
                <el-segmented
                  v-model="env.data.sysRoleExecutable"
                  :options="executableOptions"
                />
              </ScFormItem>
            </ScForm>
          </div>
        </ScTabPane>
      </ScTabs>
      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="handleClose">{{ $t("buttons.cancel") }}</ScButton>
          <ScButton type="primary" @click="handleTabEvent">{{
            $t("buttons.confirm")
          }}</ScButton>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon";

import { computed, defineExpose, reactive, ref, shallowRef } from "vue";
import {
  fetchPageRole,
  fetchUpdateRole,
  fetchDeleteRole,
  fetchUpdateRoleMenu,
  fetchGetRoleMenu,
} from "@/api/manage/role";
import { fetchListMenu } from "@/api/manage/menu";
import { transformI18n } from "@repo/config";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { BoardCardList } from "./hook";
const { t } = useI18n();

const env = reactive({
  visible: false,
  title: "角色管理",
  data: {},
  tab: "role",
});

const loading = reactive({
  menu: false,
});
const treeHeight = ref(400);

const treeData = ref([]);
const currentRoleMenuIds = ref([]);

const curRow = ref(null);
const treeRef = ref();

const isLinkage = ref(false);
const filterMethod = (query, node) => {
  return transformI18n(node.title)?.includes(query);
};
const iconClass = computed(() => {
  return [
    "w-[22px]",
    "h-[22px]",
    "flex",
    "justify-center",
    "items-center",
    "outline-none",
    "rounded-[4px]",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-[#0000000f]",
    "dark:hover:bg-[#ffffff1f]",
    "dark:hover:text-[#ffffffd9]",
  ];
});
const treeProps = {
  value: "sysMenuId",
  label: "sysMenuTitle",
  children: "children",
};

// 权限选项
const readableOptions = computed(() => [
  {
    label: t("buttons.open"),
    value: 0x0000_0001,
  },
  { label: t("buttons.close"), value: 0x0000_0000 },
]);

const writeableOptions = computed(() => [
  {
    label: t("buttons.open"),
    value: 0x0000_0010,
  },
  { label: t("buttons.close"), value: 0x0000_0000 },
]);

const executableOptions = computed(() => [
  {
    label: t("buttons.open"),
    value: 0x0000_0100,
  },
  { label: t("buttons.close"), value: 0x0000_0000 },
]);

const handleUpdateRole = async () => {
  fetchUpdateRole(env.data)
    .then((res) => {
      message(t("message.updateSuccess"), { type: "success" });
      handleClose();
    })
    .catch((error) => {
      message(t("message.updateFailed"), { type: "error" });
    });
};
const handleSave = async () => {
  let checkedNodes = treeRef.value.getCheckedNodes();
  console.log(checkedNodes);
  const { data, code } = await fetchUpdateRoleMenu({
    roleId: curRow.value.sysRoleId,
    menuId: checkedNodes.map((item) => item.sysMenuId),
  });
  if (code == "00000") {
    message(t("message.updateSuccess"), { type: "success" });
    handleClose();
    return;
  }
};

const handleTabEvent = async () => {
  if (env.tab == "role") {
    handleSave();
  } else if (env.tab == "boardCard" || env.tab == "permission") {
    handleUpdateRole();
  }
};
const refreshMenu = async () => {
  loading.menu = true;
  const { data } = await fetchGetRoleMenu({ roleId: curRow.value.sysRoleId });
  currentRoleMenuIds.value = data;
  fetchListMenu({})
    .then((res) => {
      const { data, code } = res;
      treeData.value = data;
      return;
    })
    .catch((error) => {
      message(t("message.queryFailed"), { type: "error" });
    })
    .finally(() => {
      loading.menu = false;
    });
};
const handleClose = async () => {
  env.visible = false;
};
const handleOpen = async (item) => {
  env.visible = true;
  curRow.value = item;
  env.data = item;
  refreshMenu();
};

defineExpose({
  handleClose,
  handleOpen,
});
</script>
<style lang="scss" scoped>
.role-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.dialog-header {
  display: flex;
  gap: 10px;
  align-items: center;

  .header-icon {
    color: var(--el-color-primary);
  }
}

.role-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }

  :deep(.el-tabs__item) {
    font-weight: 500;
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
  }
}

.tab-content {
  min-height: 300px;
}

.role-tree {
  :deep(.el-tree-v2__node) {
    padding: 4px 0;
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

// 暗色主题适配
:root[data-theme="dark"] {
  .role-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.15) 0%,
        var(--el-bg-color-overlay) 100%
      );
    }
  }
}
</style>
