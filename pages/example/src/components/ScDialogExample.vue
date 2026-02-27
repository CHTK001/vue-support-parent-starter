<template>
  <div class="example-page sc-dialog-example">
    <ScRow :gutter="20">
      <ScCol :span="8">
        <div class="config-panel">
          <h3>配置面板</h3>
          <ScForm label-position="top" :model="config">
            <ScFormItem label="标题">
              <ScInput 
                v-model="config.title"
                placeholder="请输入对话框标题"
              ></ScInput>
            </ScFormItem>

            <ScFormItem label="宽度">
              <ScInputNumber 
                v-model="config.width"
                :min="300"
                :max="1200"
                :step="50"
                style="width: 100%"
              ></ScInputNumber>
            </ScFormItem>

            <ScFormItem label="位置(top)">
              <ScInput 
                v-model="config.top"
                placeholder="请输入对话框距顶部位置"
              ></ScInput>
            </ScFormItem>

            <ScFormItem label="样式">
              <ScSelect
                v-model="config.customClass"
                layout="card"
                :options="styleOptions"
                :gap="6"
                width="90px"
              />
            </ScFormItem>

            <ScFormItem label="模式">
              <ScSelect
                v-model="config.mode"
                layout="card"
                :options="modeOptions"
                :gap="6"
                width="100px"
              />
            </ScFormItem>

            <ScFormItem label="缩放" v-if="config.mode === 'custom'">
              <ScSwitch 
                v-model="config.resizable"
                active-text="允许缩放"
                class="mb-2 block"
              ></ScSwitch>
            </ScFormItem>

            <ScFormItem label="边缘吸附" v-if="config.mode === 'custom'">
              <ScSwitch 
                v-model="config.edgeDock"
                active-text="启用边缘吸附"
                class="mb-2 block"
              ></ScSwitch>
              <ScInputNumber 
                v-if="config.edgeDock"
                v-model="config.edgeThreshold"
                :min="20"
                :max="100"
                :step="10"
                style="width: 100%"
                placeholder="吸附阈值(px)"
              ></ScInputNumber>
            </ScFormItem>

            <ScFormItem label="任务栏模式" v-if="config.mode === 'custom'">
              <ScSwitch 
                v-model="config.useTaskbar"
                active-text="启用任务栏"
                class="mb-2 block"
              ></ScSwitch>
              <template v-if="config.useTaskbar">
                <ScInput 
                  v-model="config.group"
                  placeholder="分组标识（可选）"
                  class="mb-2"
                ></ScInput>
                <ScSelect 
                  v-model="taskbarConfig.position"
                  placeholder="任务栏位置"
                  style="width: 100%"
                  class="mb-2"
                >
                  <ScOption label="底部" value="bottom"></ScOption>
                  <ScOption label="顶部" value="top"></ScOption>
                  <ScOption label="左侧" value="left"></ScOption>
                  <ScOption label="右侧" value="right"></ScOption>
                </ScSelect>
                <ScSwitch 
                  v-model="taskbarConfig.alwaysVisible"
                  active-text="永久显示"
                  class="mb-2 block"
                ></ScSwitch>
                <ScSwitch 
                  v-model="taskbarConfig.groupCollapse"
                  active-text="分组合并"
                  class="mb-2 block"
                ></ScSwitch>
              </template>
            </ScFormItem>

            <ScFormItem label="图标设置" v-if="config.mode === 'custom'">
              <ScInput 
                v-model="config.icon"
                placeholder="图标名称，如 ep:info-filled"
                class="mb-2"
              ></ScInput>
              <ScRadioGroup 
                v-model="config.iconMode"
                class="mb-2 block"
                v-if="config.icon"
              >
                <ScRadio label="inline">标题左侧</ScRadio>
                <ScRadio label="float">顶部浮动</ScRadio>
              </ScRadioGroup>
              <ScInputNumber 
                v-if="config.icon"
                v-model="config.iconSize"
                :min="16"
                :max="48"
                :step="4"
                style="width: 100%"
                placeholder="图标大小"
              ></ScInputNumber>
            </ScFormItem>

            <ScFormItem label="对话框类型">
              <ScSelect
                v-model="config.type"
                layout="card"
                :options="typeOptions"
                :gap="6"
                width="60px"
              />
            </ScFormItem>

            <ScFormItem label="功能设置">
              <ScSwitch 
                v-model="config.fullscreen"
                active-text="全屏显示"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.modal"
                active-text="显示遮罩层"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.draggable"
                active-text="允许拖拽"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.showClose"
                active-text="显示关闭按钮"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.closeOnClickModal"
                active-text="点击遮罩关闭"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.closeOnPressEscape"
                active-text="ESC键关闭"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.lockScroll"
                active-text="锁定滚动"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.appendToBody"
                active-text="插入到body"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.destroyOnClose"
                active-text="关闭销毁内容"
                class="mb-2 block"
              ></ScSwitch>
              <ScSwitch 
                v-model="config.customHeader"
                active-text="自定义头部"
                class="mb-2 block"
              ></ScSwitch>
            </ScFormItem>

            <ScFormItem label="内容设置">
              <ScSelect
                v-model="config.contentType"
                layout="card"
                :options="contentOptions"
                :gap="6"
                width="70px"
                class="mb-2"
              />

              <template v-if="config.contentType === 'text'">
                <ScInput 
                  v-model="config.textContent"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入对话框内容"
                ></ScInput>
              </template>
            </ScFormItem>

            <ScButton 
              type="primary"
              @click="dialogVisible = true"
              style="width: 100%"
              >打开对话框</el-button
            >
          </ScForm>

          <div class="code-preview mt-4">
            <CodePreview
              :tabs="[
                {
                  key: 'code',
                  label: '代码示例',
                  icon: 'ri:code-s-slash-line',
                  language: 'vue',
                  code: generatedCode,
                },
              ]"
            />
          </div>
        </div>
      </ScCol>

      <ScCol :span="16">
        <div class="preview-panel">
          <h3>实时预览</h3>
          <p class="example-desc">
            通过左侧配置面板调整对话框属性，点击"打开对话框"按钮查看效果
          </p>

          <div class="dialog-preview">
            <div
              class="dialog-frame"
              :style="{ width: config.width + 'px' }"
              :class="{ layout: config.layout }"
            >
              <div class="dialog-header" v-if="config.layout !== 'headless'">
                <span>{{ config.title || "对话框标题" }}</span>
                <i class="el-icon-close" v-if="config.showClose"></i>
              </div>
              <div
                class="dialog-body"
                :class="{ headless: config.layout === 'headless' }"
              >
                <i
                  class="el-icon-close top-close"
                  v-if="config.layout === 'headless' && config.showClose"
                ></i>
                <template v-if="config.contentType === 'text'">
                  <p>
                    {{
                      config.textContent ||
                      "这里是对话框的内容区域，可以根据需要放置不同的组件和内容。"
                    }}
                  </p>
                </template>
                <template v-else-if="config.contentType === 'form'">
                  <div class="preview-form">
                    <div class="form-item">
                      <label>用户名</label>
                      <div class="input-box"></div>
                    </div>
                    <div class="form-item">
                      <label>邮箱</label>
                      <div class="input-box"></div>
                    </div>
                    <div class="form-item">
                      <label>部门</label>
                      <div class="select-box"></div>
                    </div>
                  </div>
                </template>
                <template v-else-if="config.contentType === 'confirm'">
                  <div class="confirm-preview">
                    <div class="icon-warning">?</div>
                    <div class="confirm-content">
                      <p class="title">确认操作</p>
                      <p class="desc">您确定要执行此操作吗？此操作不可逆。</p>
                    </div>
                  </div>
                </template>
              </div>
              <div class="dialog-footer">
                <button class="btn-cancel">取消</button>
                <button class="btn-confirm">确定</button>
              </div>
            </div>
          </div>

          <!-- 任务栏组件 -->
          <ScDialogTaskbar
            v-if="config.useTaskbar"
            :enabled="config.useTaskbar"
            :position="taskbarConfig.position"
            :height="taskbarConfig.height"
            :always-visible="taskbarConfig.alwaysVisible"
            :group-collapse="taskbarConfig.groupCollapse"
            :auto-hide-delay="taskbarConfig.autoHideDelay"
          />

          <!-- 真实对话框 -->
          <ScDialog
            v-model="dialogVisible"
            :title="config.customHeader ? undefined : config.title"
            :width="config.width + 'px'"
            :top="config.top"
            :mode="config.mode"
            :type="config.type"
            :fullscreen="config.fullscreen"
            :modal="config.modal"
            :append-to-body="config.appendToBody"
            :lock-scroll="config.lockScroll"
            :custom-class="config.customClass"
            :close-on-click-modal="config.closeOnClickModal"
            :close-on-press-escape="config.closeOnPressEscape"
            :show-close="config.showClose"
            :draggable="config.draggable"
            :resizable="config.resizable"
            :destroy-on-close="config.destroyOnClose"
            :edge-dock="config.edgeDock"
            :edge-threshold="config.edgeThreshold"
            :icon="config.icon"
            :icon-mode="config.iconMode"
            :icon-size="config.iconSize"
            :use-taskbar="config.useTaskbar"
            :group="config.group"
            @open="handleDialogOpen"
            @opened="handleDialogOpened"
            @close="handleDialogClose"
            @closed="handleDialogClosed"
          >
            <template #header v-if="config.customHeader">
              <div class="custom-header">
                <div class="header-left">
                  <IconifyIconOnline
                    icon="ri:file-list-line"
                    class="header-icon"
                  />
                  <span class="header-title">{{
                    config.title || "自定义头部"
                  }}</span>
                </div>
                <ScButton 
                  type="primary"
                  text
                  circle
                  @click="dialogVisible = false"
                  v-if="config.showClose"
                >
                  <IconifyIconOnline icon="ri:close-line" />
                </ScButton>
              </div>
            </template>

            <template v-if="config.contentType === 'text'">
              <div class="dialog-content">
                <p>{{ config.textContent || "这里是对话框的内容区域" }}</p>
              </div>
            </template>

            <template v-else-if="config.contentType === 'form'">
              <ScForm :model="formData" label-width="80px">
                <ScFormItem label="用户名">
                  <ScInput 
                    v-model="formData.username"
                    placeholder="请输入用户名"
                  ></ScInput>
                </ScFormItem>
                <ScFormItem label="邮箱">
                  <ScInput 
                    v-model="formData.email"
                    placeholder="请输入邮箱"
                  ></ScInput>
                </ScFormItem>
                <ScFormItem label="部门">
                  <ScSelect 
                    v-model="formData.department"
                    placeholder="请选择部门"
                    style="width: 100%"
                  >
                    <ScOption label="市场部" value="market"></ScOption>
                    <ScOption label="技术部" value="tech"></ScOption>
                    <ScOption label="财务部" value="finance"></ScOption>
                    <ScOption label="人事部" value="hr"></ScOption>
                  </ScSelect>
                </ScFormItem>
              </ScForm>
            </template>

            <template v-else-if="config.contentType === 'confirm'">
              <div class="confirm-content">
                <IconifyIconOnline
                  icon="ri:error-warning-line"
                  class="warning-icon"
                />
                <div class="confirm-message">
                  <p class="confirm-title">确认操作</p>
                  <p class="confirm-desc">您确定要执行此操作吗？</p>
                </div>
              </div>
            </template>

            <template #footer>
              <div class="dialog-footer">
                <ScButton @click="dialogVisible = false">取消</ScButton>
                <ScButton type="primary" @click="handleConfirm"
                  >确定</el-button
                >
              </div>
            </template>
          </ScDialog>

          <!-- 任务栏模式的多对话框示例 -->
          <template v-if="config.useTaskbar">
            <div class="taskbar-demo-section">
              <h4>任务栏多对话框示例</h4>
              <p class="demo-desc">
                点击按钮打开多个对话框，然后点击最小化按钮查看任务栏效果
              </p>
              <div class="demo-buttons">
                <ScButton type="primary" @click="taskbarDialog1 = true">
                  <IconifyIconOnline icon="ep:setting" class="mr-1" />
                  系统设置
                </ScButton>
                <ScButton type="success" @click="taskbarDialog2 = true">
                  <IconifyIconOnline icon="ep:user" class="mr-1" />
                  用户管理
                </ScButton>
                <ScButton type="warning" @click="taskbarDialog3 = true">
                  <IconifyIconOnline icon="ep:document" class="mr-1" />
                  文档编辑
                </ScButton>
              </div>
            </div>

            <ScDialog
              v-model="taskbarDialog1"
              title="系统设置"
              mode="custom"
              type="info"
              icon="ep:setting"
              :use-taskbar="true"
              group="系统"
              :width="450"
            >
              <div class="demo-dialog-content">
                <p>这是系统设置对话框，点击最小化按钮可收缩到任务栏</p>
              </div>
            </ScDialog>

            <ScDialog
              v-model="taskbarDialog2"
              title="用户管理"
              mode="custom"
              type="success"
              icon="ep:user"
              :use-taskbar="true"
              group="系统"
              :width="450"
            >
              <div class="demo-dialog-content">
                <p>这是用户管理对话框，与“系统设置”同属一个分组</p>
              </div>
            </ScDialog>

            <ScDialog
              v-model="taskbarDialog3"
              title="文档编辑"
              mode="custom"
              type="warning"
              icon="ep:document"
              :use-taskbar="true"
              group="编辑器"
              :width="450"
            >
              <div class="demo-dialog-content">
                <p>这是文档编辑对话框，属于另一个分组</p>
              </div>
            </ScDialog>
          </template>
        </div>
      </ScCol>
    </ScRow>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScDialogTaskbar from "@repo/components/ScDialog/src/ScDialogTaskbar.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { message } from "@repo/utils";
import CodePreview from "./CodePreview.vue";

// 样式选项
const styleOptions = [
  { label: "默认", value: "", icon: "ri:palette-line" },
  { label: "主题色", value: "primary-border", icon: "ri:shape-line" },
  { label: "圆角", value: "rounded-dialog", icon: "ri:checkbox-blank-circle-line" },
  { label: "简约", value: "minimal-dialog", icon: "ri:subtract-line" }
];

// 模式选项
const modeOptions = [
  { label: "Element", value: "element", icon: "ri:layout-line" },
  { label: "自定义", value: "custom", icon: "ri:drag-move-line" }
];

// 类型选项
const typeOptions = [
  { label: "默认", value: "default", icon: "ri:checkbox-blank-line" },
  { label: "信息", value: "info", icon: "ri:information-line" },
  { label: "成功", value: "success", icon: "ri:checkbox-circle-line" },
  { label: "警告", value: "warning", icon: "ri:error-warning-line" },
  { label: "错误", value: "error", icon: "ri:close-circle-line" }
];

// 内容选项
const contentOptions = [
  { label: "文本", value: "text", icon: "ri:text" },
  { label: "表单", value: "form", icon: "ri:file-list-line" },
  { label: "确认", value: "confirm", icon: "ri:question-line" }
];

// 对话框配置
const config = reactive({
  title: "对话框示例",
  width: 500,
  top: "15vh",
  mode: "element", // element 或 custom
  type: "default", // default, info, success, warning, error
  fullscreen: false,
  modal: true,
  draggable: true,
  resizable: false,
  showClose: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  lockScroll: true,
  appendToBody: false,
  destroyOnClose: false,
  customClass: "",
  customHeader: false,
  contentType: "text",
  textContent: "这是一个可配置的对话框示例，您可以通过左侧面板调整各种属性。",
  // 自定义模式特有配置
  edgeDock: true,
  edgeThreshold: 50,
  icon: "",
  iconMode: "inline",
  iconSize: 24,
  // 任务栏模式配置
  useTaskbar: false,
  group: "",
});

// 任务栏配置
const taskbarConfig = reactive({
  position: "bottom",
  height: 48,
  alwaysVisible: true,
  groupCollapse: true,
  autoHideDelay: 2000,
});

// 任务栏模式的多对话框示例
const taskbarDialog1 = ref(false);
const taskbarDialog2 = ref(false);
const taskbarDialog3 = ref(false);

// 表单数据
const formData = reactive({
  username: "",
  email: "",
  department: "",
});

// 对话框显示状态
const dialogVisible = ref(false);

// 事件处理
const handleConfirm = () => {
  message("操作已确认", { type: "success" });
  dialogVisible.value = false;
};

const handleDialogOpen = () => {
  console.log("对话框打开事件触发");
};

const handleDialogOpened = () => {
  console.log("对话框打开动画结束事件触发");
};

const handleDialogClose = () => {
  console.log("对话框关闭事件触发");
};

const handleDialogClosed = () => {
  console.log("对话框关闭动画结束事件触发");
};

// 生成代码示例
const generatedCode = computed(() => {
  let code = "";

  // 任务栏组件
  if (config.mode === "custom" && config.useTaskbar) {
    code += `<ScDialogTaskbar
  :enabled="true"
  position="${taskbarConfig.position}"
  :height="${taskbarConfig.height}"
  :always-visible="${taskbarConfig.alwaysVisible}"
  :group-collapse="${taskbarConfig.groupCollapse}"
/>

`;
  }

  code += `<ScDialog
  v-model="dialogVisible"`;

  if (!config.customHeader) {
    code += `\n  title="${config.title || "对话框标题"}"`;
  }

  code += `\n  :width="${config.width}"`;
  code += `\n  mode="${config.mode}"`;

  if (config.type !== "default") {
    code += `\n  type="${config.type}"`;
  }

  if (config.top !== "15vh") {
    code += `\n  top="${config.top}"`;
  }

  if (config.fullscreen) {
    code += `\n  fullscreen`;
  }

  if (!config.modal) {
    code += `\n  :modal="false"`;
  }

  if (config.appendToBody) {
    code += `\n  append-to-body`;
  }

  if (!config.lockScroll) {
    code += `\n  :lock-scroll="false"`;
  }

  if (config.customClass) {
    code += `\n  custom-class="${config.customClass}"`;
  }

  if (!config.closeOnClickModal) {
    code += `\n  :close-on-click-modal="false"`;
  }

  if (!config.closeOnPressEscape) {
    code += `\n  :close-on-press-escape="false"`;
  }

  if (!config.showClose) {
    code += `\n  :show-close="false"`;
  }

  if (config.draggable) {
    code += `\n  draggable`;
  }

  if (config.mode === "custom" && config.resizable) {
    code += `\n  resizable`;
  }

  if (config.destroyOnClose) {
    code += `\n  destroy-on-close`;
  }

  // 自定义模式特有属性
  if (config.mode === "custom") {
    if (config.edgeDock) {
      code += `\n  edge-dock`;
      if (config.edgeThreshold !== 50) {
        code += `\n  :edge-threshold="${config.edgeThreshold}"`;
      }
    } else {
      code += `\n  :edge-dock="false"`;
    }

    if (config.icon) {
      code += `\n  icon="${config.icon}"`;
      code += `\n  icon-mode="${config.iconMode}"`;
      if (config.iconSize !== 24) {
        code += `\n  :icon-size="${config.iconSize}"`;
      }
    }

    // 任务栏模式
    if (config.useTaskbar) {
      code += `\n  :use-taskbar="true"`;
      if (config.group) {
        code += `\n  group="${config.group}"`;
      }
    }
  }

  code += `\n>`;

  // 自定义头部
  if (config.customHeader) {
    code += `\n  <template #header>
    <div class="custom-header">
      <IconifyIconOnline icon="ri:file-list-line" />
      <span>${config.title || "自定义头部"}</span>
    </div>
  </template>`;
  }

  // 内容区域
  if (config.contentType === "text") {
    code += `\n  <p>${config.textContent || "这里是对话框的内容区域"}</p>`;
  } else if (config.contentType === "form") {
    code += `\n  <ScForm :model="formData" label-width="80px">
    <ScFormItem label="用户名">
      <ScInput v-model="formData.username" />
    </ScFormItem>
    <ScFormItem label="邮箱">
      <ScInput v-model="formData.email" />
    </ScFormItem>
  </ScForm>`;
  } else if (config.contentType === "confirm") {
    code += `\n  <div style="display: flex; align-items: center; gap: 12px;">
    <IconifyIconOnline icon="ri:error-warning-line" style="font-size: 32px; color: var(--el-color-warning);" />
    <div>
      <p style="font-weight: bold; margin: 0 0 4px 0;">确认操作</p>
      <p style="margin: 0; color: var(--el-text-color-secondary);">您确定要执行此操作吗？</p>
    </div>
  </div>`;
  }

  code += `\n</ScDialog>`;

  return code;
});
</script>

<style lang="scss" scoped>
.sc-dialog-example {
  padding: 16px;

  .example-desc {
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
  }

  .config-panel {
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    padding: 16px;
    height: 100%;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    h3 {
      margin-top: 0;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e4e7ed;
    }

    .block {
      display: block;
    }

    .mb-2 {
      margin-bottom: 8px;
    }
  }

  .preview-panel {
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    padding: 16px;
    min-height: 500px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    h3 {
      margin-top: 0;
      margin-bottom: 16px;
    }
  }

  .dialog-preview {
    display: flex;
    justify-content: center;
    margin-top: 30px;

    .dialog-frame {
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      background-color: var(--el-bg-color);
      width: 500px;
      max-width: 100%;

      .dialog-header,
      .dialog-custom-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--el-border-color-light);

        span {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      .dialog-custom-header {
        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .dialog-body {
        padding: 20px;
        min-height: 120px;
        position: relative;

        &.headless {
          padding-top: 30px;
        }

        .top-close {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 16px;
          cursor: pointer;
          color: var(--el-text-color-primary);

          &:hover {
            color: var(--el-color-primary);
          }
        }

        p {
          margin: 0;
          line-height: 1.5;
        }

        .preview-form {
          .form-item {
            margin-bottom: 16px;

            label {
              display: block;
              margin-bottom: 8px;
              font-size: 14px;
              color: var(--el-text-color-regular);
            }

            .input-box,
            .select-box {
              height: 32px;
              background-color: var(--el-fill-color-light);
              border-radius: 4px;
            }
          }
        }

        .confirm-preview {
          display: flex;
          align-items: flex-start;
          gap: 16px;

          .icon-warning {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #e6a23c;
            color: var(--el-text-color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
          }

          .confirm-content {
            .title {
              font-weight: bold;
              margin-bottom: 8px;
            }

            .desc {
              color: var(--el-text-color-primary);
              font-size: 14px;
            }
          }
        }
      }

      .dialog-footer {
        padding: 10px 20px;
        border-top: 1px solid var(--el-border-color-light);
        display: flex;
        justify-content: flex-end;
        gap: 8px;

        button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;

          &.btn-cancel {
            border: 1px solid var(--el-border-color);
            background-color: var(--el-bg-color);
            color: var(--el-text-color-primary);
          }

          &.btn-confirm {
            border: none;
            background-color: var(--el-color-primary);
            color: #fff;
          }
        }
      }
    }
  }

  .code-preview {
    margin-top: 16px;

    h4 {
      margin-bottom: 8px;
    }

    .code-box {
      background-color: #1e1e1e;
      border-radius: 4px;
      padding: 12px;

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;

        code {
          font-family: Consolas, Monaco, "Andale Mono", monospace;
          font-size: 13px;
          color: #d4d4d4;
        }
      }
    }
  }

  .custom-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .header-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }

      .header-title {
        font-size: 16px;
        font-weight: bold;
      }
    }
  }

  .confirm-content {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 10px;

    .warning-icon {
      font-size: 32px;
      color: var(--el-color-warning);
    }

    .confirm-message {
      .confirm-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .confirm-desc {
        color: var(--el-text-color-primary);
        font-size: 14px;
      }
    }
  }

  .dialog-content {
    padding: 10px;

    p {
      margin-bottom: 10px;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .mt-4 {
    margin-top: 16px;
  }

  // 任务栏示例区域
  .taskbar-demo-section {
    margin-top: 24px;
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: 8px;

    h4 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }

    .demo-desc {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .demo-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .mr-1 {
        margin-right: 4px;
      }
    }
  }

  .demo-dialog-content {
    padding: 16px;

    p {
      margin: 0;
      line-height: 1.6;
      color: var(--el-text-color-regular);
    }
  }
}

:deep(.primary-border) {
  border: 2px solid var(--el-color-primary) !important;

  .el-dialog__header {
    background-color: rgba(var(--el-color-primary-rgb), 0.1);
  }
}

:deep(.rounded-dialog) {
  border-radius: 16px !important;

  .el-dialog__header {
    border-radius: 16px 16px 0 0;
  }

  .el-button {
    border-radius: 20px;
  }
}

:deep(.minimal-dialog) {
  box-shadow: none !important;
  border: none !important;
  background-color: var(--el-bg-color-overlay) !important;
  backdrop-filter: blur(10px);

  .el-dialog__header {
    border-bottom: none;
  }

  .el-dialog__footer {
    border-top: none;
  }
}

:deep(.sc-dialog--simple) {
  .el-dialog__header {
    background-color: var(--el-fill-color-light);
  }
}

:deep(.sc-dialog--headless) {
  .sc-dialog__headless-close {
    transition: all 0.3s;

    &:hover {
      transform: rotate(90deg);
    }
  }
}

/* 添加预览模式下的样式区分 */
.dialog-frame {
  &.layout-default {
    border-top: 4px solid var(--el-color-primary);

    .dialog-header {
      border-bottom: 1px solid var(--el-border-color-light);

      span {
        color: var(--el-color-primary);
      }
    }
  }

  &.layout-simple {
    border-top: none;

    .dialog-header {
      background-color: var(--el-fill-color-light);
    }
  }

  &.layout-headless {
    border-top: none;

    .dialog-header {
      display: none;
    }

    .dialog-body {
      padding-top: 30px;
    }
  }
}

/* 深色主题适配 */
html.dark {
  .sc-dialog-example {
    .config-panel,
    .preview-panel {
      background: var(--el-bg-color-overlay);
      border-color: var(--el-border-color);
    }

    .dialog-frame {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    }

    .code-box {
      background-color: #1e1e1e;
      border: 1px solid var(--el-border-color);
    }
  }
}
</style>
