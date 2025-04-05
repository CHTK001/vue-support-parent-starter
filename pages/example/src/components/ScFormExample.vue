<template>
  <div class="sc-form-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础表单</h3>
        <p class="example-desc">ScForm 组件基于 Element Plus 的表单组件封装，提供了更便捷的表单处理能力</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>基础表单示例</span>
            </div>
          </template>

          <ScForm ref="basicFormRef" :model="basicForm" :schema="basicSchema" label-width="100px">
            <template #footer>
              <div class="form-footer">
                <el-button @click="resetBasicForm">重置</el-button>
                <el-button type="primary" @click="submitBasicForm">提交</el-button>
              </div>
            </template>
          </ScForm>
        </el-card>

        <el-divider content-position="left">代码示例</el-divider>

        <pre><code>
&lt;ScForm
  ref="formRef"
  :model="form"
  :schema="schema"
  label-width="100px"
&gt;
  &lt;template #footer&gt;
    &lt;div class="form-footer"&gt;
      &lt;el-button @click="resetForm"&gt;重置&lt;/el-button&gt;
      &lt;el-button type="primary" @click="submitForm"&gt;提交&lt;/el-button&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/ScForm&gt;

// script setup 部分
const form = reactive({
  name: '',
  age: '',
  gender: '',
  interest: []
});

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
  {
    field: 'gender',
    label: '性别',
    component: 'Radio',
    componentProps: {
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' }
      ]
    }
  },
  {
    field: 'interest',
    label: '兴趣爱好',
    component: 'Checkbox',
    componentProps: {
      options: [
        { label: '阅读', value: 'reading' },
        { label: '音乐', value: 'music' },
        { label: '运动', value: 'sports' }
      ]
    }
  }
]
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="高级配置">
        <h3>表单高级配置</h3>
        <p class="example-desc">ScForm 支持动态表单项、条件渲染、自定义组件等高级功能</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>动态表单</span>
              <el-button type="primary" link @click="addFormItem">
                <IconifyIconOnline icon="ep:plus" />
                添加字段
              </el-button>
            </div>
          </template>

          <ScForm ref="dynamicFormRef" :model="dynamicForm" :schema="dynamicSchema" label-width="100px" cols="2">
            <template #footer>
              <div class="form-footer">
                <el-button @click="resetDynamicForm">重置</el-button>
                <el-button type="danger" @click="removeLastField">删除最后一项</el-button>
                <el-button type="primary" @click="submitDynamicForm">提交</el-button>
              </div>
            </template>
          </ScForm>
        </el-card>

        <el-card class="example-card mt-4">
          <template #header>
            <div class="card-header">
              <span>条件表单</span>
            </div>
          </template>

          <ScForm ref="conditionalFormRef" :model="conditionalForm" :schema="conditionalSchema" label-width="120px">
            <template #footer>
              <div class="form-footer">
                <el-button @click="resetConditionalForm">重置</el-button>
                <el-button type="primary" @click="submitConditionalForm">提交</el-button>
              </div>
            </template>
          </ScForm>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="表单布局">
        <h3>表单布局</h3>
        <p class="example-desc">ScForm 支持多种布局方式，包括行内表单、网格布局等</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>网格布局表单</span>
            </div>
          </template>

          <ScForm ref="gridFormRef" :model="gridForm" :schema="gridSchema" label-width="100px" cols="3">
            <template #footer>
              <div class="form-footer">
                <el-button @click="resetGridForm">重置</el-button>
                <el-button type="primary" @click="submitGridForm">提交</el-button>
              </div>
            </template>
          </ScForm>
        </el-card>

        <el-card class="example-card mt-4">
          <template #header>
            <div class="card-header">
              <span>行内表单</span>
            </div>
          </template>

          <ScForm ref="inlineFormRef" :model="inlineForm" :schema="inlineSchema" inline>
            <template #footer>
              <div class="form-footer-inline">
                <el-button @click="resetInlineForm">重置</el-button>
                <el-button type="primary" @click="submitInlineForm">搜索</el-button>
              </div>
            </template>
          </ScForm>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScForm 组件 API</h3>

        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="model">表单数据对象，类型: Object，必填</el-descriptions-item>
          <el-descriptions-item label="schema">表单配置项数组，类型: Array，必填</el-descriptions-item>
          <el-descriptions-item label="rules">表单验证规则，类型: Object</el-descriptions-item>
          <el-descriptions-item label="inline">行内表单模式，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="label-position">表单标签的位置，类型: String，可选值: right/left/top，默认: right</el-descriptions-item>
          <el-descriptions-item label="label-width">表单标签的宽度，类型: String，默认: auto</el-descriptions-item>
          <el-descriptions-item label="label-suffix">表单标签的后缀，类型: String</el-descriptions-item>
          <el-descriptions-item label="hide-required-asterisk">是否隐藏必填字段的标签旁边的红色星号，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="cols">表单项每行的列数，类型: Number，默认: 1</el-descriptions-item>
          <el-descriptions-item label="gutter">表单项之间的间隔，类型: Number，默认: 0</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">schema 配置项</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="field">表单字段名，与 model 中的属性对应</el-descriptions-item>
          <el-descriptions-item label="label">表单项标签</el-descriptions-item>
          <el-descriptions-item label="component">组件类型，如 Input、Select、Radio 等</el-descriptions-item>
          <el-descriptions-item label="componentProps">组件属性对象，传递给对应组件</el-descriptions-item>
          <el-descriptions-item label="rules">表单项验证规则数组</el-descriptions-item>
          <el-descriptions-item label="span">项目占据的列数，用于网格布局</el-descriptions-item>
          <el-descriptions-item label="show">条件函数，返回布尔值决定是否显示该项</el-descriptions-item>
          <el-descriptions-item label="slots">插槽配置对象，用于自定义内容</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">方法</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="validate">对整个表单进行验证，返回 Promise</el-descriptions-item>
          <el-descriptions-item label="validateField">对部分表单字段进行验证</el-descriptions-item>
          <el-descriptions-item label="resetFields">对整个表单进行重置，将所有字段值重置为初始值</el-descriptions-item>
          <el-descriptions-item label="scrollToField">滚动到指定表单字段位置</el-descriptions-item>
          <el-descriptions-item label="clearValidate">移除表单项的校验结果</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">插槽</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="footer">表单底部区域，通常用于放置提交/重置按钮</el-descriptions-item>
          <el-descriptions-item label="[field]-prefix">指定字段的输入框前缀</el-descriptions-item>
          <el-descriptions-item label="[field]-suffix">指定字段的输入框后缀</el-descriptions-item>
          <el-descriptions-item label="[field]">完全自定义指定字段的内容</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage, ElNotification } from "element-plus";

// 基础表单示例
const basicFormRef = ref(null);
const basicForm = reactive({
  name: "",
  age: "",
  gender: "",
  interest: [],
});

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
      ],
    },
  },
];

const resetBasicForm = () => {
  basicFormRef.value.resetFields();
  ElMessage.info("表单已重置");
};

const submitBasicForm = async () => {
  try {
    await basicFormRef.value.validate();
    ElMessage.success("表单验证通过");
    console.log("表单数据:", basicForm);
  } catch (error) {
    ElMessage.error("表单验证失败");
  }
};

// 动态表单示例
const dynamicFormRef = ref(null);
const dynamicForm = reactive({
  name: "",
  email: "",
  custom1: "",
  custom2: "",
  custom3: "",
});

const dynamicSchema = ref([
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
    field: "email",
    label: "邮箱",
    component: "Input",
    componentProps: {
      placeholder: "请输入邮箱",
    },
    rules: [
      { required: true, message: "请输入邮箱", trigger: "blur" },
      { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
    ],
  },
]);

let customFieldCount = 0;

const addFormItem = () => {
  if (customFieldCount >= 3) {
    ElMessage.warning("最多只能添加3个自定义字段");
    return;
  }

  customFieldCount++;
  const fieldName = `custom${customFieldCount}`;

  dynamicSchema.value.push({
    field: fieldName,
    label: `自定义字段${customFieldCount}`,
    component: "Input",
    componentProps: {
      placeholder: `请输入自定义字段${customFieldCount}`,
    },
  });

  ElMessage.success(`已添加自定义字段${customFieldCount}`);
};

const removeLastField = () => {
  if (dynamicSchema.value.length <= 2) {
    ElMessage.warning("基础字段不能删除");
    return;
  }

  dynamicSchema.value.pop();
  customFieldCount--;

  ElMessage.success("已删除最后一个字段");
};

const resetDynamicForm = () => {
  dynamicFormRef.value.resetFields();
  ElMessage.info("表单已重置");
};

const submitDynamicForm = async () => {
  try {
    await dynamicFormRef.value.validate();
    ElMessage.success("表单验证通过");
    console.log("动态表单数据:", dynamicForm);
  } catch (error) {
    ElMessage.error("表单验证失败");
  }
};

// 条件表单示例
const conditionalFormRef = ref(null);
const conditionalForm = reactive({
  contactType: "email",
  email: "",
  phone: "",
  address: {
    province: "",
    city: "",
    detail: "",
  },
  needInvoice: false,
  invoiceType: "",
  invoiceTitle: "",
});

const conditionalSchema = [
  {
    field: "contactType",
    label: "联系方式类型",
    component: "Radio",
    componentProps: {
      options: [
        { label: "邮箱", value: "email" },
        { label: "电话", value: "phone" },
      ],
    },
  },
  {
    field: "email",
    label: "邮箱地址",
    component: "Input",
    componentProps: {
      placeholder: "请输入邮箱地址",
    },
    rules: [
      { required: true, message: "请输入邮箱地址", trigger: "blur" },
      { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
    ],
    show: (formModel) => formModel.contactType === "email",
  },
  {
    field: "phone",
    label: "电话号码",
    component: "Input",
    componentProps: {
      placeholder: "请输入电话号码",
    },
    rules: [
      { required: true, message: "请输入电话号码", trigger: "blur" },
      { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" },
    ],
    show: (formModel) => formModel.contactType === "phone",
  },
  {
    field: "address.province",
    label: "省份",
    component: "Select",
    componentProps: {
      placeholder: "请选择省份",
      options: [
        { label: "北京市", value: "beijing" },
        { label: "上海市", value: "shanghai" },
        { label: "广东省", value: "guangdong" },
      ],
    },
  },
  {
    field: "address.city",
    label: "城市",
    component: "Select",
    componentProps: {
      placeholder: "请选择城市",
    },
    show: (formModel) => !!formModel.address.province,
  },
  {
    field: "address.detail",
    label: "详细地址",
    component: "Input",
    componentProps: {
      type: "textarea",
      placeholder: "请输入详细地址",
    },
    show: (formModel) => !!formModel.address.city,
  },
  {
    field: "needInvoice",
    label: "是否需要发票",
    component: "Switch",
  },
  {
    field: "invoiceType",
    label: "发票类型",
    component: "Radio",
    componentProps: {
      options: [
        { label: "电子发票", value: "electronic" },
        { label: "纸质发票", value: "paper" },
      ],
    },
    show: (formModel) => formModel.needInvoice,
  },
  {
    field: "invoiceTitle",
    label: "发票抬头",
    component: "Input",
    componentProps: {
      placeholder: "请输入发票抬头",
    },
    show: (formModel) => formModel.needInvoice && formModel.invoiceType,
  },
];

const resetConditionalForm = () => {
  conditionalFormRef.value.resetFields();
  ElMessage.info("表单已重置");
};

const submitConditionalForm = async () => {
  try {
    await conditionalFormRef.value.validate();
    ElMessage.success("表单验证通过");
    console.log("条件表单数据:", conditionalForm);
  } catch (error) {
    ElMessage.error("表单验证失败");
  }
};

// 网格布局表单示例
const gridFormRef = ref(null);
const gridForm = reactive({
  name: "",
  age: "",
  gender: "",
  department: "",
  email: "",
  phone: "",
  address: "",
  remark: "",
});

const gridSchema = [
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
      ],
    },
  },
  {
    field: "department",
    label: "部门",
    component: "Select",
    componentProps: {
      placeholder: "请选择部门",
      options: [
        { label: "技术部", value: "tech" },
        { label: "市场部", value: "market" },
        { label: "财务部", value: "finance" },
      ],
    },
  },
  {
    field: "email",
    label: "邮箱",
    component: "Input",
    componentProps: {
      placeholder: "请输入邮箱",
    },
    rules: [{ type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }],
  },
  {
    field: "phone",
    label: "电话",
    component: "Input",
    componentProps: {
      placeholder: "请输入电话",
    },
  },
  {
    field: "address",
    label: "地址",
    component: "Input",
    componentProps: {
      placeholder: "请输入地址",
    },
    span: 3,
  },
  {
    field: "remark",
    label: "备注",
    component: "Input",
    componentProps: {
      type: "textarea",
      placeholder: "请输入备注信息",
    },
    span: 3,
  },
];

const resetGridForm = () => {
  gridFormRef.value.resetFields();
  ElMessage.info("表单已重置");
};

const submitGridForm = async () => {
  try {
    await gridFormRef.value.validate();
    ElMessage.success("表单验证通过");
    console.log("网格表单数据:", gridForm);
  } catch (error) {
    ElMessage.error("表单验证失败");
  }
};

// 行内表单示例
const inlineFormRef = ref(null);
const inlineForm = reactive({
  keyword: "",
  status: "",
  dateRange: [],
});

const inlineSchema = [
  {
    field: "keyword",
    label: "关键字",
    component: "Input",
    componentProps: {
      placeholder: "请输入关键字",
    },
  },
  {
    field: "status",
    label: "状态",
    component: "Select",
    componentProps: {
      placeholder: "请选择状态",
      clearable: true,
      options: [
        { label: "启用", value: "active" },
        { label: "禁用", value: "inactive" },
      ],
    },
  },
  {
    field: "dateRange",
    label: "日期范围",
    component: "DatePicker",
    componentProps: {
      type: "daterange",
      rangeSeparator: "至",
      startPlaceholder: "开始日期",
      endPlaceholder: "结束日期",
    },
  },
];

const resetInlineForm = () => {
  inlineFormRef.value.resetFields();
  ElMessage.info("表单已重置");
};

const submitInlineForm = async () => {
  try {
    await inlineFormRef.value.validate();
    ElMessage.success("搜索条件已提交");
    console.log("搜索表单数据:", inlineForm);
  } catch (error) {
    ElMessage.error("表单验证失败");
  }
};
</script>

<style lang="scss" scoped>
.sc-form-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
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
  }

  .form-footer-inline {
    display: inline-flex;
    gap: 10px;
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
