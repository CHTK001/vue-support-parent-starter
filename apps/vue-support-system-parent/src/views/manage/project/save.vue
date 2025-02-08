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
            <el-form-item label="适用厂家" prop="sysProjectVender">
              <el-select v-model="form.sysProjectVender" placeholder="请选择厂家" filterable>
                <el-option v-for="item in dictItemData" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="项目AppId" prop="sysProjectAppId">
              <el-input v-model="form.sysProjectAppId" placeholder="请输入AppId" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="项目密钥" prop="sysProjectAppSecret">
              <el-input v-model="form.sysProjectAppSecret" placeholder="请输入AppSecret" type="password" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="AppKey" prop="sysProjectAppKey">
              <el-input v-model="form.sysProjectAppKey" placeholder="请输入AppKey" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="签名" prop="sysProjectSign">
              <el-input v-model="form.sysProjectSign" placeholder="请输入签名" />
              <span class="el-form-item-msg">项目签名/项目标识</span>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="项目编码" prop="sysProjectSignCode">
              <el-input v-model="form.sysProjectSignCode" placeholder="请输入项目编码" />
              <span class="el-form-item-msg">项目编码</span>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="切入点" prop="sysProjectEndpoint">
              <el-input v-model="form.sysProjectEndpoint" placeholder="请输入Endpoint" />
              <span class="el-form-item-msg">平台接口地址</span>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="cdn" prop="sysProjectCdn">
              <el-input v-model="form.sysProjectCdn" placeholder="请输入cdn" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="功能" prop="sysProjectFunction">
              <el-select v-model="form.sysProjectFunction" placeholder="请选择支持功能" filterable multiple @change="handleChangeFunction">
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
        <el-divider v-if="show.smtp">
          <template #default>SMTP</template>
        </el-divider>
        <el-row v-if="show.smtp">
          <el-col :span="12">
            <el-form-item label="smtp主机" prop="sysProjectSmtpHost" placeholder="smtp.163.com">
              <el-input v-model="form.sysProjectSmtpHost" placeholder="请输入smtp主机" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="smtp端口" prop="sysProjectSmtpPort" placeholder="25">
              <el-input v-model="form.sysProjectSmtpPort" placeholder="请输入smtp端口" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="smtp密码" prop="sysProjectSmtpPassword">
              <el-input v-model="form.sysProjectSmtpPassword" placeholder="请输入smtp密码" type="password" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体账号" prop="sysProjectSmtpFrom">
              <el-autocomplete v-model="form.sysProjectSmtpFrom" :fetch-suggestions="queryEmail" :trigger-on-focus="false" placeholder="请输入主体账号邮箱" clearable class="w-full" />
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
import { message, queryEmail, stringSplitToNumber } from "@repo/utils";
import { defineEmits, defineExpose, reactive, ref } from "vue";
const show = reactive({
  smtp: false,
});
const emit = defineEmits([]);
const visible = ref(false);
const formRef = ref();
let form = reactive({});
const rules = {
  sysProjectVender: [{ required: true, message: "请选择厂家", trigger: "blur" }],
  sysProjectName: [{ required: true, message: "请输入项目名称", trigger: "blur" }],
};
const dictItemData = reactive({});
let functionList = [];
const env = reactive({
  mode: "edit",
  title: "项目信息",
  loading: false,
});

const handleChangeFunction = async (_val) => {
  const selectFunction = functionList.filter((it) => _val.includes(it.sysDictItemId) && it.sysDictItemCode === "YOU_JIAN");
  show.smtp = false;
  if (selectFunction.length > 0) {
    show.smtp = true;
  }
};
const handleSaveOrUpdate = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      env.loading = true;
      try {
        if (env.mode === "add") {
          fetchSaveProject(form).then((res) => {
            if (res.code == "00000") {
              message("保存成功", { type: "success" });
              emit("success", res?.data);
              handleClose();
            }
          });
          return;
        }
        if (env.mode === "edit") {
          fetchUpdateProject(form).then((res) => {
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
      handleChangeFunction(form.sysProjectFunction);
    }
  } else if (mode === "add") {
    env.title = "添加项目信息";
  }
};

const handleDictItem = async (dictItemData1) => {
  Object.assign(dictItemData, dictItemData1);
};

const handleFunction = (functionList1) => {
  functionList = functionList1;
};
const handleClose = async () => {
  visible.value = false;
  show.smtp = false;
  form = reactive({});
  formRef.value.resetFields();
};
defineExpose({
  handleDictItem,
  handleFunction,
  handleOpen,
  handleClose,
});
</script>
