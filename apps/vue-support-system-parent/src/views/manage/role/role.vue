<template>
  <div>
    <el-dialog draggable :title="env.title" v-model="env.visible" width="400px" :close-on-click-modal="false">
      <el-skeleton :loading="loading.menu" animated>
        <template #default>
          <el-tree-v2 ref="treeRef" :default-checked-keys="currentRoleMenuIds" show-checkbox :data="treeData" :props="treeProps" :height="treeHeight" :check-strictly="isLinkage" :filter-method="filterMethod">
            <template #default="{ node }">
              <span>{{ transformI18n(node.label) }}</span>
            </template>
          </el-tree-v2>
        </template>
      </el-skeleton>
      <template #footer>
        <el-button @click="cancel">{{ $t("buttons.cancel") }}</el-button>
        <el-button type="primary" @click="handleSave">{{ $t("buttons.confirm") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { computed, defineExpose, reactive, ref } from "vue";
import { fetchPageRole, fetchUpdateRole, fetchDeleteRole, fetchUpdateRoleMenu, fetchGetRoleMenu } from "@/api/manage/role";
import { fetchListMenu } from "@/api/manage/menu";
import { transformI18n } from "@repo/config";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const env = reactive({
  visible: false,
  title: "角色管理",
  data: {},
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
