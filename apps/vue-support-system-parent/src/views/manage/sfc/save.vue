<script>
import { fetchListDictItem } from "@repo/core";
import { fetchSaveSfc, fetchUpdateSfc } from "@repo/core";
import { defineAsyncComponent } from "vue";

import { IconSelect } from "@repo/components";
import { message } from "@repo/utils";
import { clearObject } from "@repo/config";
import { debounce } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import { useRenderIcon } from "@repo/components";
import ScFormTable from "@repo/components";
const ScCodeEditor = defineAsyncComponent(() => import("@repo/scCodeEditor"));
import CodeLayout from "./code.vue";
export default {
  components: { IconSelect, ScCodeEditor, CodeLayout, ScFormTable },
  props: {
    sysSecretFunctions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      form: {},
      visible: false,
      visibleCodeLayout: false,
      rules: {
        sysSfcName: [
          { required: true, message: "请输入组件名称", trigger: "blur" },
        ],
        sysSfcChineseName: [
          { required: true, message: "请输入组件中文名称", trigger: "blur" },
        ],
        sysSfcFunction: [
          { required: true, message: "请选择组件功能", trigger: "blur" },
        ],
        sysSfcCategory: [
          { required: true, message: "请选择分类", trigger: "blur" },
        ],
        sysSfcIcon: [
          { required: true, message: "请选择组件图标", trigger: "blur" },
        ],
        sysSfcVersion: [
          { required: true, message: "请输入版本号", trigger: "blur" },
        ],
        sysSfcType: [
          { required: true, message: "请选择组件类型", trigger: "blur" },
        ],
      },
      loading: false,
      title: "",
      mode: "save",
      dictItem: [],
      options: {
        col: 300,
        height: 1000,
        hintOptions: {
          completeSingle: false,
        },
      },
      env: {
        name: "",
        value: "",
      },
      profile: [],
      menuTypeOptions: [
        { label: "文件式", value: 0 },
        { label: "代码式", value: 1 },
        { label: "远程地址", value: 2 },
        { label: "本地地址", value: 3 },
      ],
      sysSfcCategoryCollection: [
        { label: "主页", value: "HOME" },
        { label: "工具", value: "TOOL" },
        { label: "图表", value: "CHART" },
        { label: "表单", value: "FORM" },
        { label: "其他", value: "OTHER" },
      ],
      t: null,
    };
  },
  mounted() {
    const { t } = useI18n();
    this.initialize();
    this.t = t;
  },
  methods: {
    useRenderIcon,
    async initialize() {
      fetchListDictItem({
        sysDictId: 5,
      }).then((res) => {
        this.dictItem = res?.data;
      });
    },
    async close() {
      this.visible = false;
      this.loading = false;
      clearObject(this.form);
    },
    setData(data) {
      Object.assign(this.form, data);
      try {
        this.profile = JSON.parse(this.form.sysSfcModelCache);
      } catch (error) {}
      if (!this.form.sysSfcCategory) {
        this.form.sysSfcCategory = [];
      } else {
        this.form.sysSfcCategory =
          this.form.sysSfcCategory && this.form.sysSfcCategory.length > 0
            ? this.form.sysSfcCategory?.split(",")
            : [];
      }
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      if (mode == "save") {
        this.form.sysSfcVersion = "1.0.0";
        this.form.sysSfcType = 0;
      }
      this.title = mode == "save" ? "新增插件" : "编辑插件";
    },
    debounce(fn, time, immediate) {
      return debounce(fn, time, immediate);
    },
    handlePreview() {
      this.visibleCodeLayout = true;
      this.$nextTick(() => {
        this.$refs.codeLayoutRef.setData(this.form);
        this.$refs.codeLayoutRef.open();
      });
    },
    handleUpdateValue(value) {
      this.form.sysSfcContent = value;
    },
    addRow() {
      this.profile.push(this.env);
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          const newForm = {};
          Object.assign(newForm, this.form);
          newForm.sysSfcModelCache = JSON.stringify(this.profile);
          if (this.mode === "save") {
            res = await fetchSaveSfc(newForm);
          } else if (this.mode === "edit") {
            res = await fetchUpdateSfc(newForm);
          }

          if (res && res.code == "00000") {
            message("保存成功", { type: "success" });
            this.$emit("success", newForm);
            this.$emit("close");
            this.visible = false;
          } else {
            message(res?.msg, { type: "error" });
          }
        }
        this.loading = false;
      });
    },
  },
};
</script>

<template>
  <div>
    <sc-dialog
      v-model="visible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      :title="title"
      width="750px"
      class="sfc-dialog"
      @close="close"
    >
      <!-- 弹窗头部 -->
      <template #header="{ titleId, titleClass }">
        <div class="dialog-header">
          <div class="header-left">
            <ScIcon class="header-icon" :size="24">
              <component
                :is="
                  useRenderIcon(
                    mode === 'save' ? 'ri:add-circle-line' : 'ri:edit-line',
                  )
                "
              />
            </ScIcon>
            <span :id="titleId" :class="titleClass">{{ title }}</span>
          </div>
          <ScTag v-if="form.sysSfcId" type="info" size="small"
            >ID: {{ form.sysSfcId }}</el-tag
          >
        </div>
      </template>

      <ScForm
        ref="dialogForm"
        :model="form"
        :rules="rules"
        :disabled="mode == 'show'"
        label-width="100px"
        class="modern-form sfc-form"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <ScIcon
              ><component :is="useRenderIcon('ri:information-line')"
            /></ScIcon>
            <span>基本信息</span>
          </div>
          <ScRow :gutter="20">
            <ScCol :span="12">
              <ScFormItem label="组件名称" prop="sysSfcName">
                <ScInput
                  v-model="form.sysSfcName"
                  placeholder="请输入组件名称（英文）"
                  :prefix-icon="useRenderIcon('ri:code-s-slash-line')"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="中文名称" prop="sysSfcChineseName">
                <ScInput
                  v-model="form.sysSfcChineseName"
                  placeholder="请输入组件中文名称"
                  :prefix-icon="useRenderIcon('ri:translate')"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="组件图标" prop="sysSfcIcon">
                <IconSelect v-model="form.sysSfcIcon" class="w-full" />
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="版本号" prop="sysSfcVersion">
                <ScInput
                  v-model="form.sysSfcVersion"
                  placeholder="如：1.0.0"
                  :prefix-icon="useRenderIcon('ri:price-tag-3-line')"
                />
              </ScFormItem>
            </ScCol>
          </ScRow>
        </div>

        <!-- 分类与功能 -->
        <div class="form-section">
          <div class="section-title">
            <ScIcon
              ><component :is="useRenderIcon('ri:folder-3-line')"
            /></ScIcon>
            <span>分类与功能</span>
          </div>
          <ScRow :gutter="20">
            <ScCol :span="12">
              <ScFormItem label="组件分类" prop="sysSfcCategory">
                <ScSelect
                  v-model="form.sysSfcCategory"
                  placeholder="请选择分类"
                  filterable
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  class="w-full"
                >
                  <ScOption
                    v-for="item in sysSfcCategoryCollection"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  >
                    <span>{{ item.label }}</span>
                  </ScOption>
                </ScSelect>
              </ScFormItem>
            </ScCol>
            <ScCol :span="12">
              <ScFormItem label="组件功能" prop="sysSfcFunction">
                <ScSelect
                  v-model="form.sysSfcFunction"
                  placeholder="请选择组件功能"
                  filterable
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  class="w-full"
                >
                  <ScOption
                    v-for="item in dictItem"
                    :key="item.sysDictItemName"
                    :label="item.sysDictItemName"
                    :value="item.sysDictItemName"
                  />
                </ScSelect>
              </ScFormItem>
            </ScCol>
          </ScRow>
        </div>

        <!-- 组件配置 -->
        <div class="form-section">
          <div class="section-title">
            <ScIcon
              ><component :is="useRenderIcon('ri:settings-3-line')"
            /></ScIcon>
            <span>组件配置</span>
          </div>
          <ScRow :gutter="20">
            <ScCol :span="24">
              <ScFormItem label="组件类型" prop="sysSfcType">
                <ScRadioGroup
                  v-model="form.sysSfcType"
                  class="type-radio-group"
                >
                  <el-radio-button
                    v-for="item in menuTypeOptions"
                    :key="item.value"
                    :value="item.value"
                    class="type-radio-item"
                  >
                    <ScIcon class="mr-1">
                      <component
                        :is="
                          useRenderIcon(
                            item.value === 0
                              ? 'ri:file-code-line'
                              : item.value === 1
                                ? 'ri:code-box-line'
                                : item.value === 2
                                  ? 'ri:cloud-line'
                                  : 'ri:hard-drive-2-line',
                          )
                        "
                      />
                    </ScIcon>
                    {{ item.label }}
                  </el-radio-button>
                </ScRadioGroup>
              </ScFormItem>
            </ScCol>

            <!-- 代码式组件 -->
            <ScCol v-if="form.sysSfcType === 1" :span="24">
              <ScFormItem label="组件代码" prop="sysSfcContent">
                <template #label>
                  <div class="code-label">
                    <span>组件代码</span>
                    <ScButton
                      type="primary"
                      link
                      size="small"
                      @click="handlePreview"
                    >
                      <ScIcon class="mr-1"
                        ><component :is="useRenderIcon('ri:fullscreen-line')"
                      /></ScIcon>
                      全屏编辑
                    </ScButton>
                  </div>
                </template>
                <sc-code-editor
                  v-model="form.sysSfcContent"
                  style="width: 100%"
                  :options="options"
                  mode="vue"
                />
              </ScFormItem>
            </ScCol>

            <!-- 远程/本地地址 -->
            <ScCol
              v-if="form.sysSfcType === 2 || form.sysSfcType === 3"
              :span="24"
            >
              <ScFormItem
                :label="form.sysSfcType === 2 ? '远程地址' : '本地路径'"
                prop="sysSfcPath"
              >
                <ScInput
                  v-model="form.sysSfcPath"
                  :placeholder="
                    form.sysSfcType === 2
                      ? '请输入远程文件URL'
                      : '请输入本地文件路径'
                  "
                  :prefix-icon="
                    useRenderIcon(
                      form.sysSfcType === 2 ? 'ri:link' : 'ri:folder-open-line',
                    )
                  "
                />
              </ScFormItem>
            </ScCol>

            <ScCol :span="12">
              <ScFormItem label="代理服务">
                <ScInput
                  v-model="form.sysSfcProxy"
                  placeholder="可选，填写代理地址"
                  :prefix-icon="useRenderIcon('ri:server-line')"
                />
              </ScFormItem>
            </ScCol>

            <ScCol v-if="form.sysSfcDelay || mode === 'edit'" :span="6">
              <ScFormItem label="延迟加载">
                <ScInputNumber
                  v-model="form.sysSfcDelay"
                  :min="0"
                  :max="10000"
                  placeholder="毫秒"
                  controls-position="right"
                />
              </ScFormItem>
            </ScCol>

            <ScCol v-if="form.sysSfcTimeout || mode === 'edit'" :span="6">
              <ScFormItem label="超时时间">
                <ScInputNumber
                  v-model="form.sysSfcTimeout"
                  :min="0"
                  :max="60000"
                  placeholder="毫秒"
                  controls-position="right"
                />
              </ScFormItem>
            </ScCol>
          </ScRow>
        </div>

        <!-- 描述信息 -->
        <div class="form-section">
          <div class="section-title">
            <ScIcon
              ><component :is="useRenderIcon('ri:file-text-line')"
            /></ScIcon>
            <span>描述信息</span>
          </div>
          <ScRow :gutter="20">
            <ScCol :span="24">
              <ScFormItem label="组件描述" prop="sysSfcDesc">
                <ScInput
                  v-model="form.sysSfcDesc"
                  placeholder="请输入组件功能描述..."
                  type="textarea"
                  :rows="3"
                  maxlength="500"
                  show-word-limit
                />
              </ScFormItem>
            </ScCol>
          </ScRow>
        </div>
      </ScForm>

      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="visible = false">
            <ScIcon class="mr-1"
              ><component :is="useRenderIcon('ep:close')"
            /></ScIcon>
            取消
          </ScButton>
          <ScButton
            v-if="mode != 'show'"
            type="primary"
            :loading="loading"
            @click="debounce(submit(), 1000, true)"
          >
            <ScIcon class="mr-1"
              ><component :is="useRenderIcon('ep:check')"
            /></ScIcon>
            {{ loading ? "保存中..." : "保存" }}
          </ScButton>
        </div>
      </template>
    </sc-dialog>

    <CodeLayout
      v-if="visibleCodeLayout"
      ref="codeLayoutRef"
      @updateValue="handleUpdateValue"
    />
  </div>
</template>

<style lang="scss" scoped>
.sfc-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    max-height: 70vh;
    padding: 20px;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-left {
    display: flex;
    gap: 10px;
    align-items: center;

    .header-icon {
      color: var(--el-color-primary);
    }
  }
}

.sfc-form {
  .form-section {
    padding: 16px;
    margin-bottom: 24px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      gap: 8px;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--el-border-color-lighter);

      .el-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  :deep(.el-input),
  :deep(.el-select) {
    transition: all 0.3s ease;

    &:focus-within {
      transform: translateY(-1px);
    }
  }

  .type-radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    :deep(.el-radio-button__inner) {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      border: 1px solid var(--el-border-color) !important;
      border-radius: 8px !important;
      box-shadow: none !important;
    }

    :deep(.el-radio-button:first-child .el-radio-button__inner),
    :deep(.el-radio-button:last-child .el-radio-button__inner) {
      border-radius: 8px !important;
    }

    :deep(.el-radio-button.is-active .el-radio-button__inner) {
      background: var(--el-color-primary);
      border-color: var(--el-color-primary) !important;
    }
  }

  .code-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;

  .el-button {
    padding: 10px 20px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .sfc-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.15) 0%,
        var(--el-bg-color-overlay) 100%
      );
    }
  }

  .sfc-form .form-section {
    background: var(--el-fill-color);
  }
}
</style>
