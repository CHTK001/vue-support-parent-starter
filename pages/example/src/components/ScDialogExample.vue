<template>
  <div class="example-page sc-dialog-example">
    <el-row :gutter="20">
      <el-col :span="8">
        <div class="config-panel">
          <h3>配置面板</h3>
          <el-form label-position="top" :model="config">
            <el-form-item label="标题">
              <el-input
                v-model="config.title"
                placeholder="请输入对话框标题"
              ></el-input>
            </el-form-item>

            <el-form-item label="宽度">
              <el-input-number
                v-model="config.width"
                :min="300"
                :max="1200"
                :step="50"
                style="width: 100%"
              ></el-input-number>
            </el-form-item>

            <el-form-item label="位置(top)">
              <el-input
                v-model="config.top"
                placeholder="请输入对话框距顶部位置"
              ></el-input>
            </el-form-item>

            <el-form-item label="样式">
              <el-select
                v-model="config.customClass"
                placeholder="请选择样式"
                style="width: 100%"
              >
                <el-option label="默认" value=""></el-option>
                <el-option
                  label="主题色边框"
                  value="primary-border"
                ></el-option>
                <el-option label="圆角风格" value="rounded-dialog"></el-option>
                <el-option label="简约风格" value="minimal-dialog"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="布局模式">
              <el-radio-group v-model="config.layout" class="mb-2 block">
                <el-radio label="default">默认布局</el-radio>
                <el-radio label="simple">简单布局</el-radio>
                <el-radio label="headless">无头部布局</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="功能设置">
              <el-switch
                v-model="config.fullscreen"
                active-text="全屏显示"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.modal"
                active-text="显示遮罩层"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.draggable"
                active-text="允许拖拽"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.showClose"
                active-text="显示关闭按钮"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.closeOnClickModal"
                active-text="点击遮罩关闭"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.closeOnPressEscape"
                active-text="ESC键关闭"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.lockScroll"
                active-text="锁定滚动"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.appendToBody"
                active-text="插入到body"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.destroyOnClose"
                active-text="关闭销毁内容"
                class="mb-2 block"
              ></el-switch>
              <el-switch
                v-model="config.customHeader"
                active-text="自定义头部"
                class="mb-2 block"
              ></el-switch>
            </el-form-item>

            <el-form-item label="内容设置">
              <el-radio-group v-model="config.contentType" class="mb-2 block">
                <el-radio label="text">文本内容</el-radio>
                <el-radio label="form">表单内容</el-radio>
                <el-radio label="confirm">确认内容</el-radio>
              </el-radio-group>

              <template v-if="config.contentType === 'text'">
                <el-input
                  v-model="config.textContent"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入对话框内容"
                ></el-input>
              </template>
            </el-form-item>

            <el-button
              type="primary"
              @click="dialogVisible = true"
              style="width: 100%"
              >打开对话框</el-button
            >
          </el-form>

          <div class="code-preview mt-4">
            <h4>代码示例：</h4>
            <div class="code-box">
              <pre class="language-html"><code>{{ generatedCode }}</code></pre>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="16">
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

          <!-- 真实对话框 -->
          <ScDialog
            v-model="dialogVisible"
            :title="config.customHeader ? undefined : config.title"
            :width="config.width + 'px'"
            :top="config.top"
            :fullscreen="config.fullscreen"
            :modal="config.modal"
            :append-to-body="config.appendToBody"
            :lock-scroll="config.lockScroll"
            :custom-class="config.customClass"
            :close-on-click-modal="config.closeOnClickModal"
            :close-on-press-escape="config.closeOnPressEscape"
            :show-close="config.showClose"
            :draggable="config.draggable"
            :destroy-on-close="config.destroyOnClose"
            :layout="config.layout"
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
                <el-button
                  type="primary"
                  text
                  circle
                  @click="dialogVisible = false"
                  v-if="config.showClose"
                >
                  <IconifyIconOnline icon="ri:close-line" />
                </el-button>
              </div>
            </template>

            <template v-if="config.contentType === 'text'">
              <div class="dialog-content">
                <p>{{ config.textContent || "这里是对话框的内容区域" }}</p>
              </div>
            </template>

            <template v-else-if="config.contentType === 'form'">
              <el-form :model="formData" label-width="80px">
                <el-form-item label="用户名">
                  <el-input
                    v-model="formData.username"
                    placeholder="请输入用户名"
                  ></el-input>
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input
                    v-model="formData.email"
                    placeholder="请输入邮箱"
                  ></el-input>
                </el-form-item>
                <el-form-item label="部门">
                  <el-select
                    v-model="formData.department"
                    placeholder="请选择部门"
                    style="width: 100%"
                  >
                    <el-option label="市场部" value="market"></el-option>
                    <el-option label="技术部" value="tech"></el-option>
                    <el-option label="财务部" value="finance"></el-option>
                    <el-option label="人事部" value="hr"></el-option>
                  </el-select>
                </el-form-item>
              </el-form>
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
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm"
                  >确定</el-button
                >
              </div>
            </template>
          </ScDialog>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import { message } from "@repo/utils";

// 对话框配置
const config = reactive({
  title: "对话框示例",
  width: 500,
  top: "15vh",
  fullscreen: false,
  modal: true,
  draggable: false,
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
  layout: "default",
});

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
  // 添加注释说明选择的布局模式
  let layoutDescription = "<!-- 使用的布局模式: ";

  switch (config.layout) {
    case "simple":
      layoutDescription +=
        "简单布局 - 直接使用Element Plus的原生对话框样式 -->";
      break;
    case "headless":
      layoutDescription += "无头部布局 - 移除标题栏，内容区域扩展 -->";
      break;
    default:
      layoutDescription += "默认布局 - 具有完整样式和功能的对话框 -->";
      break;
  }

  let code = `${layoutDescription}\n<ScDialog
  v-model="dialogVisible"`;

  if (!config.customHeader) {
    code += `\n  title="${config.title || "对话框标题"}"`;
  }

  code += `\n  width="${config.width}px"`;

  if (config.top !== "15vh") {
    code += `\n  top="${config.top}"`;
  }

  if (config.layout !== "default") {
    code += `\n  layout="${config.layout}"`;
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

  if (config.destroyOnClose) {
    code += `\n  destroy-on-close`;
  }

  code += `>`;

  // 自定义头部
  if (config.customHeader) {
    code += `\n  <template #header>
    <div class="custom-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:file-list-line" />
        <span>${config.title || "自定义头部"}</span>
      </div>
      ${
        config.showClose
          ? `<el-button type="primary" text circle @click="dialogVisible = false">
        <IconifyIconOnline icon="ri:close-line" />
      </el-button>`
          : ""
      }
    </div>
  </template>`;
  }

  // 内容区域
  if (config.contentType === "text") {
    code += `\n  <div class="dialog-content">
    <p>${config.textContent || "这里是对话框的内容区域"}</p>
  </div>`;
  } else if (config.contentType === "form") {
    code += `\n  <el-form :model="formData" label-width="80px">
    <el-form-item label="用户名">
      <el-input v-model="formData.username"></el-input>
    </el-form-item>
    <el-form-item label="邮箱">
      <el-input v-model="formData.email"></el-input>
    </el-form-item>
    <el-form-item label="部门">
      <el-select v-model="formData.department"></el-select>
    </el-form-item>
  </el-form>`;
  } else if (config.contentType === "confirm") {
    code += `\n  <div class="confirm-content">
    <IconifyIconOnline icon="ri:error-warning-line" class="warning-icon" />
    <div class="confirm-message">
      <p class="confirm-title">确认操作</p>
      <p class="confirm-desc">您确定要执行此操作吗？</p>
    </div>
  </div>`;
  }

  // 底部区域
  code += `\n  
  <template #footer>
    <div class="dialog-footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </div>
  </template>
</ScDialog>`;

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
