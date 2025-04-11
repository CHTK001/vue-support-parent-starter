<template>
  <div class="sc-form-example">
    <div class="example-container">
      <div class="config-panel">
        <h3>配置面板</h3>
        <el-form :model="formConfig" label-width="120px" size="small">
          <el-form-item label="标签位置">
            <el-select v-model="formConfig.labelPosition">
              <el-option label="左对齐" value="left" />
              <el-option label="右对齐" value="right" />
              <el-option label="顶部对齐" value="top" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签宽度">
            <el-input-number v-model="formConfig.labelWidth" :min="0" :max="200" :step="10" />
          </el-form-item>
          <el-form-item label="内联模式">
            <el-switch v-model="formConfig.inline" />
          </el-form-item>
          <el-form-item label="网格列数">
            <el-input-number v-model="formConfig.cols" :min="1" :max="4" :step="1" :disabled="formConfig.inline" />
          </el-form-item>
          <el-form-item label="栅格间隔">
            <el-input-number v-model="formConfig.gutter" :min="0" :max="40" :step="8" :disabled="formConfig.inline" />
          </el-form-item>
          <el-form-item label="禁用表单">
            <el-switch v-model="formConfig.disabled" />
          </el-form-item>
          <el-form-item label="隐藏必填星号">
            <el-switch v-model="formConfig.hideRequiredAsterisk" />
          </el-form-item>
          <el-form-item label="显示错误提示">
            <el-switch v-model="formConfig.showErrorMessage" />
          </el-form-item>
          <el-form-item label="表单尺寸">
            <el-radio-group v-model="formConfig.size">
              <el-radio-button label="large">大</el-radio-button>
              <el-radio-button label="default">中</el-radio-button>
              <el-radio-button label="small">小</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <div class="preview-panel">
        <h3>基础表单预览</h3>
        <p class="example-desc">通过左侧配置面板调整表单属性，实时查看效果</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>基础表单示例</span>
            </div>
          </template>

          <ScForm
            ref="basicFormRef"
            :model="basicForm"
            :schema="basicSchema"
            :inline="formConfig.inline"
            :label-position="formConfig.labelPosition"
            :label-width="`${formConfig.labelWidth}px`"
            :cols="formConfig.cols"
            :gutter="formConfig.gutter"
            :disabled="formConfig.disabled"
            :hide-required-asterisk="formConfig.hideRequiredAsterisk"
            :show-message="formConfig.showErrorMessage"
            :size="formConfig.size"
          >
            <template #footer>
              <div class="form-footer" :class="{ 'form-footer-inline': formConfig.inline }">
                <el-button @click="resetBasicForm">重置</el-button>
                <el-button type="primary" @click="submitBasicForm">提交</el-button>
              </div>
            </template>
          </ScForm>
        </el-card>
      </div>
    </div>

    <el-divider></el-divider>
    <div class="code-panel">
      <h4>代码示例：</h4>
      <el-alert title="此代码示例会根据您在配置面板中的选择实时更新" type="info" :closable="false" show-icon style="margin-bottom: 15px" />
      <pre><code class="language-html">{{ generatedCode }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";

// 表单配置
const formConfig = reactive({
  labelPosition: "right",
  labelWidth: 100,
  inline: false,
  cols: 1,
  gutter: 0,
  disabled: false,
  hideRequiredAsterisk: false,
  showErrorMessage: true,
  size: "default",
});

// 基础表单数据
const basicForm = reactive({
  name: "",
  age: "",
  gender: "",
  interest: [],
  email: "",
  address: "",
});

// 基础表单 schema
const basicSchema = [
  {
    field: "name",
    label: "姓名",
    component: "Input",
    componentProps: {
      placeholder: "请输入姓名",
    },
    rules: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  },
  {
    field: "age",
    label: "年龄",
    component: "InputNumber",
    componentProps: {
      placeholder: "请输入年龄",
      min: 1,
      max: 120,
    },
  },
  {
    field: "gender",
    label: "性别",
    component: "Radio",
    componentProps: {
      options: [
        { label: "男", value: "male" },
        { label: "女", value: "female" },
        { label: "其他", value: "other" },
      ],
    },
  },
  {
    field: "interest",
    label: "兴趣爱好",
    component: "Checkbox",
    componentProps: {
      options: [
        { label: "阅读", value: "reading" },
        { label: "音乐", value: "music" },
        { label: "运动", value: "sports" },
        { label: "旅行", value: "travel" },
        { label: "摄影", value: "photography" },
      ],
    },
  },
  {
    field: "email",
    label: "邮箱",
    component: "Input",
    componentProps: {
      placeholder: "请输入邮箱地址",
      type: "email",
    },
    rules: [
      { required: true, message: "请输入邮箱地址", trigger: "blur" },
      { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
    ],
  },
  {
    field: "address",
    label: "地址",
    component: "Input",
    componentProps: {
      placeholder: "请输入地址",
      type: "textarea",
      rows: 3,
    },
  },
];

// 表单引用
const basicFormRef = ref(null);

// 重置表单
const resetBasicForm = () => {
  basicFormRef.value.resetFields();
  ElMessage.info("表单已重置");
};

// 提交表单
const submitBasicForm = () => {
  basicFormRef.value.validate((valid, fields) => {
    if (valid) {
      ElMessage.success("表单验证通过，提交的数据：" + JSON.stringify(basicForm));
    } else {
      ElMessage.error("表单验证失败: " + JSON.stringify(fields));
    }
  });
};

// 生成代码示例
const generatedCode = computed(() => {
  let code = `<ScForm 
  :model="form" 
  :schema="schema"`;

  if (formConfig.labelPosition !== "right") {
    code += `\n  label-position="${formConfig.labelPosition}"`;
  }

  if (formConfig.labelWidth !== 100) {
    code += `\n  label-width="${formConfig.labelWidth}px"`;
  }

  if (formConfig.inline) {
    code += `\n  inline`;
  }

  if (!formConfig.inline && formConfig.cols !== 1) {
    code += `\n  :cols="${formConfig.cols}"`;
  }

  if (!formConfig.inline && formConfig.gutter !== 0) {
    code += `\n  :gutter="${formConfig.gutter}"`;
  }

  if (formConfig.disabled) {
    code += `\n  disabled`;
  }

  if (formConfig.hideRequiredAsterisk) {
    code += `\n  hide-required-asterisk`;
  }

  if (!formConfig.showErrorMessage) {
    code += `\n  :show-message="false"`;
  }

  if (formConfig.size !== "default") {
    code += `\n  size="${formConfig.size}"`;
  }

  code += `\n>
  <template #footer>
    <div class="form-footer${formConfig.inline ? " form-footer-inline" : ""}">
      <el-button @click="resetForm">重置</el-button>
      <el-button type="primary" @click="submitForm">提交</el-button>
    </div>
  </template>
</ScForm>

// 表单数据
const form = reactive({
  name: '',
  age: '',
  gender: '',
  interest: [],
  email: '',
  address: ''
});

// 表单 schema 配置
const schema = [
  {
    field: 'name',
    label: '姓名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入姓名'
    },
    rules: [
      { required: true, message: '请输入姓名', trigger: 'blur' }
    ]
  },
  {
    field: 'age',
    label: '年龄',
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入年龄',
      min: 1,
      max: 120
    }
  },
  // ... 其他字段
];`;

  return code;
});
</script>

<style lang="scss" scoped>
.example-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.config-panel {
  width: 300px;
  flex-shrink: 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
}

.preview-panel {
  flex-grow: 1;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.code-panel {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
}

.example-desc {
  color: #666;
  margin-bottom: 15px;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
  white-space: pre;
}

.example-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;

  &-inline {
    display: inline-flex;
    margin-left: 10px;
  }
}
</style>
