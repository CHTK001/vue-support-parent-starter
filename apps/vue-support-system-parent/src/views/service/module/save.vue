<script setup>
import { fetchSaveServiceModule, fetchUpdateServiceModule } from "@/api/service/module";
import { message } from "@repo/utils";
import { defineExpose, shallowRef, reactive, ref } from "vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();
const formRef = shallowRef();
const emit = defineEmits(["close"]);
const env = reactive({
  visible: false,
  title: "",
  params: {},
  data: {},
  form: {
    sysServiceModuleMenuTagsList: [],
    sysServiceModuleMenuTagsList2: [],
  },
  loading: false,
  mode: "save",
  props: {
    label: "sysMenuTitle",
    value: "sysMenuId",
  },
});

const rules = {
  sysServiceModuleName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  sysServiceModuleCode: [{ required: true, message: "请输入编码", trigger: "blur" }],
  sysServiceModuleType: [{ required: true, message: "请选择类型", trigger: "blur" }],
  sysServiceModuleMenuTagsList: [{ required: true, message: "请选择菜单", trigger: "blur" }],
};
const handleClose = async () => {
  env.visible = false;
  env.form = {
    sysServiceModuleMenuTagsList: [],
    sysServiceModuleMenuTagsList2: [],
  };
};

const handleUpdate = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      env.loading = true;
      if (env.form.sysServiceModuleMenuTagsList2) {
        env.form.sysServiceModuleMenuTags2 = env.form.sysServiceModuleMenuTagsList2.join(",");
      }
      if (env.form.sysServiceModuleMenuTagsList) {
        env.form.sysServiceModuleMenuTags = env.form.sysServiceModuleMenuTagsList.join(",");
      }
      if (env.mode === "edit") {
        return fetchUpdateServiceModule(env.form)
          .then((res) => {
            message(t("message.updateSuccess"), { type: "success" });
            emit("success");
            handleClose();
          })
          .finally(() => {
            env.loading = false;
          });
      }
      return fetchSaveServiceModule(env.form)
        .then((res) => {
          message(t("message.updateSuccess"), { type: "success" });
          emit("success");
          handleClose();
        })
        .finally(() => {
          env.loading = false;
        });
    }
  });
};

const handleOpen = async (item, mode) => {
  // 重置表单为初始状态
  env.form = {
    sysServiceModuleMenuTagsList: [],
    sysServiceModuleMenuTagsList2: [],
  };
  // 复制传入的数据，避免引用问题
  if (item && mode === "edit") {
    Object.assign(env.form, item);
  }
  env.mode = mode;
  env.visible = true;
  if (mode == "save") {
    env.title = "新增模块";
    env.form.sysServiceModuleSort = 1;
    return;
  }
  env.title = "模块更新 - " + item.sysServiceModuleName;
  if (env.form.sysServiceModuleMenuTags) {
    env.form.sysServiceModuleMenuTagsList = env.form.sysServiceModuleMenuTags?.split(",").map((it) => ~~it);
  }
  if (env.form.sysServiceModuleMenuTags2) {
    env.form.sysServiceModuleMenuTagsList2 = env.form.sysServiceModuleMenuTags2?.split(",").map((it) => ~~it);
  }
};

const handleLoadMenuList = async (data) => {
  env.menuList = data;
};

const handleSelect = (currentNode, checkedNodes) => {
  // 获取所有选中的节点值
  const selectedValues = checkedNodes.checkedKeys;

  // 获取所有父节点值
  const parentValues = checkedNodes.halfCheckedKeys;

  // 合并选中的节点值和父节点值
  env.form.sysServiceModuleMenuTagsList2 = [...selectedValues, ...parentValues];
};

defineExpose({
  handleOpen,
  handleLoadMenuList,
  handleClose,
});
</script>
<template>
  <div>
    <sc-dialog v-model="env.visible" :title="env.title" draggable :close-on-click-modal="false">
      <el-form :model="env.form" ref="formRef" :rules="rules" label-width="120px" class="modern-form">
        <el-form-item label="名称" prop="sysServiceModuleName">
          <el-input v-model="env.form.sysServiceModuleName" placeholder="请输入名称" />
        </el-form-item>

        <el-form-item label="编码" prop="sysServiceModuleCode">
          <el-input v-model="env.form.sysServiceModuleCode" placeholder="请输入编码" />
        </el-form-item>

        <el-form-item label="类型" prop="sysServiceModuleType">
          <el-select v-model="env.form.sysServiceModuleType" placeholder="请选择类型">
            <el-option label="接口" value="API" />
            <el-option label="服务" value="SERVICE" />
          </el-select>
        </el-form-item>

        <el-form-item label="选中菜单" prop="sysServiceModuleMenuTagsList" v-if="env.form.sysServiceModuleType == 'SERVICE'">
          <el-tree-select filterable @check="handleSelect" value-key="sysMenuId" v-model="env.form.sysServiceModuleMenuTagsList" show-checkbox :props="env.props" :data="env.menuList" multiple :render-after-expand="false" />
        </el-form-item>

        <el-form-item label="优先级" prop="sysServiceModuleSort">
          <el-input-number v-model="env.form.sysServiceModuleSort" placeholder="请输入编码" />
        </el-form-item>

        <el-form-item label="版本" prop="sysServiceModuleVersion">
          <el-input v-model="env.form.sysServiceModuleVersion" placeholder="请输入描述" />
        </el-form-item>

        <el-form-item label="描述" prop="sysServiceModuleRemark">
          <el-input v-model="env.form.sysServiceModuleRemark" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">{{ $t("buttons.cancel") }}</el-button>
        <el-button type="primary" :loading="env.loading" @click="handleUpdate">{{ $t("buttons.confirm") }}</el-button>
      </template>
    </sc-dialog>
  </div>
</template>
