<script>
import { fetchListDictItem } from "@repo/core";
import { getCameraRtspTemplates, message } from "@repo/utils";
import { defineComponent } from "vue";
import {
  fetchSaveProjectForDevice,
  fetchUpdateProjectForDevice,
} from "../../../api/manage/device-template";

export default defineComponent({
  name: "DeviceTemplateSaveDialog",
  props: {
    category: {
      type: Array,
      default: () => [],
    },
    categoryKinds: {
      type: Array,
      default: () => [],
    },
    renderContent: {
      type: Function,
      default: () => {},
    },
    categoryProp: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      showAdvice: false,
      rtspTemplates: [],
      selectedRtspTemplate: "",
      selectedTemplateParams: null,
      dictItem1: [],
      dictItem2: [],
      dictItem3: [],
      deviceResourceTypes: [],
      form: {},
      visible: false,
      mode: "save",
      rules: {
        sysDeviceName: [
          { required: true, message: "请输入设备名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysDeviceSerialNumber: [
          { required: true, message: "请输入设备序列号", trigger: "blur" },
          { min: 2, max: 64, message: "长度在 2 到 64 个字符", trigger: "blur" },
        ],
        sysDeviceResourceType: [
          { required: true, message: "请选择设备类型", trigger: "change" },
        ],
      },
      loading: false,
      title: "",
      treeData: [],
    };
  },
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      this.rtspTemplates = getCameraRtspTemplates();

      fetchListDictItem({ sysDictId: 1 }).then((res) => {
        this.dictItem1 = res?.data || [];
      });

      fetchListDictItem({ sysDictId: 7 }).then((res) => {
        this.deviceResourceTypes = res?.data || [];
      });

      this.dictItem2 = this.category;
      this.dictItem3 = this.categoryKinds;
    },
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
      this.mode = "save";
      this.showAdvice = false;
      this.selectedRtspTemplate = "";
      this.selectedTemplateParams = null;
    },
    setData(data) {
      Object.assign(this.form, data);
      this.form.sysDictId = data?.sysDictId;

      if (this.form.sysDeviceChannels) {
        this.form.sysDeviceChannelsTemp = this.form.sysDeviceChannels.split(",");
      }

      this.showAdvice = Boolean(
        this.form.sysDeviceAccount ||
          this.form.sysDevicePassword ||
          this.form.sysDeviceNetAddress ||
          this.form.sysDeviceRtsp ||
          this.form.sysDeviceRtspWebrtc ||
          this.form.sysDevicePosition ||
          this.form.sysDeviceVersion ||
          this.form.sysDeviceOwner,
      );

      if (this.form.sysDeviceRtsp) {
        const matchedTemplate = this.rtspTemplates.find(
          (template) => this.form.sysDeviceRtsp === template.rtspTemplate,
        );
        if (matchedTemplate) {
          this.selectedRtspTemplate = matchedTemplate.rtspTemplate;
          this.selectedTemplateParams = matchedTemplate.params;
        }
      }

      return this;
    },
    setTableData(data) {
      this.treeData = Array.isArray(data) ? data : [];
      return this;
    },
    async open(mode = this.mode) {
      this.visible = true;
      this.mode = mode;
      this.title =
        mode == "save" ? "新增设备" : mode == "edit" ? "编辑设备" : "查看设备";

      if (mode == "save") {
        this.form.sysDeviceMainSubtype = this.form.sysDeviceMainSubtype ?? 0;
        this.form.sysDeviceSubSubtype = this.form.sysDeviceSubSubtype ?? 1;
        this.form.sysDeviceOnline = this.form.sysDeviceOnline ?? 1;
      }
    },
    handleRtspTemplateChange(template) {
      if (template) {
        this.form.sysDeviceRtsp = template;
        const selectedTemplate = this.rtspTemplates.find(
          (item) => item.rtspTemplate === template,
        );
        this.selectedTemplateParams = selectedTemplate
          ? selectedTemplate.params
          : null;
      } else {
        this.selectedTemplateParams = null;
      }
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (!valid) {
          return;
        }

        this.loading = true;
        let res = {};
        const newForm = {};

        if (this.form.sysDeviceChannelsTemp) {
          this.form.sysDeviceChannels = this.form.sysDeviceChannelsTemp.join(",");
          this.form.sysDeviceChannelCount =
            this.form.sysDeviceChannelsTemp.length;
        }

        Object.assign(newForm, this.form);

        if (this.mode === "save") {
          res = await fetchSaveProjectForDevice(newForm);
        } else if (this.mode === "edit") {
          res = await fetchUpdateProjectForDevice(newForm);
        }

        if (res.code == "00000") {
          this.$emit("success", newForm);
          this.visible = false;
          message("操作成功", { type: "success" });
        } else {
          message(res.msg || "操作失败", { type: "error" });
        }

        this.loading = false;
      });
    },
  },
});
</script>

<template>
  <div class="device-form">
    <sc-dialog
      v-model="visible"
      top="10px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      :title="title"
      @close="close"
      width="760px"
      class="device-dialog"
    >
      <ScForm
        ref="dialogForm"
        :model="form"
        :rules="rules"
        :disabled="mode == 'show'"
        label-width="110px"
        class="device-form__body"
      >
        <div class="form-section">
          <div class="section-title">基础信息</div>
          <ScRow :gutter="16">
            <ScCol :span="24">
              <ScFormItem label="名称" prop="sysDeviceName">
                <ScInput
                  v-model="form.sysDeviceName"
                  placeholder="请输入设备名称"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="序列号" prop="sysDeviceSerialNumber">
                <ScInput
                  v-model="form.sysDeviceSerialNumber"
                  placeholder="请输入设备序列号"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="设备类型" prop="sysDeviceResourceType">
                <ScSelect
                  v-model="form.sysDeviceResourceType"
                  placeholder="请选择设备类型"
                  clearable
                  class="w-full"
                >
                  <ScOption
                    v-for="item in deviceResourceTypes"
                    :key="item.sysDictItemCode"
                    :label="item.sysDictItemName"
                    :value="item.sysDictItemCode"
                  >
                    <span>{{ item.sysDictItemName }}</span>
                    <span class="option-code">{{ item.sysDictItemCode }}</span>
                  </ScOption>
                </ScSelect>
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="状态" prop="sysDeviceOnline">
                <el-segmented
                  v-model="form.sysDeviceOnline"
                  :options="[
                    { label: '在线', value: 1 },
                    { label: '离线', value: 0 },
                  ]"
                  class="device-segmented"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="描述" prop="sysDeviceDescription">
                <ScInput
                  v-model="form.sysDeviceDescription"
                  placeholder="请输入设备描述信息"
                  type="textarea"
                  :rows="2"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="高级配置" prop="showAdvice">
                <el-segmented
                  v-model="showAdvice"
                  :options="[
                    { label: '开启', value: true },
                    { label: '关闭', value: false },
                  ]"
                  class="device-segmented"
                />
              </ScFormItem>
            </ScCol>
          </ScRow>
        </div>

        <div v-if="showAdvice" class="form-section">
          <div class="section-title">高级配置</div>
          <ScRow :gutter="16">
            <ScCol :span="12">
              <ScFormItem label="设备账号" prop="sysDeviceAccount">
                <ScInput
                  v-model="form.sysDeviceAccount"
                  placeholder="请输入设备账号"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="设备密码" prop="sysDevicePassword">
                <ScInput
                  v-model="form.sysDevicePassword"
                  placeholder="请输入设备密码"
                  show-password
                  type="password"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="网络地址" prop="sysDeviceNetAddress">
                <ScInput
                  v-model="form.sysDeviceNetAddress"
                  placeholder="请输入设备IP地址"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem prop="sysDeviceRtsp">
                <template #label>
                  <div class="label-with-help">
                    <span>RTSP模板</span>
                    <ScTooltip
                      v-if="selectedTemplateParams"
                      placement="top"
                      :show-after="200"
                    >
                      <template #content>
                        <div class="params-tooltip">
                          <div class="params-tooltip__title">参数说明</div>
                          <div
                            v-for="(desc, key) in selectedTemplateParams"
                            :key="key"
                            class="params-tooltip__item"
                          >
                            <span class="params-tooltip__key">${{ key }}</span>
                            <span class="params-tooltip__desc">{{ desc }}</span>
                          </div>
                        </div>
                      </template>
                      <IconifyIconOnline
                        icon="mdi:help-circle-outline"
                        class="help-icon-inline"
                      />
                    </ScTooltip>
                  </div>
                </template>

                <ScSelect
                  v-model="selectedRtspTemplate"
                  placeholder="请选择摄像头厂商模板"
                  clearable
                  class="w-full mb-2"
                  @change="handleRtspTemplateChange"
                >
                  <ScOption
                    v-for="item in rtspTemplates"
                    :key="item.manufacturer"
                    :label="`${item.manufacturer} (${item.version})`"
                    :value="item.rtspTemplate"
                  >
                    <div class="template-option">
                      <div class="template-option__title">
                        {{ item.manufacturer }} - {{ item.version }}
                      </div>
                      <div class="template-option__desc">
                        {{ item.description }}
                      </div>
                    </div>
                  </ScOption>
                </ScSelect>

                <ScInput
                  v-model="form.sysDeviceRtsp"
                  placeholder="请输入RTSP推流地址"
                  type="textarea"
                  :rows="3"
                  class="rtsp-input"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="主码流" prop="sysDeviceMainSubtype">
                <ScInput
                  v-model="form.sysDeviceMainSubtype"
                  placeholder="请输入主码流编码"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="子码流" prop="sysDeviceSubSubtype">
                <ScInput
                  v-model="form.sysDeviceSubSubtype"
                  placeholder="请输入子码流编码"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="WebRTC地址" prop="sysDeviceRtspWebrtc">
                <ScInput
                  v-model="form.sysDeviceRtspWebrtc"
                  placeholder="请输入WebRTC地址"
                />
                <div class="form-help">用于解析rtsp流，支持浏览器播放</div>
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="设备安装位置" prop="sysDevicePosition">
                <ScInput
                  v-model="form.sysDevicePosition"
                  placeholder="请输入设备安装位置"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="设备版本" prop="sysDeviceVersion">
                <ScInput
                  v-model="form.sysDeviceVersion"
                  placeholder="请输入设备版本号"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="设备归属" prop="sysDeviceOwner">
                <ScInput
                  v-model="form.sysDeviceOwner"
                  placeholder="请输入所属者唯一编码"
                />
              </ScFormItem>
            </ScCol>
          </ScRow>
        </div>
      </ScForm>

      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="visible = false">取 消</ScButton>
          <ScButton
            v-if="mode != 'show'"
            type="primary"
            :loading="loading"
            @click="submit()"
          >
            保 存
          </ScButton>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
.device-form {
  .device-dialog {
    :deep(.el-dialog) {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }
  }

  .form-section {
    margin-bottom: 24px;
    padding: 20px 24px;
    background-color: var(--el-bg-color-overlay);
    border-radius: 14px;
    border: 1px solid var(--el-border-color-lighter);
  }

  .section-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
    padding-bottom: 12px;
    border-bottom: 2px solid var(--el-color-primary-light-7);
  }

  .device-segmented {
    width: 100%;
  }

  :deep(.el-segmented-item) {
    flex: 1;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 10px;
  }

  :deep(.el-button) {
    border-radius: 10px;
    font-weight: 600;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.w-full {
  width: 100%;
}

.mb-2 {
  margin-bottom: 8px;
}

.option-code {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.label-with-help {
  display: flex;
  align-items: center;
  gap: 6px;
}

.help-icon-inline {
  font-size: 16px;
  color: var(--el-text-color-primary);
  cursor: pointer;
}

.params-tooltip {
  max-width: 320px;
}

.params-tooltip__title {
  margin-bottom: 6px;
  font-weight: 700;
}

.params-tooltip__item {
  display: flex;
  gap: 6px;
  margin: 4px 0;
}

.params-tooltip__key {
  color: var(--el-color-primary);
  font-family: monospace;
}

.params-tooltip__desc {
  color: #fff;
}

.template-option {
  display: flex;
  flex-direction: column;
}

.template-option__title {
  font-weight: 600;
}

.template-option__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.form-help {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rtsp-input {
  font-family: monospace;
}
</style>
