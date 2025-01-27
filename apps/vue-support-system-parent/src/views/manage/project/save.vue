<template>
  <div>
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="env.title" @close="close">
      <el-form ref="formRef" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="项目名称" prop="sysProjectName">
              <el-input v-model="form.sysProjectName" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="项目图标" prop="sysProjectIcon">
              <el-input v-model="form.sysProjectIcon" class="w-full" placeholder="请输入图标地址" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="密钥分组" prop="sysProjectGroup">
              <el-input v-model="form.sysProjectGroup" placeholder="请输入密钥分组" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="适用厂家" prop="sysProjectVener">
              <el-select v-model="form.sysProjectVener" placeholder="请选择厂家" filterable>
                <el-option v-for="item in dictItemData" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="appId" prop="sysProjectAppId">
              <el-input v-model="form.sysProjectAppId" placeholder="请输入AppId" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="appSecret" prop="sysProjectAppSecret">
              <el-input v-model="form.sysProjectAppSecret" placeholder="请输入appSecret" type="password" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="签名" prop="sysProjectSign">
              <el-input v-model="form.sysProjectSign" placeholder="请输入签名" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="endpoint" prop="sysProjectEndpoint">
              <el-input v-model="form.sysProjectEndpoint" placeholder="请输入endpoint" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="cdn" prop="sysProjectCdn">
              <el-input v-model="form.sysProjectCdn" placeholder="请输入cdn" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="功能" prop="sysProjectFunction">
              <el-select v-model="form.sysProjectFunction" placeholder="请选择支持功能" filterable multiple>
                <el-option v-for="item in functionList" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="备注" prop="sysProjectRemark">
              <el-input v-model="form.sysProjectRemark" placeholder="请输入备注" type="textarea" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="handleClose">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="env.loading" @click="debounce(handleSaveOrUpdate(), 1000, true)">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchSaveProject, fetchUpdateProject } from "@/api/manage/project";
import { debounce } from "@pureadmin/utils";
import { message, stringSplitToNumber } from "@repo/utils";
import { defineEmits, defineExpose, reactive, ref } from "vue";

const emit = defineEmits([]);
const visible = ref(false);
const formRef = ref();
let form = reactive({});
const rules = {
  sysProjectVener: [{ required: true, message: "请选择厂家", trigger: "blur" }],
  sysProjectName: [{ required: true, message: "请输入项目名称", trigger: "blur" }]
};
const dictItemData = reactive({});
const functionList = reactive({});
const env = reactive({
  mode: "edit",
  title: "项目信息",
  loading: false
});

const handleSaveOrUpdate = async () => {
  formRef.value.validate(async valid => {
    if (valid) {
      env.loading = true;
      try {
        if (env.mode === "add") {
          fetchSaveProject(form).then(res => {
            if (res.code == "00000") {
              message("保存成功", { type: "success" });
              emit("success", res?.data);
              handleClose();
            }
          });
          return;
        }
        if (env.mode === "edit") {
          fetchUpdateProject(form).then(res => {
            if (res.code == "00000") {
              message("修改成功", { type: "success" });
              emit("success", res?.data);
              handleClose();
            }
          });
        }
      } catch (error) {
        env.loading = false;
      }
    }
  });
};
const handleOpen = async (mode, data) => {
  Object.assign(form, data);
  env.mode = mode;
  env.loading = false;
  visible.value = true;
  if (mode === "edit") {
    env.title = "修改项目信息";
    if (form.sysProjectFunction) {
      form.sysProjectFunction = stringSplitToNumber(form.sysProjectFunction);
    }
  } else if (mode === "add") {
    env.title = "添加项目信息";
  }
};

const handleDictItem = async dictItemData1 => {
  Object.assign(dictItemData, dictItemData1);
};

const handleFunction = async functionList1 => {
  Object.assign(functionList, functionList1);
};
const handleClose = async () => {
  visible.value = false;
  form = reactive({});
  formRef.value.resetFields();
};
defineExpose({
  handleDictItem,
  handleFunction,
  handleOpen,
  handleClose
});
</script>
