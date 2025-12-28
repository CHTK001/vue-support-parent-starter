<template>
  <div>
    <sc-dialog draggable :title="env.title" v-model="env.visible" width="600px" :close-on-click-modal="false" @close="handleClose">
      <el-tabs v-model="env.tab">
        <el-tab-pane name="role" :label="$t('buttons.role-perm')">
          <el-skeleton :loading="loading.menu" animated>
            <template #default>
              <el-tree-v2 ref="treeRef" :default-checked-keys="currentRoleMenuIds" show-checkbox :data="treeData" :props="treeProps" :height="treeHeight" :check-strictly="isLinkage" :filter-method="filterMethod">
                <template #default="{ node }">
                  <span>{{ transformI18n(node.label) }}</span>
                </template>
              </el-tree-v2>
            </template>
          </el-skeleton>
        </el-tab-pane>
        <el-tab-pane name="boardCard" :label="$t('buttons.board-card')">
          <el-form>
            <el-form-item :label="$t('message.board-card-type')" prop="sysRoleBoardCard">
              <el-select v-model="env.data.sysRoleBoardCard">
                <el-option v-for="item in BoardCardList" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane name="permission" :label="$t('buttons.permission')">
          <el-form label-width="120px">
            <el-form-item :label="$t('message.readable')" prop="sysRoleReadable">
              <el-segmented
                v-model="env.data.sysRoleReadable"
                :options="[
                  {
                    label: $t('buttons.open'),
                    value: 0x0000_0001,
                  },
                  { label: $t('buttons.close'), value: 0x0000_0000 },
                ]"
              />
            </el-form-item>
            <el-form-item :label="$t('message.writeable')" prop="sysRoleWriteable">
              <el-segmented
                v-model="env.data.sysRoleWriteable"
                :options="[
                  {
                    label: $t('buttons.open'),
                    value: 0x0000_0010,
                  },
                  {
                    label: $t('buttons.close'),
                    value: 0x0000_0000,
                  },
                ]"
              />
            </el-form-item>
            <el-form-item :label="$t('message.executable')" prop="sysRoleExecutable">
              <el-segmented
                v-model="env.data.sysRoleExecutable"
                :options="[
                  {
                    label: $t('buttons.open'),
                    value: 0x0000_0100,
                  },
                  {
                    label: $t('buttons.close'),
                    value: 0x0000_0000,
                  },
                ]"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template template #footer>
        <el-button @click="handleClose">{{ $t("buttons.cancel") }}</el-button>
        <el-button type="primary" @click="handleTabEvent">{{ $t("buttons.confirm") }}</el-button>
      </template>
    </sc-dialog>
  </div>
</template>
<script setup>
import { computed, defineExpose, reactive, ref, shallowRef } from "vue";
import { fetchPageRole, fetchUpdateRole, fetchDeleteRole, fetchUpdateRoleMenu, fetchGetRoleMenu } from "@/api/manage/role";
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
  return ["w-[22px]", "h-[22px]", "flex", "justify-center", "items-center", "outline-none", "rounded-[4px]", "cursor-pointer", "transition-colors", "hover:bg-[#0000000f]", "dark:hover:bg-[#ffffff1f]", "dark:hover:text-[#ffffffd9]"];
});
const treeProps = {
  value: "sysMenuId",
  label: "sysMenuTitle",
  children: "children",
};

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
