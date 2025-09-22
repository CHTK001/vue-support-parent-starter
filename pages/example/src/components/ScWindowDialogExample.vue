<template>
  <div class="sc-window-dialog-example">
    <!-- 基础功能演示 -->
    <div class="demo-section">
      <h3 class="section-title">基础对话框功能</h3>
      <div class="demo-controls">
        <el-button type="primary" @click="showBasicDialog">
          <IconifyIconOnline icon="mdi:window-open" class="mr-1" />
          基础对话框
        </el-button>
        <el-button type="success" @click="showIconDialog">
          <IconifyIconOnline icon="mdi:check-circle" class="mr-1" />
          带图标对话框
        </el-button>
        <el-button type="warning" @click="showCustomDialog">
          <IconifyIconOnline icon="mdi:cog" class="mr-1" />
          自定义对话框
        </el-button>
        <el-button type="info" @click="showFullscreenDialog">
          <IconifyIconOnline icon="mdi:fullscreen" class="mr-1" />
          全屏对话框
        </el-button>
      </div>
    </div>

    <!-- 主题演示 -->
    <div class="demo-section">
      <h3 class="section-title">主题样式演示</h3>
      <div class="demo-controls">
        <el-button @click="showThemeDialog('default')">
          <IconifyIconOnline icon="mdi:palette" class="mr-1" />
          默认主题
        </el-button>
        <el-button type="primary" @click="showThemeDialog('primary')">
          <IconifyIconOnline icon="mdi:information" class="mr-1" />
          主要主题
        </el-button>
        <el-button type="success" @click="showThemeDialog('success')">
          <IconifyIconOnline icon="mdi:check-circle" class="mr-1" />
          成功主题
        </el-button>
        <el-button type="warning" @click="showThemeDialog('warning')">
          <IconifyIconOnline icon="mdi:alert" class="mr-1" />
          警告主题
        </el-button>
        <el-button type="danger" @click="showThemeDialog('error')">
          <IconifyIconOnline icon="mdi:close-circle" class="mr-1" />
          错误主题
        </el-button>
        <el-button type="info" @click="showThemeDialog('info')">
          <IconifyIconOnline icon="mdi:information-outline" class="mr-1" />
          信息主题
        </el-button>
      </div>
    </div>

    <!-- 高级功能演示 -->
    <div class="demo-section">
      <h3 class="section-title">高级功能演示</h3>
      <div class="demo-controls">
        <el-button @click="showDraggableDialog">
          <IconifyIconOnline icon="mdi:drag" class="mr-1" />
          可拖拽对话框
        </el-button>
        <el-button @click="showNestedDialog">
          <IconifyIconOnline icon="mdi:layers" class="mr-1" />
          嵌套对话框
        </el-button>
        <el-button @click="showFormDialog">
          <IconifyIconOnline icon="mdi:form-select" class="mr-1" />
          表单对话框
        </el-button>
        <el-button @click="showConfirmDialog">
          <IconifyIconOnline icon="mdi:help-circle" class="mr-1" />
          确认对话框
        </el-button>
      </div>
    </div>

    <!-- 新功能演示 -->
    <div class="demo-section">
      <h3 class="section-title">新功能演示</h3>
      <div class="demo-controls">
        <el-button type="primary" @click="showMultipleDialogs">
          <IconifyIconOnline icon="mdi:window-maximize" class="mr-1" />
          多弹框演示
        </el-button>
        <el-button type="success" @click="showAutoShrinkDialog">
          <IconifyIconOnline icon="mdi:arrow-collapse" class="mr-1" />
          自动收缩演示
        </el-button>
        <el-button type="warning" @click="showActivationDemo">
          <IconifyIconOnline icon="mdi:cursor-pointer" class="mr-1" />
          激活功能演示
        </el-button>
        <el-button type="info" @click="clearAllDialogs">
          <IconifyIconOnline icon="mdi:close-box-multiple" class="mr-1" />
          关闭所有弹框
        </el-button>
      </div>
      <div class="feature-description">
        <p><strong>多弹框管理：</strong>支持同时打开多个对话框，每个对话框都有唯一ID</p>
        <p><strong>激活功能：</strong>点击任意对话框会自动置顶（调整z-index）</p>
        <p><strong>自动收缩：</strong>拖拽对话框到浏览器边缘时自动收缩为64px正方形，点击可恢复</p>
      </div>
    </div>

    <!-- 配置选项 -->
    <div class="demo-section">
      <h3 class="section-title">配置选项</h3>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="对话框宽度">
            <el-select v-model="dialogWidth" placeholder="选择宽度">
              <el-option label="小 (400px)" value="400px" />
              <el-option label="中 (600px)" value="600px" />
              <el-option label="大 (800px)" value="800px" />
              <el-option label="超大 (1000px)" value="1000px" />
              <el-option label="50%" value="50%" />
              <el-option label="80%" value="80%" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="对话框位置">
            <el-select v-model="dialogTop" placeholder="选择位置">
              <el-option label="顶部 (5vh)" value="5vh" />
              <el-option label="居中 (15vh)" value="15vh" />
              <el-option label="下方 (25vh)" value="25vh" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="其他选项">
            <div class="checkbox-group">
              <el-checkbox v-model="showClose">显示关闭按钮</el-checkbox>
              <el-checkbox v-model="closeOnClickModal">点击遮罩关闭</el-checkbox>
              <el-checkbox v-model="closeOnPressEscape">ESC键关闭</el-checkbox>
              <el-checkbox v-model="lockScroll">锁定滚动</el-checkbox>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 代码示例 -->
    <div class="demo-section">
      <h3 class="section-title">代码示例</h3>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础用法" name="basic">
          <CodeDisplay :code="basicCode" language="vue" />
        </el-tab-pane>
        <el-tab-pane label="主题和图标" name="theme">
          <CodeDisplay :code="themeCode" language="vue" />
        </el-tab-pane>
        <el-tab-pane label="自定义内容" name="custom">
          <CodeDisplay :code="customCode" language="vue" />
        </el-tab-pane>
        <el-tab-pane label="高级功能" name="advanced">
          <CodeDisplay :code="advancedCode" language="vue" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 对话框实例 -->
    <!-- 基础对话框 -->
    <ScWindowDialog v-model="basicVisible" title="基础对话框" :width="600" :height="400" :top="100" :left="200">
      <p>这是一个基础的对话框示例，展示了ScWindowDialog组件的基本功能。</p>
      <p>您可以通过配置选项来调整对话框的各种属性。</p>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="basicVisible = false">取消</el-button>
          <el-button type="primary" @click="basicVisible = false">确定</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 带图标对话框 -->
    <ScWindowDialog v-model="iconVisible" title="带图标对话框" icon="mdi:check-circle" theme="success" :width="500" :height="350" :top="150" :left="250">
      <p>这个对话框展示了如何使用图标和主题功能。</p>
      <p>图标会显示在标题旁边，主题会影响对话框的整体样式。</p>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="iconVisible = false">关闭</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 自定义对话框 -->
    <ScWindowDialog v-model="customVisible" :width="700" :height="450" :top="120" :left="180">
      <template #header="{ close }">
        <div class="custom-header">
          <div class="header-left">
            <IconifyIconOnline icon="mdi:cog" />
            <div class="header-text">
              <h3>自定义标题</h3>
              <span>这是一个自定义头部的对话框</span>
            </div>
          </div>
          <el-button type="text" @click="close">
            <IconifyIconOnline icon="mdi:close" />
          </el-button>
        </div>
      </template>

      <div class="custom-content">
        <p>这个对话框展示了如何自定义头部和底部内容。</p>
        <p>您可以完全控制对话框的外观和交互方式。</p>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="customVisible = false">取消</el-button>
          <el-button type="primary" @click="customVisible = false">保存</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 全屏对话框 -->
    <ScWindowDialog v-model="fullscreenVisible" title="全屏对话框" :width="800" :height="600" :top="50" :left="100">
      <div style="padding: 20px; text-align: center">
        <h2>全屏模式</h2>
        <p>这是一个全屏显示的对话框，适合展示大量内容或复杂的界面。</p>
        <p>在全屏模式下，对话框会占据整个屏幕空间。</p>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="fullscreenVisible = false">关闭</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 主题对话框 -->
    <ScWindowDialog v-model="themeVisible" :title="themeDialogTitle" :icon="themeDialogIcon" :theme="currentTheme" :width="500" :height="350" :top="200" :left="300">
      <div style="text-align: center; padding: 20px">
        <IconifyIconOnline :icon="themeDialogIcon" style="font-size: 48px; margin-bottom: 16px" />
        <p>{{ themeDialogDescription }}</p>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="themeVisible = false">关闭</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 可拖拽对话框 -->
    <ScWindowDialog v-model="draggableVisible" title="可拖拽对话框" :draggable="true" :width="600" :height="400" :top="100" :left="150">
      <p>这个对话框支持拖拽功能，您可以通过拖拽标题栏来移动对话框位置。</p>
      <p>拖拽功能让用户可以更灵活地管理对话框的位置。</p>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="draggableVisible = false">关闭</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 嵌套对话框 -->
    <ScWindowDialog v-model="nestedVisible" title="父对话框" :width="600" :height="400" :top="80" :left="120">
      <p>这是父对话框，点击下面的按钮可以打开子对话框。</p>
      <el-button type="primary" @click="nestedChildVisible = true">打开子对话框</el-button>

      <!-- 子对话框 -->
      <ScWindowDialog v-model="nestedChildVisible" title="子对话框" :width="400" :height="300" :top="150" :left="250">
        <p>这是嵌套的子对话框，它会显示在父对话框之上。</p>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="nestedChildVisible = false">关闭</el-button>
          </div>
        </template>
      </ScWindowDialog>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="nestedVisible = false">关闭</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 表单对话框 -->
    <ScWindowDialog v-model="formVisible" title="表单对话框" :width="600" :height="500" :top="60" :left="200">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="formData.age" :min="1" :max="120" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="爱好">
          <el-checkbox-group v-model="formData.hobbies">
            <el-checkbox label="reading">阅读</el-checkbox>
            <el-checkbox label="music">音乐</el-checkbox>
            <el-checkbox label="sports">运动</el-checkbox>
            <el-checkbox label="travel">旅行</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">提交</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 确认对话框 -->
    <ScWindowDialog v-model="confirmVisible" title="确认操作" icon="mdi:help-circle" theme="warning" :width="400" :height="250" :top="200" :left="350">
      <div style="text-align: center; padding: 20px">
        <IconifyIconOnline icon="mdi:help-circle" style="font-size: 48px; color: #e6a23c; margin-bottom: 16px" />
        <p>您确定要执行此操作吗？</p>
        <p style="color: var(--el-text-color-primary); font-size: 14px">此操作不可撤销，请谨慎操作。</p>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="confirmVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确认</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 多弹框演示 -->
    <ScWindowDialog v-for="dialog in multipleDialogs" :key="dialog.id" v-model="dialog.visible" :title="dialog.title" :dialog-id="dialog.id" :draggable="true" :width="400" :height="300" :top="dialog.top" :left="dialog.left" @close="removeDialog(dialog.id)">
      <p>{{ dialog.content }}</p>
      <p>对话框ID: {{ dialog.id }}</p>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="removeDialog(dialog.id)">关闭</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 自动收缩演示 -->
    <ScWindowDialog v-model="autoShrinkVisible" title="自动收缩对话框" dialog-id="auto-shrink-dialog" :draggable="true" :auto-shrink="true" :width="500" :height="400" :top="100" :left="300">
      <div style="padding: 20px">
        <h4>自动收缩功能演示</h4>
        <p>请拖拽此对话框到浏览器窗口的边缘（距离边缘小于20px），对话框会自动收缩为64x64px的小方块。</p>
        <p>收缩后点击小方块可以恢复到原始大小。</p>
        <p>这个功能特别适合需要长时间保持打开但不占用太多屏幕空间的对话框。</p>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="autoShrinkVisible = false">关闭</el-button>
        </div>
      </template>
    </ScWindowDialog>

    <!-- 激活功能演示 -->
    <ScWindowDialog v-model="activationDemoVisible" title="激活功能演示" dialog-id="activation-demo" draggable width="450px">
      <div style="padding: 20px">
        <h4>激活功能说明</h4>
        <p>当页面上有多个对话框时，点击任意对话框都会自动将其置顶显示。</p>
        <p>这通过动态调整z-index实现，确保用户当前操作的对话框始终在最前面。</p>
        <p>请先打开"多弹框演示"，然后点击不同的对话框观察效果。</p>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="activationDemoVisible = false">关闭</el-button>
        </div>
      </template>
    </ScWindowDialog>
  </div>
</template>

<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScWindowDialog from "@repo/components/ScWindowDialog/index.vue";
import { ElMessage } from "element-plus";
import { computed, ref } from "vue";
import CodeDisplay from "./CodeDisplay.vue";

// 对话框显示状态
const basicVisible = ref(false);
const iconVisible = ref(false);
const customVisible = ref(false);
const fullscreenVisible = ref(false);
const themeVisible = ref(false);
const draggableVisible = ref(false);
const nestedVisible = ref(false);
const nestedChildVisible = ref(false);
const formVisible = ref(false);
const confirmVisible = ref(false);
const multipleDialogs = ref([]);
const autoShrinkVisible = ref(false);
const activationDemoVisible = ref(false);

// 配置选项（已移除不支持的选项）
const dialogWidth = ref(600);
const dialogHeight = ref(400);
const dialogTop = ref(100);
const dialogLeft = ref(200);

// 主题相关
const currentTheme = ref("default");
const activeTab = ref("basic");
const settingsTab = ref("basic");

// 用户设置数据
const userSettings = ref({
  username: "",
  email: "",
  language: "zh-CN",
  theme: "light",
  fontSize: 14,
  desktopNotification: true,
  emailNotification: false,
  soundNotification: true,
});

// 表单数据
const formRef = ref();
const formData = ref({
  name: "",
  age: null,
  email: "",
  phone: "",
  gender: "",
  hobbies: [],
  description: "",
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: "请输入姓名", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  age: [{ required: true, message: "请输入年龄", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  phone: [
    { required: true, message: "请输入电话号码", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" },
  ],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
};

// 主题对话框数据
const themeDialogTitle = computed(() => {
  const titles = {
    default: "默认主题",
    primary: "主要主题",
    success: "成功主题",
    warning: "警告主题",
    error: "错误主题",
    info: "信息主题",
  };
  return titles[currentTheme.value] || "默认主题";
});

const themeDialogIcon = computed(() => {
  const icons = {
    default: "mdi:palette",
    primary: "mdi:information",
    success: "mdi:check-circle",
    warning: "mdi:alert",
    error: "mdi:close-circle",
    info: "mdi:information-outline",
  };
  return icons[currentTheme.value] || "mdi:palette";
});

const themeDialogDescription = computed(() => {
  const descriptions = {
    default: "这是默认主题，提供简洁清爽的视觉体验。",
    primary: "这是主要主题，使用蓝色调，适合重要信息展示。",
    success: "这是成功主题，使用绿色调，适合成功状态提示。",
    warning: "这是警告主题，使用黄色调，适合警告信息提示。",
    error: "这是错误主题，使用红色调，适合错误信息提示。",
    info: "这是信息主题，使用灰色调，适合一般信息展示。",
  };
  return descriptions[currentTheme.value] || "主题描述";
});

// 方法
const showBasicDialog = () => {
  basicVisible.value = true;
};

const showIconDialog = () => {
  iconVisible.value = true;
  // 3秒后自动关闭
  setTimeout(() => {
    iconVisible.value = false;
  }, 3000);
};

const showCustomDialog = () => {
  customVisible.value = true;
};

const showFullscreenDialog = () => {
  fullscreenVisible.value = true;
};

const showThemeDialog = (theme) => {
  currentTheme.value = theme;
  themeVisible.value = true;
};

const showDraggableDialog = () => {
  draggableVisible.value = true;
};

const showNestedDialog = () => {
  nestedVisible.value = true;
};

const showFormDialog = () => {
  formVisible.value = true;
};

const showConfirmDialog = () => {
  confirmVisible.value = true;
};

const getThemeColor = (theme) => {
  const colors = {
    default: "#409EFF",
    primary: "#409EFF",
    success: "#67C23A",
    warning: "#E6A23C",
    error: "#F56C6C",
    info: "#909399",
  };
  return colors[theme] || "#409EFF";
};

const getThemeButtonType = (theme) => {
  const types = {
    default: "primary",
    primary: "primary",
    success: "success",
    warning: "warning",
    error: "danger",
    info: "info",
  };
  return types[theme] || "primary";
};

const resetSettings = () => {
  userSettings.value = {
    username: "",
    email: "",
    language: "zh-CN",
    theme: "light",
    fontSize: 14,
    desktopNotification: true,
    emailNotification: false,
    soundNotification: true,
  };
  ElMessage.success("设置已重置");
};

const saveSettings = () => {
  ElMessage.success("设置已保存");
  customVisible.value = false;
};

const resetForm = () => {
  formRef.value?.resetFields();
};

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      ElMessage.success("表单提交成功");
      formVisible.value = false;
    } else {
      ElMessage.error("请检查表单填写");
    }
  });
};

const handleConfirm = () => {
  ElMessage.success("删除操作已确认");
  confirmVisible.value = false;
};

const showMultipleDialogs = () => {
  // 创建3个不同的对话框
  for (let i = 1; i <= 3; i++) {
    multipleDialogs.value.push({
      id: `dialog-${Date.now()}-${i}`,
      visible: true,
      title: `对话框 ${i}`,
      content: `这是第 ${i} 个对话框，每个对话框都有独立的ID和状态管理。`,
      left: 100 + (i - 1) * 50,
      top: 100 + (i - 1) * 50,
    });
  }
};

const showAutoShrinkDialog = () => {
  autoShrinkVisible.value = true;
};

const showActivationDemo = () => {
  activationDemoVisible.value = true;
};

const clearAllDialogs = () => {
  multipleDialogs.value = [];
  autoShrinkVisible.value = false;
  activationDemoVisible.value = false;
  ElMessage.success("所有对话框已关闭");
};

const removeDialog = (id) => {
  const index = multipleDialogs.value.findIndex((dialog) => dialog.id === id);
  if (index > -1) {
    multipleDialogs.value.splice(index, 1);
  }
};

// 代码示例
const basicCode = `<template>
  <div>
    <el-button @click="visible = true">打开对话框</el-button>
    
    <ScWindowDialog
      v-model="visible"
      title="基础对话框"
      :width="500"
      :height="400"
      :top="100"
      :left="200"
    >
      <p>这是对话框的内容</p>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="visible = false">确定</el-button>
        </div>
      </template>
    </ScWindowDialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ScWindowDialog from '@repo/components/ScWindowDialog/index.vue'

const visible = ref(false)
<\/script>`;

const themeCode = `<template>
  <div>
    <!-- 成功主题 -->
    <ScWindowDialog
      v-model="successVisible"
      title="操作成功"
      icon="mdi:check-circle"
      theme="success"
      :width="450"
      :height="300"
      :top="150"
      :left="250"
    >
      <p>操作已成功完成！</p>
    </ScWindowDialog>
    
    <!-- 警告主题 -->
    <ScWindowDialog
      v-model="warningVisible"
      title="警告提示"
      icon="mdi:alert"
      theme="warning"
      :width="450"
      :height="300"
      :top="200"
      :left="300"
    >
      <p>请注意相关风险！</p>
    </ScWindowDialog>
    
    <!-- 错误主题 -->
    <ScWindowDialog
      v-model="errorVisible"
      title="操作失败"
      icon="mdi:close-circle"
      theme="danger"
      :width="450"
      :height="300"
      :top="250"
      :left="350"
    >
      <p>操作失败，请重试！</p>
    </ScWindowDialog>
  </div>
</template>`;

const customCode = `<template>
  <ScWindowDialog
    v-model="visible"
    :width="600"
    :height="450"
    :top="120"
    :left="180"
  >
    <!-- 自定义头部 -->
    <template #header="{ close }">
      <div class="custom-header">
        <div class="header-left">
          <IconifyIconOnline icon="mdi:cog" />
          <div class="header-text">
            <h3>自定义标题</h3>
            <span>副标题信息</span>
          </div>
        </div>
        <el-button type="text" @click="close">
          <IconifyIconOnline icon="mdi:close" />
        </el-button>
      </div>
    </template>
    
    <!-- 内容区域 -->
    <div class="custom-content">
      <p>自定义内容区域</p>
    </div>
    
    <!-- 自定义底部 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary">确定</el-button>
      </div>
    </template>
  </ScWindowDialog>
</template>`;

const advancedCode = `<template>
  <div>
    <!-- 可拖拽对话框 -->
    <ScWindowDialog
      v-model="draggableVisible"
      title="可拖拽对话框"
      :draggable="true"
      :width="600"
      :height="400"
      :top="100"
      :left="150"
    >
      <p>这个对话框支持拖拽功能</p>
    </ScWindowDialog>
    
    <!-- 可调整大小的对话框 -->
    <ScWindowDialog
      v-model="resizableVisible"
      title="可调整大小对话框"
      :draggable="true"
      :resizable="true"
      :width="500"
      :height="400"
      :min-width="300"
      :min-height="200"
      :top="150"
      :left="200"
    >
      <p>这个对话框支持拖拽和调整大小功能</p>
    </ScWindowDialog>
    
    <!-- 自动收缩对话框 -->
    <ScWindowDialog
      v-model="autoShrinkVisible"
      title="自动收缩对话框"
      :draggable="true"
      :auto-shrink="true"
      :width="500"
      :height="400"
      :top="100"
      :left="300"
    >
      <p>拖拽到边缘时会自动收缩</p>
    </ScWindowDialog>
  </div>
</template>`;
</script>

<style scoped>
.sc-window-dialog-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.demo-section {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.demo-controls .el-button {
  margin: 0;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-text span {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.custom-content {
  padding: 20px 0;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mr-1 {
  margin-right: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.ml-4 {
  margin-left: 16px;
}

.feature-description {
  margin-top: 16px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.feature-description p {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.feature-description strong {
  color: #409eff;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-window-dialog-example {
    padding: 10px;
  }

  .demo-section {
    padding: 15px;
  }

  .demo-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .demo-controls .el-button {
    width: 100%;
  }
}
</style>
