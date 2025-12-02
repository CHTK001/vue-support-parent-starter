<script>
import { fetchListDictItem } from "@repo/core";
import { getCameraRtspTemplates, message } from "@repo/utils";
import { defineComponent } from "vue";
import {
  fetchSaveProjectForDevice,
  fetchUpdateProjectForDevice,
} from "../../../api/manage/project-device";

export default defineComponent({
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
      default: () => {},
    },
  },
  data() {
    return {
      // 控制高级配置显示
      showAdvice: false,
      // 摄像头RTSP模板数据
      rtspTemplates: [],
      // 当前选中的RTSP模板
      selectedRtspTemplate: "",
      // 当前选中模板的参数说明
      selectedTemplateParams: null,
      // 字典数据
      dictItem1: [],
      dictItem2: [],
      dictItem3: [],
      deviceResourceTypes: [],
      // 表单数据
      form: {},
      // 对话框显示控制
      visible: false,
      // 表单验证规则
      rules: {
        sysDeviceName: [
          { required: true, message: "请输入设备名称", trigger: "blur" },
          {
            min: 2,
            max: 20,
            message: "长度在 2 到 20 个字符",
            trigger: "blur",
          },
        ],
        sysDeviceSerialNumber: [
          { required: true, message: "请输入设备序列号", trigger: "blur" },
          {
            min: 2,
            max: 20,
            message: "长度在 2 到 20 个字符",
            trigger: "blur",
          },
        ],
      },
      // 加载状态
      loading: false,
      // 对话框标题
      title: "",
      // 操作模式：save-新增，edit-编辑，show-查看
      mode: "save",
      // 树形数据
      treeData: [],
    };
  },
  mounted() {
    // 初始化数据
    this.initialize();
  },
  methods: {
    /**
     * 初始化数据
     */
    async initialize() {
      // 获取摄像头RTSP模板
      this.rtspTemplates = getCameraRtspTemplates();

      // 获取字典数据
      fetchListDictItem({
        sysDictId: 1,
      }).then((res) => {
        this.dictItem1 = res?.data;
      });

      // 获取设备资源类型
      fetchListDictItem({
        sysDictId: 7,
      }).then((res) => {
        this.deviceResourceTypes = res?.data;
      });

      // 设置分类数据
      this.dictItem2 = this.category;
      this.dictItem3 = this.categoryKinds;
    },

    /**
     * 关闭对话框
     */
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
      this.selectedRtspTemplate = "";
      this.selectedTemplateParams = null;
    },

    /**
     * 设置表单数据
     * @param {Object} data - 设备数据
     */
    setData(data) {
      Object.assign(this.form, data);
      this.form.sysDictId = data?.sysDictId;

      // 处理通道数据
      if (this.form.sysDeviceChannels) {
        this.form.sysDeviceChannelsTemp =
          this.form.sysDeviceChannels.split(",");
      }

      // 如果有RTSP地址，尝试匹配模板
      if (this.form.sysDeviceRtsp) {
        const matchedTemplate = this.rtspTemplates.find(
          (template) => this.form.sysDeviceRtsp === template.rtspTemplate
        );
        if (matchedTemplate) {
          this.selectedRtspTemplate = matchedTemplate.rtspTemplate;
          this.selectedTemplateParams = matchedTemplate.params;
        }
      }

      return this;
    },

    /**
     * 设置表格数据
     * @param {Array} data - 表格数据
     */
    setTableData(data) {
      Object.assign(this.treeData, data);
      return this;
    },

    /**
     * 打开对话框
     * @param {string} mode - 操作模式
     */
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title =
        mode == "save" ? "新增设备" : mode == "edit" ? "编辑设备" : "查看设备";

      // 新增模式下设置默认值
      if (mode == "save") {
        this.form.sysDeviceMainSubtype = 0;
        this.form.sysDeviceSubSubtype = 1;
      }
    },

    /**
     * 处理RTSP模板变更
     * @param {string} template - 选中的模板
     */
    handleRtspTemplateChange(template) {
      if (template) {
        this.form.sysDeviceRtsp = template;
        // 找到当前选中的模板，获取其参数说明
        const selectedTemplate = this.rtspTemplates.find(
          (item) => item.rtspTemplate === template
        );
        this.selectedTemplateParams = selectedTemplate
          ? selectedTemplate.params
          : null;
      } else {
        this.selectedTemplateParams = null;
      }
    },

    /**
     * 提交表单
     */
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          const newForm = {};

          // 处理通道数据
          if (this.form.sysDeviceChannelsTemp) {
            this.form.sysDeviceChannels =
              this.form.sysDeviceChannelsTemp.join(",");
            this.form.sysDeviceChannelCount =
              this.form.sysDeviceChannelsTemp.length;
          }

          Object.assign(newForm, this.form);

          // 根据模式选择API
          if (this.mode === "save") {
            res = await fetchSaveProjectForDevice(newForm);
          } else if (this.mode === "edit") {
            res = await fetchUpdateProjectForDevice(newForm);
          }

          // 处理响应结果
          if (res.code == "00000") {
            this.$emit("success", newForm);
            this.visible = false;
            message("操作成功", { type: "success" });
          } else {
            message(res.msg, { type: "error" });
          }
        }
        this.loading = false;
      });
    },
  },
});
</script>

<style scoped lang="scss">
/* 表单区域样式 */
.device-form {
  .form-layout {
    display: flex;
    gap: 20px;
  }

  .form-left {
    flex: 1;
    min-width: 0;
  }

  .form-right {
    flex: 1.2;
    min-width: 0;
  }
}

/* 表单区域样式 */
.device-form {
  .form-layout {
    display: flex;
    gap: 20px;
  }

  .form-left,
  .form-right {
    flex: 1;
    min-width: 0;
  }

  .form-section {
    margin-bottom: 24px;
    padding: 16px;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    height: 100%;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // 其他样式保持不变...
}

/* 设备对话框样式 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    margin-right: 0;
    padding: 20px 24px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .el-dialog__body {
    padding: 24px;
    background: linear-gradient(
      180deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-lighter) 100%
    );
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-overlay);
  }
}

/* 表单区域样式 */
.device-form {
  .form-section {
    margin-bottom: 24px;
    padding: 20px 24px;
    background-color: var(--el-bg-color-overlay);
    border-radius: 14px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
      border-color: var(--el-color-primary-light-7);
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
    position: relative;
    padding-left: 14px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--el-color-primary-light-7);

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 18px;
      background: linear-gradient(
        180deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      border-radius: 2px;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover,
    &:focus-within {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
    }
  }

  /* 帮助文本样式 */
  .form-help {
    font-size: 12px;
    color: var(--el-text-color-primary);
    margin-top: 4px;
  }

  /* 参数说明区域 */
  .params-help {
    margin-top: 8px;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-size: 12px;
    color: #606266;

    .param-item {
      margin: 4px 0;

      .param-name {
        color: var(--el-color-primary);
        font-family: monospace;
        background-color: rgba(var(--el-color-primary-rgb), 0.1);
        padding: 2px 4px;
        border-radius: 3px;
      }

      .param-desc {
        color: #606266;
      }
    }
  }

  /* RTSP输入框容器样式 */
  .rtsp-input-container {
    position: relative;

    .help-icon {
      position: absolute;
      top: 0;
      right: -30px;
      cursor: pointer;
      color: var(--el-color-primary);
      font-size: 18px;
      display: flex;
      align-items: center;
      height: 32px;
    }
  }

  /* 参数提示样式 */
  .params-tooltip {
    max-width: 300px;

    .param-item {
      margin: 4px 0;

      .param-name {
        color: var(--el-color-primary);
        font-family: monospace;
        background-color: rgba(var(--el-color-primary-rgb), 0.1);
        padding: 2px 4px;
        border-radius: 3px;
      }

      .param-desc {
        color: #ffffff;
      }
    }
  }

  /* RTSP输入框样式 */
  .rtsp-input {
    font-family: monospace;

    :deep(.el-textarea__inner) {
      font-size: 13px;
    }
  }

  /* 分段控制器样式 */
  .device-segmented {
    width: 100%;

    :deep(.el-segmented-item) {
      flex: 1;

      &.is-active {
        background-color: var(--el-color-primary);
        color: var(--el-text-color-primary);
      }
    }
  }
}

/* 对话框底部按钮样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;

  .el-button {
    border-radius: 10px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
    }

    &.el-button--primary:hover {
      box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
    }
  }
}

/* 工具类 */
.w-full {
  width: 100%;
}

.mb-2 {
  margin-bottom: 8px;
}

.ml-2 {
  margin-left: 8px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-400 {
  color: var(--el-text-color-primary);
}

.font-medium {
  font-weight: 500;
}

.mt-1 {
  margin-top: 4px;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

/* 带帮助图标的标签样式 */
.label-with-help {
  display: flex;
  align-items: center;
  gap: 5px;

  .help-icon-inline {
    font-size: 16px;
    color: var(--el-text-color-primary);
    cursor: pointer;
    margin-top: 1px;
  }
}
</style>
<template>
  <div>
    <el-dialog
      v-model="visible"
      top="10px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      :title="title"
      @close="close"
      width="750px"
      class="device-dialog"
    >
      <el-form
        ref="dialogForm"
        :model="form"
        :rules="rules"
        :disabled="mode == 'show'"
        label-width="100px"
        class="device-form"
      >
        <!-- 基础信息区域 -->
        <div class="form-section">
          <div class="section-title">基础信息</div>
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item label="名称" prop="sysDeviceName">
                <el-input
                  v-model="form.sysDeviceName"
                  placeholder="请输入摄像头名称"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="序列号" prop="sysDeviceSerialNumber">
                <el-input
                  v-model="form.sysDeviceSerialNumber"
                  placeholder="请输入序列号"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="设备类型" prop="sysDeviceResourceType">
                <el-select
                  v-model="form.sysDeviceResourceType"
                  placeholder="请选择设备类型"
                  clearable
                  class="w-full"
                >
                  <el-option
                    v-for="item in deviceResourceTypes"
                    :key="item.sysDictItemCode"
                    :label="item.sysDictItemName"
                    :value="item.sysDictItemCode"
                  >
                    <span>{{ item.sysDictItemName }}</span>
                    <span class="text-gray-400 text-xs ml-2">{{
                      item.sysDictItemCode
                    }}</span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="状态" prop="sysDeviceOnline">
                <el-segmented
                  v-model="form.sysDeviceOnline"
                  :options="[
                    { label: '在线', value: 1 },
                    { label: '离线', value: 0 },
                  ]"
                  class="device-segmented"
                />
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="描述" prop="sysDeviceDescription">
                <el-input
                  v-model="form.sysDeviceDescription"
                  placeholder="请输入设备描述信息"
                  type="textarea"
                  :rows="2"
                />
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="高级配置" prop="showAdvice">
                <el-segmented
                  v-model="showAdvice"
                  :options="[
                    { label: '开启', value: true },
                    { label: '关闭', value: false },
                  ]"
                  class="device-segmented"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 高级配置区域 -->
        <div v-if="showAdvice" class="form-section">
          <div class="section-title">高级配置</div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="设备账号" prop="sysDeviceAccount">
                <el-input
                  v-model="form.sysDeviceAccount"
                  placeholder="请输入设备账号"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:account" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="设备密码" prop="sysDevicePassword">
                <el-input
                  v-model="form.sysDevicePassword"
                  placeholder="推流设备密码"
                  show-password
                  type="password"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:lock" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="网络地址" prop="sysDeviceNetAddress">
                <el-input
                  v-model="form.sysDeviceNetAddress"
                  placeholder="请输入设备IP地址"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:ip-network" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="推流地址" prop="sysDeviceRtsp">
                <!-- 添加帮助图标到标签旁边 -->
                <template #label>
                  <div class="label-with-help">
                    <span>推流地址</span>
                    <el-tooltip
                      v-if="selectedTemplateParams"
                      placement="top"
                      :show-after="200"
                    >
                      <template #content>
                        <div class="params-tooltip">
                          <div class="font-bold mb-1">参数说明:</div>
                          <div
                            v-for="(desc, key) in selectedTemplateParams"
                            :key="key"
                            class="param-item"
                          >
                            <span class="param-name">${{ key }}</span> -
                            <span class="param-desc">{{ desc }}</span>
                          </div>
                        </div>
                      </template>
                      <IconifyIconOnline
                        icon="mdi:help-circle-outline"
                        class="help-icon-inline"
                      />
                    </el-tooltip>
                  </div>
                </template>

                <!-- 摄像头厂商模板选择 -->
                <el-select
                  v-model="selectedRtspTemplate"
                  placeholder="请选择摄像头厂商模板"
                  clearable
                  class="w-full mb-2"
                  @change="handleRtspTemplateChange"
                >
                  <el-option
                    v-for="item in rtspTemplates"
                    :key="item.manufacturer"
                    :label="`${item.manufacturer} (${item.version})`"
                    :value="item.rtspTemplate"
                  >
                    <div class="flex flex-col">
                      <div class="font-medium">
                        {{ item.manufacturer }} - {{ item.version }}
                      </div>
                      <div class="text-xs text-gray-400 mt-1">
                        {{ item.description }}
                      </div>
                    </div>
                  </el-option>
                </el-select>

                <!-- RTSP地址输入框 -->
                <el-input
                  v-model="form.sysDeviceRtsp"
                  placeholder="请输入推流地址"
                  type="textarea"
                  :rows="3"
                  class="rtsp-input"
                >
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="主码流编码" prop="sysDeviceMainSubtype">
                <el-input
                  v-model="form.sysDeviceMainSubtype"
                  placeholder="请输入主码流编码"
                >
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="子码流编码" prop="sysDeviceSubSubtype">
                <el-input
                  v-model="form.sysDeviceSubSubtype"
                  placeholder="请输入子码流编码"
                >
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="webtrc地址" prop="sysDeviceRtspWebrtc">
                <el-input
                  v-model="form.sysDeviceRtspWebrtc"
                  placeholder="请输入webrtc地址"
                >
                </el-input>
                <div class="form-help">用于解析rtsp流，支持浏览器播放</div>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="位置" prop="sysDevicePosition">
                <el-input
                  v-model="form.sysDevicePosition"
                  placeholder="请输入设备安装位置"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:map-marker" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="版本号" prop="sysDeviceVersion">
                <el-input
                  v-model="form.sysDeviceVersion"
                  placeholder="请输入设备版本号"
                />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="所属编码" prop="sysDeviceOwner">
                <el-input
                  v-model="form.sysDeviceOwner"
                  placeholder="请输入所属者唯一编码"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取 消</el-button>
          <el-button
            v-if="mode != 'show'"
            type="primary"
            :loading="loading"
            @click="submit()"
            >保 存</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>
