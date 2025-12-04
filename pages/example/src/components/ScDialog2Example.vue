<template>
  <div class="example-page sc-dialog2-example">
    <el-row :gutter="20">
      <!-- 左侧配置面板 -->
      <el-col :span="8">
        <div class="config-panel">
          <h3>自定义对话框配置</h3>
          <el-form label-position="top" :model="config">
            <!-- 基础设置 -->
            <el-divider content-position="left">基础设置</el-divider>
            <el-form-item label="标题">
              <el-input v-model="config.title" placeholder="请输入对话框标题" />
            </el-form-item>

            <el-form-item label="宽度">
              <el-input-number
                v-model="config.width"
                :min="300"
                :max="1200"
                :step="50"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="类型">
              <el-radio-group v-model="config.type">
                <el-radio label="default">默认</el-radio>
                <el-radio label="info">信息</el-radio>
                <el-radio label="success">成功</el-radio>
                <el-radio label="warning">警告</el-radio>
                <el-radio label="error">错误</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 图标设置 -->
            <el-divider content-position="left">图标设置</el-divider>
            <el-form-item label="图标">
              <el-input v-model="config.icon" placeholder="如 ep:setting" />
            </el-form-item>
            <el-form-item v-if="config.icon" label="图标模式">
              <el-radio-group v-model="config.iconMode">
                <el-radio label="inline">标题左侧</el-radio>
                <el-radio label="float">顶部浮动</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="config.icon" label="图标大小">
              <el-input-number
                v-model="config.iconSize"
                :min="16"
                :max="48"
                :step="4"
                style="width: 100%"
              />
            </el-form-item>

            <!-- 功能设置 -->
            <el-divider content-position="left">功能设置</el-divider>
            <el-form-item>
              <el-switch
                v-model="config.draggable"
                active-text="允许拖拽"
                class="mb-2 block"
              />
              <el-switch
                v-model="config.resizable"
                active-text="允许缩放"
                class="mb-2 block"
              />
              <el-switch
                v-model="config.modal"
                active-text="显示遮罩"
                class="mb-2 block"
              />
              <el-switch
                v-model="config.showClose"
                active-text="显示关闭按钮"
                class="mb-2 block"
              />
              <el-switch
                v-model="config.showMinimize"
                active-text="显示最小化按钮"
                class="mb-2 block"
              />
              <el-switch
                v-model="config.showMaximize"
                active-text="显示最大化按钮"
                class="mb-2 block"
              />
            </el-form-item>

            <!-- 边缘吸附 -->
            <el-divider content-position="left">边缘吸附</el-divider>
            <el-form-item>
              <el-switch
                v-model="config.edgeDock"
                active-text="启用边缘吸附"
                class="mb-2 block"
              />
            </el-form-item>
            <el-form-item v-if="config.edgeDock" label="吸附阈值">
              <el-input-number
                v-model="config.edgeThreshold"
                :min="20"
                :max="100"
                :step="10"
                style="width: 100%"
              />
            </el-form-item>

            <!-- 任务栏设置 -->
            <el-divider content-position="left">任务栏设置</el-divider>
            <el-form-item>
              <el-switch
                v-model="config.useTaskbar"
                active-text="启用任务栏"
                class="mb-2 block"
              />
            </el-form-item>
            <template v-if="config.useTaskbar">
              <el-form-item label="分组标识">
                <el-input
                  v-model="config.group"
                  placeholder="同分组可合并显示"
                />
              </el-form-item>
              <el-form-item label="任务栏位置">
                <el-select v-model="taskbarConfig.position" style="width: 100%">
                  <el-option label="底部" value="bottom" />
                  <el-option label="顶部" value="top" />
                  <el-option label="左侧" value="left" />
                  <el-option label="右侧" value="right" />
                </el-select>
              </el-form-item>
              <el-form-item label="任务栏高度">
                <el-input-number
                  v-model="taskbarConfig.height"
                  :min="32"
                  :max="80"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item>
                <el-switch
                  v-model="taskbarConfig.alwaysVisible"
                  active-text="永久显示"
                  class="mb-2 block"
                />
                <el-switch
                  v-model="taskbarConfig.groupCollapse"
                  active-text="分组合并"
                  class="mb-2 block"
                />
              </el-form-item>
            </template>

            <el-button
              type="primary"
              @click="dialogVisible = true"
              style="width: 100%; margin-top: 16px"
            >
              打开对话框
            </el-button>
          </el-form>

          <!-- 代码示例 -->
          <div class="code-section">
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
      </el-col>

      <!-- 右侧预览区 -->
      <el-col :span="16">
        <div class="preview-panel">
          <h3>实时预览</h3>
          <p class="example-desc">
            通过左侧配置面板调整对话框属性，点击"打开对话框"按钮查看效果
          </p>

          <!-- 多对话框示例 -->
          <div v-if="config.useTaskbar" class="taskbar-demo">
            <h4>任务栏多窗口示例</h4>
            <p class="demo-desc">
              点击按钮打开多个对话框，然后点击最小化按钮查看任务栏效果
            </p>
            <div class="demo-buttons">
              <el-button type="primary" @click="dialog1Visible = true">
                <IconifyIconOnline icon="ep:setting" class="mr-1" />
                系统设置
              </el-button>
              <el-button type="success" @click="dialog2Visible = true">
                <IconifyIconOnline icon="ep:user" class="mr-1" />
                用户管理
              </el-button>
              <el-button type="warning" @click="dialog3Visible = true">
                <IconifyIconOnline icon="ep:document" class="mr-1" />
                文档编辑
              </el-button>
            </div>
          </div>

          <!-- 功能说明 -->
          <div class="feature-list">
            <h4>功能特性</h4>
            <ul>
              <li><strong>拖拽移动</strong>：通过头部拖拽移动对话框位置</li>
              <li><strong>边缘缩放</strong>：拖动边缘调整对话框大小</li>
              <li><strong>边缘吸附</strong>：拖到屏幕边缘自动最小化</li>
              <li>
                <strong>任务栏模式</strong>：最小化后显示在任务栏，支持分组合并
              </li>
              <li>
                <strong>多对话框管理</strong
                >：支持多个对话框同时打开，自动层级管理
              </li>
            </ul>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 任务栏组件 -->
    <ScDialogTaskbar
      v-if="config.useTaskbar"
      :enabled="config.useTaskbar"
      :position="taskbarConfig.position"
      :height="taskbarConfig.height"
      :always-visible="taskbarConfig.alwaysVisible"
      :group-collapse="taskbarConfig.groupCollapse"
    />

    <!-- 主对话框 -->
    <ScDialog
      v-model="dialogVisible"
      :title="config.title"
      :width="config.width"
      :type="config.type"
      :icon="config.icon"
      :icon-mode="config.iconMode"
      :icon-size="config.iconSize"
      :draggable="config.draggable"
      :resizable="config.resizable"
      :modal="config.modal"
      :show-close="config.showClose"
      :show-minimize="config.showMinimize"
      :show-maximize="config.showMaximize"
      :edge-dock="config.edgeDock"
      :edge-threshold="config.edgeThreshold"
      :use-taskbar="config.useTaskbar"
      :group="config.group"
      mode="custom"
    >
      <div class="dialog-content">
        <p>这是一个自定义模式的对话框示例。</p>
        <p>当前配置：</p>
        <ul>
          <li>类型：{{ config.type }}</li>
          <li>宽度：{{ config.width }}px</li>
          <li>可拖拽：{{ config.draggable ? "是" : "否" }}</li>
          <li>可缩放：{{ config.resizable ? "是" : "否" }}</li>
          <li v-if="config.useTaskbar">任务栏模式：已启用</li>
        </ul>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false"
          >确定</el-button
        >
      </template>
    </ScDialog>

    <!-- 任务栏示例对话框 -->
    <ScDialog
      v-model="dialog1Visible"
      title="系统设置"
      :width="450"
      type="info"
      icon="ep:setting"
      mode="custom"
      :use-taskbar="true"
      group="系统"
    >
      <div class="dialog-content">
        <p>这是系统设置对话框，与"用户管理"同属"系统"分组。</p>
        <p>点击最小化按钮可收缩到任务栏。</p>
      </div>
    </ScDialog>

    <ScDialog
      v-model="dialog2Visible"
      title="用户管理"
      :width="450"
      type="success"
      icon="ep:user"
      mode="custom"
      :use-taskbar="true"
      group="系统"
    >
      <div class="dialog-content">
        <p>这是用户管理对话框，与"系统设置"同属"系统"分组。</p>
        <p>开启分组合并后，同分组的窗口会合并显示。</p>
      </div>
    </ScDialog>

    <ScDialog
      v-model="dialog3Visible"
      title="文档编辑"
      :width="450"
      type="warning"
      icon="ep:document"
      mode="custom"
      :use-taskbar="true"
      group="编辑器"
    >
      <div class="dialog-content">
        <p>这是文档编辑对话框，属于"编辑器"分组。</p>
        <p>不同分组的窗口会独立显示在任务栏。</p>
      </div>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * ScDialog 自定义模式示例
 * 展示拖拽、缩放、任务栏等高级功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-04
 */
import { ref, reactive, computed } from "vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScDialogTaskbar from "@repo/components/ScDialog/src/ScDialogTaskbar.vue";
import CodePreview from "./CodePreview.vue";

// 对话框配置
const config = reactive({
  title: "自定义对话框",
  width: 500,
  type: "default" as const,
  icon: "ep:setting",
  iconMode: "float" as const,
  iconSize: 24,
  draggable: true,
  resizable: true,
  modal: true,
  showClose: true,
  showMinimize: true,
  showMaximize: true,
  edgeDock: true,
  edgeThreshold: 50,
  useTaskbar: false,
  group: "",
});

// 任务栏配置
const taskbarConfig = reactive({
  position: "bottom" as const,
  height: 48,
  alwaysVisible: true,
  groupCollapse: true,
});

// 对话框显示状态
const dialogVisible = ref(false);
const dialog1Visible = ref(false);
const dialog2Visible = ref(false);
const dialog3Visible = ref(false);

// 生成代码示例
const generatedCode = computed(() => {
  let code = "";

  // 任务栏组件
  if (config.useTaskbar) {
    code += `<ScDialogTaskbar
  :enabled="true"
  position="${taskbarConfig.position}"
  :height="${taskbarConfig.height}"
  :always-visible="${taskbarConfig.alwaysVisible}"
  :group-collapse="${taskbarConfig.groupCollapse}"
/>

`;
  }

  // 对话框组件
  code += `<ScDialog
  v-model="dialogVisible"
  title="${config.title}"
  :width="${config.width}"
  mode="custom"`;

  if (config.type !== "default") {
    code += `\n  type="${config.type}"`;
  }
  if (config.icon) {
    code += `\n  icon="${config.icon}"`;
    code += `\n  icon-mode="${config.iconMode}"`;
    if (config.iconSize !== 24) {
      code += `\n  :icon-size="${config.iconSize}"`;
    }
  }
  if (!config.draggable) {
    code += `\n  :draggable="false"`;
  }
  if (config.resizable) {
    code += `\n  resizable`;
  }
  if (!config.modal) {
    code += `\n  :modal="false"`;
  }
  if (!config.showClose) {
    code += `\n  :show-close="false"`;
  }
  if (!config.showMinimize) {
    code += `\n  :show-minimize="false"`;
  }
  if (!config.showMaximize) {
    code += `\n  :show-maximize="false"`;
  }
  if (!config.edgeDock) {
    code += `\n  :edge-dock="false"`;
  } else if (config.edgeThreshold !== 50) {
    code += `\n  :edge-threshold="${config.edgeThreshold}"`;
  }
  if (config.useTaskbar) {
    code += `\n  :use-taskbar="true"`;
    if (config.group) {
      code += `\n  group="${config.group}"`;
    }
  }

  code += `
>
  <p>对话框内容</p>
</ScDialog>`;

  return code;
});
</script>

<style lang="scss" scoped>
.sc-dialog2-example {
  padding: 16px;

  .config-panel {
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 16px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .el-divider {
      margin: 16px 0 12px 0;
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
    min-height: 400px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 8px 0;
    }

    .example-desc {
      color: var(--el-text-color-secondary);
      font-size: 14px;
      margin-bottom: 16px;
    }
  }

  .taskbar-demo {
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    margin-bottom: 16px;

    h4 {
      margin: 0 0 8px 0;
    }

    .demo-desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
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

  .feature-list {
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;

    h4 {
      margin: 0 0 12px 0;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 8px;
        line-height: 1.5;
        color: var(--el-text-color-regular);

        strong {
          color: var(--el-text-color-primary);
        }
      }
    }
  }

  .code-section {
    margin-top: 16px;
  }

  .dialog-content {
    padding: 16px;

    p {
      margin: 0 0 8px 0;
      line-height: 1.6;
    }

    ul {
      margin: 8px 0;
      padding-left: 20px;

      li {
        margin-bottom: 4px;
      }
    }
  }
}
</style>
