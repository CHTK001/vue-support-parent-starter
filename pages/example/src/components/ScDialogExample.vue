<template>
  <div class="sc-dialog-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础对话框</h3>
        <p class="example-desc">基础对话框包含标题、内容和底部按钮区域</p>

        <div class="example-buttons">
          <el-button type="primary" @click="openBasicDialog">打开基础对话框</el-button>
          <el-button type="success" @click="openFormDialog">打开表单对话框</el-button>
          <el-button type="warning" @click="openConfirmDialog">打开确认对话框</el-button>
        </div>

        <!-- 基础对话框 -->
        <ScDialog v-model="basicDialogVisible" title="基础对话框" width="500px">
          <div class="dialog-content">
            <p>这是一个基础对话框的内容区域，可以放置任何内容。</p>
            <p>支持多行文本和各种组件。</p>
          </div>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="basicDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="handleBasicConfirm">确定</el-button>
            </div>
          </template>
        </ScDialog>

        <!-- 表单对话框 -->
        <ScDialog v-model="formDialogVisible" title="表单对话框" width="600px">
          <el-form :model="formData" label-width="80px" :rules="formRules" ref="formRef">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formData.username" placeholder="请输入用户名"></el-input>
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱"></el-input>
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="formData.gender">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="部门">
              <el-select v-model="formData.department" placeholder="请选择部门">
                <el-option label="市场部" value="market"></el-option>
                <el-option label="技术部" value="tech"></el-option>
                <el-option label="财务部" value="finance"></el-option>
                <el-option label="人事部" value="hr"></el-option>
              </el-select>
            </el-form-item>
          </el-form>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="formDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="handleFormSubmit">提交</el-button>
            </div>
          </template>
        </ScDialog>

        <!-- 确认对话框 -->
        <ScDialog v-model="confirmDialogVisible" title="删除确认" width="400px">
          <div class="confirm-content">
            <IconifyIconOnline icon="ri:error-warning-line" class="warning-icon" />
            <div class="confirm-message">
              <p class="confirm-title">您确定要删除这条记录吗？</p>
              <p class="confirm-desc">删除后将无法恢复，请谨慎操作。</p>
            </div>
          </div>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="confirmDialogVisible = false">取消</el-button>
              <el-button type="danger" @click="handleConfirmDelete">确认删除</el-button>
            </div>
          </template>
        </ScDialog>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;el-button type="primary" @click="dialogVisible = true"&gt;打开对话框&lt;/el-button&gt;

&lt;ScDialog
  v-model="dialogVisible"
  title="对话框标题"
  width="500px"
&gt;
  &lt;div class="dialog-content"&gt;
    这里是对话框的内容区域
  &lt;/div&gt;
  
  &lt;template #footer&gt;
    &lt;div class="dialog-footer"&gt;
      &lt;el-button @click="dialogVisible = false"&gt;取消&lt;/el-button&gt;
      &lt;el-button type="primary" @click="handleConfirm"&gt;确定&lt;/el-button&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/ScDialog&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="高级用法">
        <h3>高级对话框</h3>
        <p class="example-desc">高级对话框可以自定义样式、拖拽、全屏等功能</p>

        <div class="example-buttons">
          <el-button type="primary" @click="openCustomDialog">自定义头部对话框</el-button>
          <el-button type="success" @click="openDraggableDialog">可拖拽对话框</el-button>
          <el-button type="warning" @click="openFullScreenDialog">全屏对话框</el-button>
        </div>

        <!-- 自定义头部对话框 -->
        <ScDialog v-model="customDialogVisible" width="600px" :show-close="false">
          <template #header>
            <div class="custom-header">
              <div class="header-left">
                <IconifyIconOnline icon="ri:file-list-3-line" class="header-icon" />
                <span class="header-title">数据预览</span>
              </div>
              <el-button type="primary" text circle @click="customDialogVisible = false">
                <IconifyIconOnline icon="ri:close-line" />
              </el-button>
            </div>
          </template>

          <div class="data-preview">
            <el-table :data="tableData" border stripe style="width: 100%">
              <el-table-column prop="id" label="ID" width="80"></el-table-column>
              <el-table-column prop="name" label="名称"></el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                    {{ row.status === "active" ? "启用" : "禁用" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="date" label="日期"></el-table-column>
            </el-table>
          </div>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="customDialogVisible = false">关闭</el-button>
              <el-button type="primary" @click="handleExport">导出数据</el-button>
            </div>
          </template>
        </ScDialog>

        <!-- 可拖拽对话框 -->
        <ScDialog v-model="draggableDialogVisible" title="可拖拽对话框" width="500px" draggable>
          <div class="dialog-content">
            <p>此对话框可以拖拽移动位置。</p>
            <p>尝试点击头部并拖动。</p>
            <div class="drag-demo">
              <el-empty description="拖拽演示区域"></el-empty>
            </div>
          </div>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="draggableDialogVisible = false">关闭</el-button>
            </div>
          </template>
        </ScDialog>

        <!-- 全屏对话框 -->
        <ScDialog v-model="fullScreenDialogVisible" title="全屏对话框" fullscreen>
          <div class="fullscreen-content">
            <div class="content-section">
              <h3>全屏对话框</h3>
              <p>全屏对话框适合显示大量内容或复杂的操作界面。</p>

              <el-divider></el-divider>

              <el-row :gutter="20">
                <el-col :span="8" v-for="i in 6" :key="i">
                  <el-card shadow="hover" class="fullscreen-card">
                    <template #header>
                      <div class="card-header">
                        <span>模块 {{ i }}</span>
                        <el-button type="primary" text>设置</el-button>
                      </div>
                    </template>
                    <div class="card-content">这是模块 {{ i }} 的内容区域，可以放置相关功能。</div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="fullScreenDialogVisible = false">关闭</el-button>
              <el-button type="primary" @click="handleSaveFullScreen">保存设置</el-button>
            </div>
          </template>
        </ScDialog>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScDialog 组件 API</h3>
        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="v-model / modelValue">对话框是否显示，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="title">对话框标题，类型: String</el-descriptions-item>
          <el-descriptions-item label="width">对话框宽度，类型: String，默认: 50%</el-descriptions-item>
          <el-descriptions-item label="fullscreen">是否为全屏对话框，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="top">对话框 CSS 中的 margin-top 值，类型: String，默认: 15vh</el-descriptions-item>
          <el-descriptions-item label="modal">是否需要遮罩层，类型: Boolean，默认: true</el-descriptions-item>
          <el-descriptions-item label="append-to-body">是否将对话框插入至 body 元素，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="lock-scroll">是否在对话框出现时将 body 滚动锁定，类型: Boolean，默认: true</el-descriptions-item>
          <el-descriptions-item label="custom-class">对话框的自定义类名，类型: String</el-descriptions-item>
          <el-descriptions-item label="close-on-click-modal">是否可以通过点击模态层关闭对话框，类型: Boolean，默认: true</el-descriptions-item>
          <el-descriptions-item label="close-on-press-escape">是否可以通过按下 ESC 关闭对话框，类型: Boolean，默认: true</el-descriptions-item>
          <el-descriptions-item label="show-close">是否显示关闭按钮，类型: Boolean，默认: true</el-descriptions-item>
          <el-descriptions-item label="draggable">是否可拖拽对话框，类型: Boolean，默认: false</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="open">对话框打开的回调</el-descriptions-item>
          <el-descriptions-item label="opened">对话框打开动画结束时的回调</el-descriptions-item>
          <el-descriptions-item label="close">对话框关闭的回调</el-descriptions-item>
          <el-descriptions-item label="closed">对话框关闭动画结束时的回调</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">插槽</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="default">对话框的内容</el-descriptions-item>
          <el-descriptions-item label="header">对话框标题区的内容，会替换标题部分</el-descriptions-item>
          <el-descriptions-item label="footer">对话框按钮操作区的内容</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage, ElNotification } from "element-plus";

// 基础对话框
const basicDialogVisible = ref(false);
const openBasicDialog = () => {
  basicDialogVisible.value = true;
};
const handleBasicConfirm = () => {
  ElMessage.success("操作成功");
  basicDialogVisible.value = false;
};

// 表单对话框
const formDialogVisible = ref(false);
const formRef = ref(null);

const formData = reactive({
  username: "",
  email: "",
  gender: "male",
  department: "",
});

const formRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
  ],
};

const openFormDialog = () => {
  formDialogVisible.value = true;
};

const handleFormSubmit = async () => {
  try {
    await formRef.value.validate();
    ElMessage.success("表单提交成功");
    formDialogVisible.value = false;
  } catch (error) {
    ElMessage.error("表单验证失败，请检查输入");
  }
};

// 确认对话框
const confirmDialogVisible = ref(false);
const openConfirmDialog = () => {
  confirmDialogVisible.value = true;
};
const handleConfirmDelete = () => {
  ElMessage.success("记录已删除");
  confirmDialogVisible.value = false;
};

// 自定义头部对话框
const customDialogVisible = ref(false);
const tableData = [
  { id: 1, name: "测试数据1", status: "active", date: "2023-08-15" },
  { id: 2, name: "测试数据2", status: "inactive", date: "2023-08-16" },
  { id: 3, name: "测试数据3", status: "active", date: "2023-08-17" },
  { id: 4, name: "测试数据4", status: "active", date: "2023-08-18" },
];

const openCustomDialog = () => {
  customDialogVisible.value = true;
};

const handleExport = () => {
  ElMessage.success("数据导出成功");
  customDialogVisible.value = false;
};

// 可拖拽对话框
const draggableDialogVisible = ref(false);
const openDraggableDialog = () => {
  draggableDialogVisible.value = true;
};

// 全屏对话框
const fullScreenDialogVisible = ref(false);
const openFullScreenDialog = () => {
  fullScreenDialogVisible.value = true;
};

const handleSaveFullScreen = () => {
  ElNotification({
    title: "保存成功",
    message: "全屏对话框设置已保存",
    type: "success",
  });
  fullScreenDialogVisible.value = false;
};
</script>

<style lang="scss" scoped>
.sc-dialog-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .example-buttons {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
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

  .custom-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;

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
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .data-preview {
    margin-bottom: 16px;
  }

  .drag-demo {
    height: 200px;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .fullscreen-content {
    padding: 20px;

    .content-section {
      max-width: 1200px;
      margin: 0 auto;
    }

    .fullscreen-card {
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-content {
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #909399;
      }
    }
  }

  pre {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #333;
    }
  }

  .mt-4 {
    margin-top: 16px;
  }
}
</style>
