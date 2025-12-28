<template>
  <div class="project-save-container">
    <sc-dialog v-model="visible" :title="env.title" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable class="project-dialog" @close="close">
      <template #header>
        <div class="dialog-custom-header">
          <!-- 基本信息区域 -->
          <div class="section-title w-full">
            <IconifyIconOnline icon="mdi:information" />
            <span>基本信息</span>
          </div>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px" class="project-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="sysProjectName">
              <el-input v-model="form.sysProjectName" placeholder="请输入项目名称" class="custom-input">
                <template #prefix>
                  <IconifyIconOnline icon="mdi:projector" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="项目图标" prop="sysProjectIcon">
              <el-input v-model="form.sysProjectIcon" class="custom-input" placeholder="请输入图标地址">
                <template #prefix>
                  <IconifyIconOnline icon="mdi:image" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="密钥分组" prop="sysProjectGroup">
              <el-input v-model="form.sysProjectGroup" placeholder="请输入密钥分组" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="接入方式" prop="sysProjectVender">
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
                      ><el-icon v-copy:click="form.sysProjectAppKey" class="top-[2px] cursor-pointer"> <component :is="useRenderIcon('ep:copy-document')"></component> </el-icon
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
            <el-form-item label="优先级" prop="sysProjectSort">
              <el-input-number v-model="form.sysProjectSort" placeholder="请输入优先级" />
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
        <el-button @click="handleClose" class="cancel-btn"> 取消 </el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="env.loading" @click="debounce(handleSaveOrUpdate(), 1000, true)" class="save-btn"> 保存 </el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<style lang="scss" scoped>
.project-save-container {
  .project-dialog {
    :deep(.el-dialog) {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 12px 32px 4px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(8px);

      .el-dialog__header {
        display: none; // 隐藏原有的header
      }

      .el-dialog__body {
        padding: 0; // 移除默认内边距
        background: var(--el-bg-color-page);

        &::before {
          content: attr(dialog-title);
          display: block;
          padding: 20px 24px;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          background: var(--el-bg-color-overlay);
          border-bottom: 1px solid var(--el-border-color-lighter);
        }
      }

      .el-dialog__footer {
        padding: 16px 20px;
        border-top: 1px solid var(--el-border-color-lighter);
        background: var(--el-bg-color-overlay);
      }
    }
  }

  .form-section {
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .iconify {
      font-size: 20px;
      color: var(--el-color-primary);
    }
  }

  .custom-input {
    :deep(.el-input__wrapper) {
      padding-left: 8px;

      .el-input__prefix {
        margin-right: 8px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .el-button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 20px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .project-save-container {
    .form-section {
      background: var(--el-bg-color-overlay);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>

<script setup>
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message, queryEmail, stringSplitToNumber } from "@repo/utils";
import {  defineExpose, reactive, ref, shallowRef } from "vue";
import { fetchSaveProject, fetchUpdateProject } from "../../api/manage/project";
const show = reactive({
  smtp: false,
});
const emit = defineEmits([]);
const visible = shallowRef(false);
const formRef = shallowRef();
const form = ref({});
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

  if (selectedVenderItem.value?.property) {
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
          delete form.value.sysProjectId;
          fetchSaveProject(form.value).then((res) => {
            if (res.code == "00000") {
              message("保存成功", { type: "success" });
              emit("success", res?.data);
              handleClose();
            }
          });
          return;
        }
        if (env.mode === "edit") {
          fetchUpdateProject(form.value).then((res) => {
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
  Object.assign(form.value, data);
  handleChangeVender(form.value.sysProjectVender);
  env.mode = mode;
  env.loading = false;
  visible.value = true;
  if (mode === "edit") {
    env.title = `修改项目[${form.value.sysProjectName}]信息`;
    if (form.value.sysProjectFunction) {
      form.value.sysProjectFunction = stringSplitToNumber(form.value.sysProjectFunction);
      handleChangeFunction(form.value.sysProjectFunction);
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
  form.value = {};
  formRef.value.resetFields();
};
defineExpose({
  handleDictItem,
  handleFunction,
  handleOpen,
  handleClose,
});
</script>
