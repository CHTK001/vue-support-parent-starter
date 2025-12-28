<script>
import { fetchListDictItem } from "@repo/core";
import { fetchSaveSfc, fetchUpdateSfc } from "@repo/core";
import { defineAsyncComponent } from "vue";

import { IconSelect } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import { clearObject } from "@repo/config";
import { debounce } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScFormTable from "@repo/components/ScFormTable/index.vue";
const ScCodeEditor = defineAsyncComponent(() => import("@repo/components/ScCodeEditor/index.vue"));
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
        sysSfcName: [{ required: true, message: "请输入组件名称", trigger: "blur" }],
        sysSfcChineseName: [{ required: true, message: "请输入组件中文名称", trigger: "blur" }],
        sysSfcFunction: [{ required: true, message: "请选择组件功能", trigger: "blur" }],
        sysSfcCategory: [{ required: true, message: "请选择分类", trigger: "blur" }],
        sysSfcIcon: [{ required: true, message: "请选择组件图标", trigger: "blur" }],
        sysSfcVersion: [{ required: true, message: "请输入版本号", trigger: "blur" }],
        sysSfcType: [{ required: true, message: "请选择组件类型", trigger: "blur" }],
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
        this.form.sysSfcCategory = this.form.sysSfcCategory && this.form.sysSfcCategory.length > 0 ? this.form.sysSfcCategory?.split(",") : [];
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
            <el-icon class="header-icon" :size="24">
              <component :is="useRenderIcon(mode === 'save' ? 'ri:add-circle-line' : 'ri:edit-line')" />
            </el-icon>
            <span :id="titleId" :class="titleClass">{{ title }}</span>
          </div>
          <el-tag v-if="form.sysSfcId" type="info" size="small">ID: {{ form.sysSfcId }}</el-tag>
        </div>
      </template>

      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px" class="sfc-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><component :is="useRenderIcon('ri:information-line')" /></el-icon>
            <span>基本信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="组件名称" prop="sysSfcName">
                <el-input 
                  v-model="form.sysSfcName" 
                  placeholder="请输入组件名称（英文）" 
                  :prefix-icon="useRenderIcon('ri:code-s-slash-line')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="中文名称" prop="sysSfcChineseName">
                <el-input 
                  v-model="form.sysSfcChineseName" 
                  placeholder="请输入组件中文名称" 
                  :prefix-icon="useRenderIcon('ri:translate')"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="组件图标" prop="sysSfcIcon">
                <IconSelect v-model="form.sysSfcIcon" class="w-full" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="版本号" prop="sysSfcVersion">
                <el-input 
                  v-model="form.sysSfcVersion" 
                  placeholder="如：1.0.0" 
                  :prefix-icon="useRenderIcon('ri:price-tag-3-line')"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 分类与功能 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><component :is="useRenderIcon('ri:folder-3-line')" /></el-icon>
            <span>分类与功能</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="组件分类" prop="sysSfcCategory">
                <el-select 
                  v-model="form.sysSfcCategory" 
                  placeholder="请选择分类" 
                  filterable 
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  class="w-full"
                >
                  <el-option v-for="item in sysSfcCategoryCollection" :key="item.value" :label="item.label" :value="item.value">
                    <span>{{ item.label }}</span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="组件功能" prop="sysSfcFunction">
                <el-select 
                  v-model="form.sysSfcFunction" 
                  placeholder="请选择组件功能" 
                  filterable 
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  class="w-full"
                >
                  <el-option v-for="item in dictItem" :key="item.sysDictItemName" :label="item.sysDictItemName" :value="item.sysDictItemName" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 组件配置 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><component :is="useRenderIcon('ri:settings-3-line')" /></el-icon>
            <span>组件配置</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="组件类型" prop="sysSfcType">
                <el-radio-group v-model="form.sysSfcType" class="type-radio-group">
                  <el-radio-button 
                    v-for="item in menuTypeOptions" 
                    :key="item.value" 
                    :value="item.value"
                    class="type-radio-item"
                  >
                    <el-icon class="mr-1">
                      <component :is="useRenderIcon(
                        item.value === 0 ? 'ri:file-code-line' : 
                        item.value === 1 ? 'ri:code-box-line' : 
                        item.value === 2 ? 'ri:cloud-line' : 'ri:hard-drive-2-line'
                      )" />
                    </el-icon>
                    {{ item.label }}
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>

            <!-- 代码式组件 -->
            <el-col v-if="form.sysSfcType === 1" :span="24">
              <el-form-item label="组件代码" prop="sysSfcContent">
                <template #label>
                  <div class="code-label">
                    <span>组件代码</span>
                    <el-button type="primary" link size="small" @click="handlePreview">
                      <el-icon class="mr-1"><component :is="useRenderIcon('ri:fullscreen-line')" /></el-icon>
                      全屏编辑
                    </el-button>
                  </div>
                </template>
                <sc-code-editor v-model="form.sysSfcContent" style="width: 100%" :options="options" mode="vue" />
              </el-form-item>
            </el-col>

            <!-- 远程/本地地址 -->
            <el-col v-if="form.sysSfcType === 2 || form.sysSfcType === 3" :span="24">
              <el-form-item :label="form.sysSfcType === 2 ? '远程地址' : '本地路径'" prop="sysSfcPath">
                <el-input 
                  v-model="form.sysSfcPath" 
                  :placeholder="form.sysSfcType === 2 ? '请输入远程文件URL' : '请输入本地文件路径'" 
                  :prefix-icon="useRenderIcon(form.sysSfcType === 2 ? 'ri:link' : 'ri:folder-open-line')"
                />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="代理服务">
                <el-input 
                  v-model="form.sysSfcProxy" 
                  placeholder="可选，填写代理地址" 
                  :prefix-icon="useRenderIcon('ri:server-line')"
                />
              </el-form-item>
            </el-col>

            <el-col v-if="form.sysSfcDelay || mode === 'edit'" :span="6">
              <el-form-item label="延迟加载">
                <el-input-number v-model="form.sysSfcDelay" :min="0" :max="10000" placeholder="毫秒" controls-position="right" />
              </el-form-item>
            </el-col>

            <el-col v-if="form.sysSfcTimeout || mode === 'edit'" :span="6">
              <el-form-item label="超时时间">
                <el-input-number v-model="form.sysSfcTimeout" :min="0" :max="60000" placeholder="毫秒" controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 描述信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon><component :is="useRenderIcon('ri:file-text-line')" /></el-icon>
            <span>描述信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="组件描述" prop="sysSfcDesc">
                <el-input 
                  v-model="form.sysSfcDesc" 
                  placeholder="请输入组件功能描述..." 
                  type="textarea" 
                  :rows="3"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">
            <el-icon class="mr-1"><component :is="useRenderIcon('ep:close')" /></el-icon>
            取消
          </el-button>
          <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="debounce(submit(), 1000, true)">
            <el-icon class="mr-1"><component :is="useRenderIcon('ep:check')" /></el-icon>
            {{ loading ? '保存中...' : '保存' }}
          </el-button>
        </div>
      </template>
    </sc-dialog>

    <CodeLayout v-if="visibleCodeLayout" ref="codeLayoutRef" @updateValue="handleUpdateValue" />
  </div>
</template>

<style lang="scss" scoped>
.sfc-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
  }

  :deep(.el-dialog__body) {
    padding: 20px;
    max-height: 70vh;
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
    align-items: center;
    gap: 10px;

    .header-icon {
      color: var(--el-color-primary);
    }
  }
}

.sfc-form {
  .form-section {
    margin-bottom: 24px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
        font-size: 18px;
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
      border-radius: 8px !important;
      border: 1px solid var(--el-border-color) !important;
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
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .sfc-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.15) 0%, var(--el-bg-color-overlay) 100%);
    }
  }

  .sfc-form .form-section {
    background: var(--el-fill-color);
  }
}
</style>
