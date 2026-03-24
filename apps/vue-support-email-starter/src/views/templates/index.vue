<template>
  <div class="template-management">
    <div class="toolbar">
      <h2>邮件模板</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新建模板
      </el-button>
    </div>

    <el-table v-loading="loading" :data="templates" style="width: 100%">
      <el-table-column prop="name" label="模板名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column label="格式" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.isHtml ? 'success' : 'info'" size="small">
            {{ scope.row.isHtml ? "HTML" : "文本" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="previewTemplate(scope.row)">
            <el-icon><View /></el-icon>
            预览
          </el-button>
          <el-button size="small" @click="editTemplate(scope.row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="deleteTemplate(scope.row)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑模板对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模板' : '新建模板'"
      width="700px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" placeholder="输入模板名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="输入模板描述"
          />
        </el-form-item>

        <el-form-item label="邮件主题" prop="subject">
          <el-input v-model="form.subject" placeholder="支持变量: ${varName}" />
        </el-form-item>

        <el-form-item label="格式">
          <el-radio-group v-model="form.isHtml">
            <el-radio :label="false">纯文本</el-radio>
            <el-radio :label="true">HTML</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="10"
            placeholder="支持变量: ${varName}"
          />
        </el-form-item>

        <el-form-item label="变量说明">
          <el-alert
            title="使用 ${变量名} 格式插入变量，例如: ${userName}, ${appName}"
            type="info"
            :closable="false"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTemplate">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="模板预览" width="700px">
      <div class="preview-section">
        <h4>主题</h4>
        <p>{{ previewData.subject }}</p>

        <h4>内容</h4>
        <div
          v-if="previewData.isHtml"
          class="html-preview"
          v-html="previewData.content"
        ></div>
        <pre v-else class="text-preview">{{ previewData.content }}</pre>

        <h4>测试渲染</h4>
        <el-form :inline="true">
          <el-form-item
            v-for="(value, key) in testVariables"
            :key="key"
            :label="key"
          >
            <el-input v-model="testVariables[key]" size="small" />
          </el-form-item>
        </el-form>
        <el-button size="small" @click="renderPreview">渲染</el-button>

        <div v-if="renderedContent" class="rendered-section">
          <h4>渲染结果</h4>
          <p><strong>主题:</strong> {{ renderedSubject }}</p>
          <div
            v-if="previewData.isHtml"
            class="html-preview"
            v-html="renderedContent"
          ></div>
          <pre v-else class="text-preview">{{ renderedContent }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
} from "element-plus";
import { Plus, View, Edit, Delete } from "@element-plus/icons-vue";
import { templateApi } from "../../api/email";

const templates = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const previewVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();

const form = ref({
});

const previewData = ref({
});

const testVariables = ref<Record<string, string>>({
});

const renderedSubject = ref("");
const renderedContent = ref("");

const rules: FormRules = {
};

const loadTemplates = async () => {
  loading.value = true;
  try {
    const res: any = await templateApi.getTemplateList();
    if (res.success) {
      templates.value = res.data || [];
    }
  } catch (error) {
    ElMessage.error("加载模板列表失败");
  } finally {
    loading.value = false;
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  form.value = {
    id: "",
    name: "",
    description: "",
    subject: "",
    content: "",
    isHtml: false,
  };
  dialogVisible.value = true;
};

const editTemplate = (row: any) => {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
};

const saveTemplate = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        await templateApi.saveTemplate(form.value);
        ElMessage.success(isEdit.value ? "模板更新成功" : "模板创建成功");
        dialogVisible.value = false;
        loadTemplates();
      } catch (error: any) {
        ElMessage.error(error.message || "保存失败");
      } finally {
        saving.value = false;
      }
    }
  });
};

const deleteTemplate = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除模板 "${row.name}" 吗？`, "提示", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });

    await templateApi.deleteTemplate(row.id);
    ElMessage.success("模板删除成功");
    loadTemplates();
  } catch (error) {
    // 用户取消
  }
};

const previewTemplate = (row: any) => {
  previewData.value = { ...row };
  renderedContent.value = "";
  renderedSubject.value = "";
  previewVisible.value = true;
};

const renderPreview = async () => {
  try {
    const res: any = await templateApi.renderTemplate(
      previewData.value.id,
      testVariables.value,
    );
    if (res.success) {
      renderedSubject.value = res.data.subject;
      renderedContent.value = res.data.content;
    }
  } catch (error: any) {
    ElMessage.error(error.message || "渲染失败");
  }
};

const formatDate = (date: any) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN");
};

onMounted(() => {
  loadTemplates();
});
</script>

<style scoped>
.template-management {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar h2 {
  margin: 0;
}

.preview-section {
  padding: 10px;
}

.preview-section h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
}

.html-preview {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
  background: #f9f9f9;
  min-height: 100px;
}

.text-preview {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
  background: #f9f9f9;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.rendered-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
