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
              <el-select v-model="form.sysProjectVender" placeholder="请选择厂家" filterable @change="handleChangeVender">
                <el-option v-for="item in venderDataList" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
              </el-select>
            </el-form-item>
          </el-col>

          <template v-if="form.sysProjectVender">
            <el-col :span="12" v-if="showPropertyFromVender('sysProjectAppId')">
              <el-form-item label="项目AppId" prop="sysProjectAppId">
                <el-input v-model="form.sysProjectAppId" placeholder="请输入AppId" />
              </el-form-item>
            </el-col>

            <el-col :span="12" v-if="showPropertyFromVender('sysProjectAppSecret')">
              <el-form-item label="项目密钥" prop="sysProjectAppSecret">
                <el-input v-model="form.sysProjectAppSecret" placeholder="请输入AppSecret" type="password" show-password />
              </el-form-item>
            </el-col>

            <el-col :span="12" v-if="showPropertyFromVender('sysProjectAppKey')">
              <el-form-item label="AppKey" prop="sysProjectAppKey">
                <template #label>
                  <div>
                    <span>AppKey</span>
                    <span v-if="form.sysProjectAppKey"
                      ><el-icon v-copy:click="form.sysProjectAppKey" class="top-[2px] cursor-pointer"><component :is="useRenderIcon('ep:copy-document')"></component></el-icon
                    ></span>
                  </div>
                </template>
                <el-input v-model="form.sysProjectAppKey" placeholder="请输入AppKey" type="password" show-password />
              </el-form-item>
            </el-col>

            <el-col :span="12" v-if="showPropertyFromVender('sysProjectSign')">
              <el-form-item label="签名" prop="sysProjectSign">
                <el-input v-model="form.sysProjectSign" placeholder="请输入签名" />
                <span class="el-form-item-msg">项目签名/项目标识</span>
              </el-form-item>
            </el-col>

            <el-col :span="12" v-if="showPropertyFromVender('sysProjectSignCode')">
              <el-form-item label="项目编码" prop="sysProjectSignCode">
                <el-input v-model="form.sysProjectSignCode" placeholder="请输入项目编码" />
                <span class="el-form-item-msg">项目编码</span>
              </el-form-item>
            </el-col>

            <el-col :span="12" v-if="showPropertyFromVender('sysProjectEndpoint')">
              <el-form-item label="切入点" prop="sysProjectEndpoint">
                <el-input v-model="form.sysProjectEndpoint" placeholder="请输入Endpoint" />
                <span class="el-form-item-msg">平台接口地址</span>
              </el-form-item>
            </el-col>

            <el-col :span="12" v-if="showPropertyFromVender('sysProjectCdn')">
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
          </template>

          <el-col :span="24" v-role="'ADMIN'">
            <el-form-item label="临时目录" prop="sysProjectLocationTempPath">
              <el-input v-model="form.sysProjectLocationTempPath" placeholder="请输入服务器下临时目录(联系管理员操作)" />
            </el-form-item>
          </el-col>

          <el-col :span="24" v-role="'ADMIN'">
            <el-form-item label="oss地址" prop="sysProjectLocationOssAddress">
              <el-input v-model="form.sysProjectLocationOssAddress" placeholder="请输入服务器下临时目录(联系管理员操作)" />
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
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { isValidOrDefault, message, queryEmail, stringSplitToNumber, withComputed } from "@repo/utils";
import { defineEmits, defineExpose, reactive, ref, shallowRef, watch } from "vue";
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
const venderDataList = shallowRef([]);
let functionList = [];
const env = reactive({
  mode: "edit",
  title: "项目信息",
  loading: false,
});

const showProperty = shallowRef({});
const selectedFunctionItem = shallowRef();
const selectedVenderItem = shallowRef();
const showPropertyFromVender = (property) => {
  if (!Object.keys(showProperty.value).length) {
    return true;
  }

  return showProperty.value[property];
};
const handleChangeVender = async (_val) => {
  selectedVenderItem.value = venderDataList.value.filter((it) => it.sysDictItemId == _val)[0];
  handleRenderProperty();
};

const handleChangeFunction = async (_val) => {
  const selectFunction = functionList.filter((it) => _val.includes(it.sysDictItemId) && it.sysDictItemCode === "YOU_JIAN");
  selectedFunctionItem.value = functionList.filter((it) => _val.includes(it.sysDictItemId));
  handleRenderProperty();
  show.smtp = false;
  if (selectFunction.length > 0) {
    show.smtp = true;
  }
};

const handleRenderProperty = async () => {
  showProperty.value = {};
  if (selectedFunctionItem.value) {
    selectedFunctionItem.value.forEach((ele) => {
      if (ele.property) {
        ele.property.forEach((element) => {
          showProperty.value[element.sysDictItemPropertyName] = element.sysDictItemPropertyValue == "true";
        });
      }
    });
  }

  if (selectedVenderItem.value.property) {
    selectedVenderItem.value.property.forEach((element) => {
      showProperty.value[element.sysDictItemPropertyName] = element.sysDictItemPropertyValue == "true";
    });
  }
};
const handleSaveOrUpdate = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      env.loading = true;
      try {
        if (env.mode === "add") {
          delete form.sysProjectId;
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
  handleChangeVender(form.sysProjectVender);
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
  venderDataList.value = dictItemData1;
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
