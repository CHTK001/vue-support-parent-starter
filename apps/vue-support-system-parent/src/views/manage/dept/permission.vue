<script setup>
import { fetchUpdateDept } from "@/api/manage/dept";
import { message } from "@repo/utils";
import { defineExpose, reactive, watch } from "vue";
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
  env.form.sysDeptDataPermissionDeptIds = env.form.sysDeptDataPermissionDeptId?.split(",")?.map((it) => ~~it);
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
  env.form.sysDeptDataPermissionDeptId = env.form.sysDeptDataPermissionDeptIds?.join(",");
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
    <el-dialog v-model="env.visible" :title="env.title" draggable width="500px" :close-on-click-modal="false" @close="handleClose">
      <el-form :model="env.form" :rules="rules">
        <el-form-item label="机构名称" prop="sysDeptName">
          <el-text> {{ env.form.sysDeptName }}</el-text>
        </el-form-item>
        <el-form-item label="数据权限" prop="sysDeptDataPermission">
          <el-select v-model="env.form.sysDeptDataPermission" placeholder="请选择数据权限" clearable>
            <el-option v-for="item in PermissionList" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="选择部门" prop="sysDeptDataPermissionDeptId" v-if="env.form.sysDeptDataPermission === 5">
          <el-cascader v-model="env.form.sysDeptDataPermissionDeptIds" class="w-full" :options="env.deptList" :props="env.defaultProps" clearable filterable placeholder="请选择上级菜单">
            <template #default="{ node, data }">
              <div>
                <span v-if="data.sysDeptI18n">
                  {{ transformI18nValue(data.sysDeptI18n) }}
                </span>
                <span v-else>{{ data.sysDeptName }}</span>
                <span v-if="!node.isLeaf">({{ data.children.length }})</span>
              </div>
            </template>
          </el-cascader>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleUpdate" :loading="env.loading">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
